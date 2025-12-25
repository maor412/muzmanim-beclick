import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { initDb } from '../db';
import { checkins, rsvps, events, users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimit';
import { logAudit } from '../middleware/audit';
import { createCheckinSchema } from '../lib/validators';
import { generateId, AppError } from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const checkinsRouter = new Hono<{ Bindings: Bindings }>();

checkinsRouter.use('/*', authMiddleware);
checkinsRouter.use('/*', apiRateLimiter);

/**
 * GET /api/events/:eventId/checkins
 * קבלת כל הצ'ק-אינים של אירוע
 */
checkinsRouter.get('/events/:eventId/checkins', async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const eventId = c.req.param('eventId');

  try {
    const event = await db.select().from(events).where(eq(events.id, eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה', 'FORBIDDEN');
    }

    const eventCheckins = await db.select().from(checkins).where(eq(checkins.eventId, eventId)).all();

    // עשרת הצ'ק-אינים עם פרטי המוזמנים
    const enriched = await Promise.all(
      eventCheckins.map(async (checkin) => {
        const rsvp = await db.select().from(rsvps).where(eq(rsvps.id, checkin.rsvpId)).get();
        return {
          ...checkin,
          rsvp
        };
      })
    );

    // סטטיסטיקות
    const totalRsvps = await db.select().from(rsvps).where(eq(rsvps.eventId, eventId)).all();
    const totalCheckins = enriched.length;
    const totalAttendingCount = enriched.reduce((sum, c) => sum + (c.rsvp?.attendingCount || 0), 0);

    return c.json({
      success: true,
      checkins: enriched,
      stats: {
        totalRsvps: totalRsvps.length,
        totalCheckins,
        totalAttendingCount,
        checkInRate: totalRsvps.length > 0 ? Math.round((totalCheckins / totalRsvps.length) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching checkins:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת צ\'ק-אינים' 
    }, 500);
  }
});

/**
 * POST /api/events/:eventId/checkins
 * ביצוע צ'ק-אין לאורח
 */
checkinsRouter.post('/events/:eventId/checkins', zValidator('json', createCheckinSchema), async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const eventId = c.req.param('eventId');
  const data = c.req.valid('json');

  try {
    const event = await db.select().from(events).where(eq(events.id, eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה', 'FORBIDDEN');
    }

    // בדיקה ש-RSVP קיים
    const rsvp = await db.select().from(rsvps).where(eq(rsvps.id, data.rsvpId)).get();
    
    if (!rsvp) {
      throw new AppError(404, 'RSVP לא נמצא', 'RSVP_NOT_FOUND');
    }

    // בדיקה אם כבר עשו check-in
    const existing = await db
      .select()
      .from(checkins)
      .where(eq(checkins.rsvpId, data.rsvpId))
      .get();

    if (existing) {
      throw new AppError(400, 'אורח זה כבר ביצע צ\'ק-אין', 'ALREADY_CHECKED_IN');
    }

    const checkinId = generateId();
    await db.insert(checkins).values({
      id: checkinId,
      eventId,
      rsvpId: data.rsvpId,
      checkedInByUserId: user.id,
      notes: data.notes || null
    });

    await logAudit(c, 'CREATE_CHECKIN', 'checkin', checkinId, { rsvpId: data.rsvpId });

    const newCheckin = await db.select().from(checkins).where(eq(checkins.id, checkinId)).get();

    return c.json({
      success: true,
      checkin: newCheckin,
      message: `${rsvp.fullName} נרשם/ה בהצלחה`
    }, 201);

  } catch (error) {
    console.error('Error creating checkin:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בביצוע צ\'ק-אין' 
    }, 500);
  }
});

/**
 * DELETE /api/checkins/:id
 * ביטול צ'ק-אין
 */
checkinsRouter.delete('/:id', async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const checkinId = c.req.param('id');

  try {
    const checkin = await db.select().from(checkins).where(eq(checkins.id, checkinId)).get();
    
    if (!checkin) {
      throw new AppError(404, 'צ\'ק-אין לא נמצא', 'CHECKIN_NOT_FOUND');
    }

    const event = await db.select().from(events).where(eq(events.id, checkin.eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה', 'FORBIDDEN');
    }

    await db.delete(checkins).where(eq(checkins.id, checkinId));
    await logAudit(c, 'DELETE_CHECKIN', 'checkin', checkinId);

    return c.json({
      success: true,
      message: 'צ\'ק-אין בוטל בהצלחה'
    });

  } catch (error) {
    console.error('Error deleting checkin:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בביטול צ\'ק-אין' 
    }, 500);
  }
});

export default checkinsRouter;
