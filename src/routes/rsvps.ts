import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, like } from 'drizzle-orm';
import { initDb } from '../db';
import { rsvps, events, eventSettings } from '../db/schema';
import { rsvpRateLimiter, apiRateLimiter } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { 
  createRsvpSchema, 
  updateRsvpSchema 
} from '../lib/validators';
import { 
  generateId, 
  formatPhoneE164,
  AppError 
} from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const rsvpsRouter = new Hono<{ Bindings: Bindings }>();

/**
 * יצירת RSVP חדש (ציבורי - ללא אימות)
 * POST /api/rsvp/:slug
 */
rsvpsRouter.post('/:slug', rsvpRateLimiter, zValidator('json', createRsvpSchema), async (c) => {
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

    // בדיקת כפילויות (אותו שם + טלפון)
    if (data.phone) {
      const formattedPhone = formatPhoneE164(data.phone);
      const existing = await db
        .select()
        .from(rsvps)
        .where(
          and(
            eq(rsvps.eventId, event.id),
            eq(rsvps.phone, formattedPhone)
          )
        )
        .get();

      if (existing && settings?.allowUpdates) {
        // אם יש הגדרה לאפשר עדכונים, נבצע עדכון במקום יצירה
        throw new AppError(409, 'נראה שכבר שלחת אישור הגעה. אם ברצונך לעדכן, אנא צור קשר עם בעלי האירוע', 'DUPLICATE_RSVP');
      }
    }

    // קבלת IP ו-User Agent
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';

    // יצירת RSVP
    const rsvpId = generateId();
    await db.insert(rsvps).values({
      id: rsvpId,
      eventId: event.id,
      fullName: data.fullName,
      phone: data.phone ? formatPhoneE164(data.phone) : null,
      attendingCount: data.attendingCount,
      mealChoice: data.mealChoice || null,
      allergies: data.allergies || null,
      comment: data.comment || null,
      consentUpdates: data.consentUpdates ? 1 : 0,
      ipAddress,
      userAgent
    });

    // רישום audit log
    await logAudit(c, 'CREATE_RSVP', 'rsvp', rsvpId, { 
      eventId: event.id,
      fullName: data.fullName,
      attendingCount: data.attendingCount
    });

    const newRsvp = await db.select().from(rsvps).where(eq(rsvps.id, rsvpId)).get();

    return c.json({
      success: true,
      message: 'תודה רבה! אישור ההגעה נשלח בהצלחה',
      rsvp: newRsvp,
      confirmationId: rsvpId.slice(0, 8)
    }, 201);

  } catch (error) {
    console.error('Error creating RSVP:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בשליחת אישור ההגעה. אנא נסה שוב' 
    }, 500);
  }
});

/**
 * קבלת כל ה-RSVPs של אירוע (רק לבעלים)
 * GET /api/events/:eventId/rsvps
 */
rsvpsRouter.get('/events/:eventId/rsvps', requireAuth, apiRateLimiter, async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const eventId = c.req.param('eventId');
  const search = c.req.query('search') || '';

  try {
    // בדיקת בעלות על האירוע
    const event = await db.select().from(events).where(eq(events.id, eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    // בדיקה שהמשתמש הוא הבעלים
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה לצפות ב-RSVPs אלה', 'FORBIDDEN');
    }

    // שליפת RSVPs עם סינון אופציונלי
    let query = db.select().from(rsvps).where(eq(rsvps.eventId, eventId));

    const allRsvps = await query.orderBy(desc(rsvps.createdAt)).all();

    // סינון בצד הקליינט אם יש חיפוש
    const filtered = search 
      ? allRsvps.filter(r => 
          r.fullName.toLowerCase().includes(search.toLowerCase()) ||
          r.phone?.includes(search)
        )
      : allRsvps;

    // חישוב סטטיסטיקות
    const totalRsvps = filtered.length;
    const totalAttending = filtered.reduce((sum, r) => sum + r.attendingCount, 0);
    const withPhone = filtered.filter(r => r.phone).length;
    const consentedUpdates = filtered.filter(r => r.consentUpdates).length;

    return c.json({
      success: true,
      rsvps: filtered,
      stats: {
        totalRsvps,
        totalAttending,
        withPhone,
        consentedUpdates
      }
    });

  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת אישורי ההגעה' 
    }, 500);
  }
});

/**
 * עדכון RSVP (רק לבעלים)
 * PUT /api/rsvps/:id
 */
rsvpsRouter.put('/:id', requireAuth, apiRateLimiter, zValidator('json', updateRsvpSchema), async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const rsvpId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const rsvp = await db.select().from(rsvps).where(eq(rsvps.id, rsvpId)).get();
    
    if (!rsvp) {
      throw new AppError(404, 'אישור הגעה לא נמצא', 'RSVP_NOT_FOUND');
    }

    // בדיקת בעלות
    const event = await db.select().from(events).where(eq(events.id, rsvp.eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה לערוך RSVP זה', 'FORBIDDEN');
    }

    // עדכון
    await db
      .update(rsvps)
      .set({
        ...data,
        phone: data.phone ? formatPhoneE164(data.phone) : undefined,
        consentUpdates: data.consentUpdates !== undefined ? (data.consentUpdates ? 1 : 0) : undefined,
        updatedAt: new Date().toISOString()
      })
      .where(eq(rsvps.id, rsvpId));

    await logAudit(c, 'UPDATE_RSVP', 'rsvp', rsvpId, data);

    const updated = await db.select().from(rsvps).where(eq(rsvps.id, rsvpId)).get();

    return c.json({
      success: true,
      rsvp: updated
    });

  } catch (error) {
    console.error('Error updating RSVP:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בעדכון אישור ההגעה' 
    }, 500);
  }
});

/**
 * מחיקת RSVP (רק לבעלים)
 * DELETE /api/rsvps/:id
 */
rsvpsRouter.delete('/:id', requireAuth, apiRateLimiter, async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const rsvpId = c.req.param('id');

  try {
    const rsvp = await db.select().from(rsvps).where(eq(rsvps.id, rsvpId)).get();
    
    if (!rsvp) {
      throw new AppError(404, 'אישור הגעה לא נמצא', 'RSVP_NOT_FOUND');
    }

    const event = await db.select().from(events).where(eq(events.id, rsvp.eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה למחוק RSVP זה', 'FORBIDDEN');
    }

    await db.delete(rsvps).where(eq(rsvps.id, rsvpId));
    await logAudit(c, 'DELETE_RSVP', 'rsvp', rsvpId, { fullName: rsvp.fullName });

    return c.json({
      success: true,
      message: 'אישור ההגעה נמחק בהצלחה'
    });

  } catch (error) {
    console.error('Error deleting RSVP:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה במחיקת אישור ההגעה' 
    }, 500);
  }
});

export default rsvpsRouter;
