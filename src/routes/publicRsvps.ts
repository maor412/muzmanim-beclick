import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, like } from 'drizzle-orm';
import { initDb } from '../db';
import { rsvps, events, eventSettings, guests, seating, tables } from '../db/schema';
import { rsvpRateLimiter } from '../middleware/rateLimit';
import { 
  createRsvpSchema 
} from '../lib/validators';
import { 
  generateId, 
  formatPhoneE164,
  AppError 
} from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const publicRsvpsRouter = new Hono<{ Bindings: Bindings }>();

/**
 * קבלת פרטי אירוע לטופס RSVP (ציבורי)
 * GET /api/rsvp/:slug/event
 */
publicRsvpsRouter.get('/:slug/event', async (c) => {
  console.log('🔵 PUBLIC RSVP ROUTE CALLED:', c.req.param('slug'));
  const db = initDb(c.env.DB);
  const slug = c.req.param('slug');

  try {
    const event = await db.select().from(events).where(eq(events.slug, slug)).get();

    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    // Return only public-facing event details
    return c.json({
      success: true,
      event: {
        id: event.id,
        eventName: event.eventName,
        coupleNames: event.coupleNames,
        dateTime: event.dateTime,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        wazeLink: event.wazeLink,
        notes: event.notes,
        isRsvpOpen: event.isRsvpOpen,
        requirePhone: event.requirePhone,
        showMealChoice: event.showMealChoice,
        showAllergies: event.showAllergies,
        showNotes: event.showNotes,
        allowUpdates: event.allowUpdates,
        consentMessage: event.consentMessage,
        slug: event.slug
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'שגיאה בטעינת פרטי האירוע', 'SERVER_ERROR');
  }
});

/**
 * יצירת RSVP חדש (ציבורי - ללא אימות)
 * POST /api/rsvp/:slug
 */
publicRsvpsRouter.post('/:slug', rsvpRateLimiter, zValidator('json', createRsvpSchema), async (c) => {
  const db = initDb(c.env.DB);
  const slug = c.req.param('slug');
  const data = c.req.valid('json');

  try {
    // מציאת האירוע לפי slug
    const event = await db.select().from(events).where(eq(events.slug, slug)).get();

    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    // בדיקה שה-RSVP פתוח
    if (!event.isRsvpOpen) {
      throw new AppError(403, 'מצטערים, אישורי הגעה לאירוע זה נסגרו', 'RSVP_CLOSED');
    }

    // בדיקת lock date
    if (event.lockDate && new Date(event.lockDate) < new Date()) {
      throw new AppError(403, 'מצטערים, אישורי הגעה לאירוע זה לא זמינים יותר', 'RSVP_LOCKED');
    }

    // קבלת הגדרות האירוע
    const settings = await db
      .select()
      .from(eventSettings)
      .where(eq(eventSettings.eventId, event.id))
      .get();

    // בדיקה אם טלפון נדרש
    if (settings?.requirePhone && !data.phone) {
      throw new AppError(400, 'מספר טלפון נדרש לאירוע זה', 'PHONE_REQUIRED');
    }

    // בדיקת כפילויות - בדוק אם קיים RSVP או Guest עם אותו שם/טלפון
    let existingRsvp = null;
    let existingGuest = null;
    
    if (data.phone) {
      const formattedPhone = formatPhoneE164(data.phone);
      
      // בדיקה ב-RSVPs לפי טלפון
      existingRsvp = await db
        .select()
        .from(rsvps)
        .where(
          and(
            eq(rsvps.eventId, event.id),
            eq(rsvps.phone, formattedPhone)
          )
        )
        .get();
      
      // בדיקה ב-Guests לפי שם (עדיפות ראשונה)
      if (!existingRsvp) {
        existingGuest = await db
          .select()
          .from(guests)
          .where(
            and(
              eq(guests.eventId, event.id),
              eq(guests.fullName, data.fullName.trim())
            )
          )
          .get();
        
        // אם לא נמצא לפי שם, נסה לפי טלפון (פורמט מקורי)
        if (!existingGuest) {
          existingGuest = await db
            .select()
            .from(guests)
            .where(
              and(
                eq(guests.eventId, event.id),
                eq(guests.phone, data.phone)
              )
            )
            .get();
        }
        
        // אם לא נמצא, נסה לפי טלפון (E164)
        if (!existingGuest) {
          existingGuest = await db
            .select()
            .from(guests)
            .where(
              and(
                eq(guests.eventId, event.id),
                eq(guests.phone, formattedPhone)
              )
            )
            .get();
        }
      }
    } else {
      // אם אין טלפון ב-RSVP, בדוק לפי שם מדויק בלבד
      existingRsvp = await db
        .select()
        .from(rsvps)
        .where(
          and(
            eq(rsvps.eventId, event.id),
            eq(rsvps.fullName, data.fullName.trim())
          )
        )
        .get();
      
      if (!existingRsvp) {
        existingGuest = await db
          .select()
          .from(guests)
          .where(
            and(
              eq(guests.eventId, event.id),
              eq(guests.fullName, data.fullName.trim())
            )
          )
          .get();
      }
    }
    
    // אם נמצא Guest קיים - נבדוק אם אפשר לשמור על ההושבה
    let removalNote = null;
    let existingSeating = null;
    if (existingGuest && !existingRsvp) {
      console.log(`🔄 Found existing guest "${existingGuest.fullName}", converting to RSVP`);
      
      // בדוק אם ה-Guest יושב בשולחן (שמור את זה לפני מחיקת ה-Guest)
      existingSeating = await db
        .select()
        .from(seating)
        .where(eq(seating.guestId, existingGuest.id))
        .get();
      
      if (existingSeating) {
        // טען את פרטי השולחן
        const table = await db
          .select()
          .from(tables)
          .where(eq(tables.id, existingSeating.tableId))
          .get();
        
        if (table) {
          // חשב כמה מקומות תפוסים בשולחן (כולל ה-RSVP החדש)
          const tableSeating = await db
            .select()
            .from(seating)
            .where(eq(seating.tableId, existingSeating.tableId))
            .all();
          
          // חשב תפוסה נוכחית - ספור גם Guests וגם RSVPs
          let totalOccupied = 0;
          
          for (const s of tableSeating) {
            if (s.guestId === existingGuest.id) {
              // דלג על האורח הנוכחי
              continue;
            }
            
            if (s.rsvpId) {
              // טען את ה-RSVP וספור את attendingCount
              const rsvp = await db
                .select()
                .from(rsvps)
                .where(eq(rsvps.id, s.rsvpId))
                .get();
              
              if (rsvp) {
                totalOccupied += rsvp.attendingCount || 1;
              }
            } else if (s.guestId) {
              // Guest = 1 אדם
              totalOccupied += 1;
            }
          }
          
          const newAttendingCount = data.attendingCount || 1;
          const availableSeats = table.capacity - totalOccupied;
          
          console.log(`📊 Table "${table.tableName}": capacity=${table.capacity}, occupied=${totalOccupied}, new=${newAttendingCount}, available=${availableSeats}`);
          
          if (newAttendingCount <= availableSeats) {
            // יש מקום - נעדכן את ההושבה מ-Guest ל-RSVP (לאחר יצירת ה-RSVP)
            console.log(`✅ Keeping seating at table "${table.tableName}"`);
          } else {
            // אין מקום - נמחק את ההושבה ונוסיף הערה
            console.log(`❌ Not enough space at table "${table.tableName}" (need ${newAttendingCount}, have ${availableSeats})`);
            removalNote = `הוסר משולחן ${table.tableName}: מספר המלווים (${newAttendingCount}) חורג מהמקומות הפנויים.`;
            
            await db
              .delete(seating)
              .where(eq(seating.id, existingSeating.id))
              .run();
            
            // אפס את existingSeating כדי שלא ננסה לעדכן אותה מאוחר יותר
            existingSeating = null;
          }
        }
      }
      
      // מחק את ה-Guest (ההושבה כבר טופלה למעלה)
      await db
        .delete(guests)
        .where(eq(guests.id, existingGuest.id))
        .run();
    }

    // אם קיים RSVP ו-allowUpdates מופעל, נעדכן במקום ליצור
    if (existingRsvp && event.allowUpdates) {
      await db
        .update(rsvps)
        .set({
          fullName: data.fullName,
          phone: data.phone ? formatPhoneE164(data.phone) : null,
          attendingCount: data.attendingCount,
          mealChoice: data.mealChoice || null,
          allergies: data.allergies || null,
          comment: data.comment || null,
          consentUpdates: data.consentUpdates ? 1 : 0,
          updatedAt: new Date().toISOString()
        })
        .where(eq(rsvps.id, existingRsvp.id))
        .run();

      return c.json({
        success: true,
        message: 'אישור ההגעה עודכן בהצלחה',
        rsvp: {
          id: existingRsvp.id,
          attendingCount: data.attendingCount,
          status: data.attendingCount > 0 ? 'confirmed' : 'declined'
        }
      });
    }

    // אם קיים RSVP אבל לא מותר לעדכן
    if (existingRsvp && !event.allowUpdates) {
      throw new AppError(409, 'נראה שכבר שלחת אישור הגעה. אם ברצונך לעדכן, אנא צור קשר עם בעלי האירוע', 'DUPLICATE_RSVP');
    }

    // יצירת RSVP חדש
    const rsvpId = generateId();
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';

    // אם יש הערת הסרה משולחן, נוסיף אותה ל-comment
    let finalComment = data.comment || null;
    if (removalNote) {
      finalComment = finalComment ? `${finalComment}\n\n${removalNote}` : removalNote;
    }

    await db.insert(rsvps).values({
      id: rsvpId,
      eventId: event.id,
      fullName: data.fullName,
      phone: data.phone ? formatPhoneE164(data.phone) : null,
      attendingCount: data.attendingCount,
      mealChoice: data.mealChoice || null,
      allergies: data.allergies || null,
      comment: finalComment,
      consentUpdates: data.consentUpdates ? 1 : 0,
      ipAddress,
      userAgent
    });

    // אם יש הושבה שנשמרה (existingGuest היה מושב ויש מקום), עדכן אותה ל-RSVP
    if (existingSeating) {
      console.log(`🔄 Updating seating from Guest to RSVP`);
      await db
        .update(seating)
        .set({
          guestId: null,
          rsvpId: rsvpId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(seating.id, existingSeating.id))
        .run();
    }

    return c.json({
      success: true,
      message: 'תודה רבה! אישור ההגעה נשמר בהצלחה',
      rsvp: {
        id: rsvpId,
        attendingCount: data.attendingCount,
        status: data.attendingCount > 0 ? 'confirmed' : 'declined'
      }
    }, 201);

  } catch (error) {
    console.error('Error creating public RSVP:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה ביצירת אישור הגעה. אנא נסו שוב' 
    }, 500);
  }
});

export default publicRsvpsRouter;
