import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { initDb } from '../db';
import { guests, events, users } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimit';
import { logAudit } from '../middleware/audit';
import { createGuestSchema, bulkGuestsSchema } from '../lib/validators';
import { generateId, AppError } from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const guestsRouter = new Hono<{ Bindings: Bindings }>();

guestsRouter.use('/*', requireAuth);
guestsRouter.use('/*', apiRateLimiter);

/**
 * GET /api/events/:eventId/guests
 * קבלת רשימת יעד של אירוע
 */
guestsRouter.get('/events/:eventId/guests', async (c) => {
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

    const eventGuests = await db.select().from(guests).where(eq(guests.eventId, eventId)).all();

    return c.json({
      success: true,
      guests: eventGuests
    });

  } catch (error) {
    console.error('Error fetching guests:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת רשימת המוזמנים' 
    }, 500);
  }
});

/**
 * POST /api/events/:eventId/guests
 * הוספת אורח לרשימת יעד
 */
guestsRouter.post('/events/:eventId/guests', zValidator('json', createGuestSchema), async (c) => {
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

    const guestId = generateId();
    await db.insert(guests).values({
      id: guestId,
      eventId,
      fullName: data.fullName,
      phone: data.phone || null,
      side: data.side || null,
      groupLabel: data.groupLabel || null,
      notes: data.notes || null
    });

    await logAudit(c, 'CREATE_GUEST', 'guest', guestId, { fullName: data.fullName });

    const newGuest = await db.select().from(guests).where(eq(guests.id, guestId)).get();

    return c.json({
      success: true,
      guest: newGuest
    }, 201);

  } catch (error) {
    console.error('Error creating guest:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בהוספת אורח' 
    }, 500);
  }
});

/**
 * POST /api/events/:eventId/guests/bulk
 * הוספה המונית של אורחים
 */
guestsRouter.post('/events/:eventId/guests/bulk', zValidator('json', bulkGuestsSchema), async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const eventId = c.req.param('eventId');
  const guestsData = c.req.valid('json');

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

    // הכנסה המונית
    const inserts = guestsData.map(g => ({
      id: generateId(),
      eventId,
      fullName: g.fullName,
      phone: g.phone || null,
      side: g.side || null,
      groupLabel: g.groupLabel || null,
      notes: g.notes || null
    }));

    for (const guest of inserts) {
      await db.insert(guests).values(guest);
    }

    await logAudit(c, 'BULK_CREATE_GUESTS', 'guest', eventId, { count: inserts.length });

    return c.json({
      success: true,
      message: `${inserts.length} אורחים נוספו בהצלחה`,
      count: inserts.length
    }, 201);

  } catch (error) {
    console.error('Error bulk creating guests:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בהוספת אורחים' 
    }, 500);
  }
});

/**
 * DELETE /api/guests/:id
 * מחיקת אורח
 */
guestsRouter.delete('/:id', async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const guestId = c.req.param('id');

  try {
    const guest = await db.select().from(guests).where(eq(guests.id, guestId)).get();
    
    if (!guest) {
      throw new AppError(404, 'אורח לא נמצא', 'GUEST_NOT_FOUND');
    }

    const event = await db.select().from(events).where(eq(events.id, guest.eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה', 'FORBIDDEN');
    }

    await db.delete(guests).where(eq(guests.id, guestId));
    await logAudit(c, 'DELETE_GUEST', 'guest', guestId, { fullName: guest.fullName });

    return c.json({
      success: true,
      message: 'האורח נמחק בהצלחה'
    });

  } catch (error) {
    console.error('Error deleting guest:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה במחיקת אורח' 
    }, 500);
  }
});

export default guestsRouter;
