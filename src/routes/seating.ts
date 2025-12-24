import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { initDb } from '../db';
import { seating, tables, events, users, rsvps, guests } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimit';
import { logAudit } from '../middleware/audit';
import { createSeatingSchema } from '../lib/validators';
import { generateId, AppError } from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const seatingRouter = new Hono<{ Bindings: Bindings }>();

seatingRouter.use('/*', requireAuth);
seatingRouter.use('/*', apiRateLimiter);

/**
 * GET /api/events/:eventId/seating
 * קבלת כל סידורי ההושבה של אירוע
 */
seatingRouter.get('/events/:eventId/seating', async (c) => {
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

    const eventSeating = await db.select().from(seating).where(eq(seating.eventId, eventId)).all();

    // עשרת סידורי הושבה עם פרטי השולחנות ו-RSVPs/Guests
    const enriched = await Promise.all(
      eventSeating.map(async (seat) => {
        const table = await db.select().from(tables).where(eq(tables.id, seat.tableId)).get();
        let guestInfo = null;

        if (seat.rsvpId) {
          guestInfo = await db.select().from(rsvps).where(eq(rsvps.id, seat.rsvpId)).get();
        } else if (seat.guestId) {
          guestInfo = await db.select().from(guests).where(eq(guests.id, seat.guestId)).get();
        }

        return {
          ...seat,
          table,
          guestInfo
        };
      })
    );

    return c.json({
      success: true,
      seating: enriched
    });

  } catch (error) {
    console.error('Error fetching seating:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת סידורי הושבה' 
    }, 500);
  }
});

/**
 * POST /api/events/:eventId/seating
 * יצירת סידור הושבה חדש
 */
seatingRouter.post('/events/:eventId/seating', zValidator('json', createSeatingSchema), async (c) => {
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

    // בדיקת קיבולת שולחן
    const table = await db.select().from(tables).where(eq(tables.id, data.tableId)).get();
    
    if (!table) {
      throw new AppError(404, 'שולחן לא נמצא', 'TABLE_NOT_FOUND');
    }

    const currentSeats = await db.select().from(seating).where(eq(seating.tableId, data.tableId)).all();
    
    if (currentSeats.length >= table.capacity) {
      throw new AppError(400, 'השולחן מלא', 'TABLE_FULL');
    }

    const seatingId = generateId();
    await db.insert(seating).values({
      id: seatingId,
      eventId,
      tableId: data.tableId,
      rsvpId: data.rsvpId || null,
      guestId: data.guestId || null,
      seatIndex: data.seatIndex || null,
      notes: data.notes || null
    });

    await logAudit(c, 'CREATE_SEATING', 'seating', seatingId, { tableId: data.tableId });

    const newSeating = await db.select().from(seating).where(eq(seating.id, seatingId)).get();

    return c.json({
      success: true,
      seating: newSeating
    }, 201);

  } catch (error) {
    console.error('Error creating seating:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה ביצירת סידור הושבה' 
    }, 500);
  }
});

/**
 * POST /api/events/:eventId/seating/bulk
 * יצירת סידור הושבה מרובה (bulk seating)
 */
seatingRouter.post('/events/:eventId/seating/bulk', async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const eventId = c.req.param('eventId');
  const data = await c.req.json();

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

    // Validate bulk data
    if (!Array.isArray(data.seatings) || data.seatings.length === 0) {
      throw new AppError(400, 'נתוני הושבה לא תקינים', 'INVALID_DATA');
    }

    const results = [];
    const errors = [];

    for (const item of data.seatings) {
      try {
        // Check table capacity
        const table = await db.select().from(tables).where(eq(tables.id, item.tableId)).get();
        
        if (!table) {
          errors.push({ item, error: 'שולחן לא נמצא' });
          continue;
        }

        const currentSeats = await db.select().from(seating).where(eq(seating.tableId, item.tableId)).all();
        
        if (currentSeats.length >= table.capacity) {
          errors.push({ item, error: 'השולחן מלא' });
          continue;
        }

        const seatingId = generateId();
        await db.insert(seating).values({
          id: seatingId,
          eventId,
          tableId: item.tableId,
          rsvpId: item.rsvpId || null,
          guestId: item.guestId || null,
          seatIndex: item.seatIndex || null,
          notes: item.notes || null
        });

        results.push({ id: seatingId, tableId: item.tableId });
      } catch (err) {
        errors.push({ item, error: String(err) });
      }
    }

    await logAudit(c, 'BULK_CREATE_SEATING', 'seating', eventId, { 
      successCount: results.length,
      errorCount: errors.length 
    });

    return c.json({
      success: true,
      message: `${results.length} אורחים הושבו בהצלחה`,
      results,
      errors: errors.length > 0 ? errors : undefined
    }, 201);

  } catch (error) {
    console.error('Error bulk creating seating:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה ביצירת סידור הושבה' 
    }, 500);
  }
});

/**
 * DELETE /api/seating/:id
 * מחיקת סידור הושבה
 */
seatingRouter.delete('/seating/:id', async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const seatingId = c.req.param('id');

  try {
    const seat = await db.select().from(seating).where(eq(seating.id, seatingId)).get();
    
    if (!seat) {
      throw new AppError(404, 'סידור הושבה לא נמצא', 'SEATING_NOT_FOUND');
    }

    const event = await db.select().from(events).where(eq(events.id, seat.eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה', 'FORBIDDEN');
    }

    await db.delete(seating).where(eq(seating.id, seatingId));
    await logAudit(c, 'DELETE_SEATING', 'seating', seatingId);

    return c.json({
      success: true,
      message: 'סידור ההושבה נמחק בהצלחה'
    });

  } catch (error) {
    console.error('Error deleting seating:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה במחיקת סידור הושבה' 
    }, 500);
  }
});

export default seatingRouter;
