import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, like } from 'drizzle-orm';
import { initDb } from '../db';
import { rsvps, events } from '../db/schema';
import { apiRateLimiter } from '../middleware/rateLimit';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { updateRsvpSchema } from '../lib/validators';
import { 
  formatPhoneE164,
  AppError 
} from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const rsvpsRouter = new Hono<{ Bindings: Bindings }>();

/**
 * קבלת כל ה-RSVPs של אירוע (רק לבעלים)
 * GET /api/events/:eventId/rsvps
 */
rsvpsRouter.get('/:eventId/rsvps', authMiddleware, apiRateLimiter, async (c) => {
  const db = initDb(c.env.DB);
  const currentUser = c.get('user') as any;
  if (!currentUser || !currentUser.id) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  const userId = currentUser.id;
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
      where: (users, { eq }) => eq(users.id, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה לצפות ב-RSVPs אלה', 'FORBIDDEN');
    }

    // שליפת RSVPs עם סינון אופציונלי
    let query = db.select().from(rsvps).where(eq(rsvps.eventId, eventId));

    const allRsvps = await query.orderBy(desc(rsvps.createdAt)).all();

    // הוספת שדה status מחושב לכל RSVP
    const rsvpsWithStatus = allRsvps.map(r => ({
      ...r,
      status: r.attendingCount > 0 ? 'confirmed' : 'declined'
    }));

    // סינון בצד הקליינט אם יש חיפוש
    const filtered = search 
      ? rsvpsWithStatus.filter(r => 
          r.fullName.toLowerCase().includes(search.toLowerCase()) ||
          r.phone?.includes(search)
        )
      : rsvpsWithStatus;

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
rsvpsRouter.put('/:id', authMiddleware, apiRateLimiter, zValidator('json', updateRsvpSchema), async (c) => {
  const db = initDb(c.env.DB);
  const currentUser = c.get('user') as any;
  if (!currentUser || !currentUser.id) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  const userId = currentUser.id;
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
      where: (users, { eq }) => eq(users.id, userId)
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
rsvpsRouter.delete('/:id', authMiddleware, apiRateLimiter, async (c) => {
  const db = initDb(c.env.DB);
  const currentUser = c.get('user') as any;
  if (!currentUser || !currentUser.id) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  const userId = currentUser.id;
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
      where: (users, { eq }) => eq(users.id, userId)
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
