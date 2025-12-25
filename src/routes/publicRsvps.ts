import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { initDb } from '../db';
import { rsvps, events, eventSettings } from '../db/schema';
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

    // יצירת RSVP
    const rsvp = {
      id: generateId(),
      eventId: event.id,
      fullName: data.fullName,
      phone: data.phone ? formatPhoneE164(data.phone) : null,
      status: data.status,
      plusOnes: data.plusOnes || 0,
      mealChoice: data.mealChoice || null,
      allergies: data.allergies || null,
      notes: data.notes || null,
      consentGiven: data.consentGiven,
      source: 'web'
    };

    await db.insert(rsvps).values(rsvp);

    return c.json({
      success: true,
      message: 'תודה רבה! אישור ההגעה נשמר בהצלחה',
      rsvp: {
        id: rsvp.id,
        status: rsvp.status
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
