import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { initDb } from '../db';
import { tables, events, users, seating } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimit';
import { logAudit } from '../middleware/audit';
import { createTableSchema, updateTableSchema } from '../lib/validators';
import { generateId, AppError } from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const tablesRouter = new Hono<{ Bindings: Bindings }>();

tablesRouter.use('/*', requireAuth);
tablesRouter.use('/*', apiRateLimiter);

/**
 * GET /api/events/:eventId/tables
 * קבלת כל השולחנות של אירוע
 */
tablesRouter.get('/events/:eventId/tables', async (c) => {
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

    const eventTables = await db.select().from(tables).where(eq(tables.eventId, eventId)).all();

    // חישוב תפוסה לכל שולחן
    const tablesWithOccupancy = await Promise.all(
      eventTables.map(async (table) => {
        const seats = await db.select().from(seating).where(eq(seating.tableId, table.id)).all();
        return {
          ...table,
          occupied: seats.length,
          available: table.capacity - seats.length
        };
      })
    );

    return c.json({
      success: true,
      tables: tablesWithOccupancy
    });

  } catch (error) {
    console.error('Error fetching tables:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת השולחנות' 
    }, 500);
  }
});

/**
 * POST /api/events/:eventId/tables
 * יצירת שולחן חדש
 */
tablesRouter.post('/events/:eventId/tables', zValidator('json', createTableSchema), async (c) => {
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

    const tableId = generateId();
    await db.insert(tables).values({
      id: tableId,
      eventId,
      tableName: data.tableName,
      tableNumber: data.tableNumber || null,
      capacity: data.capacity,
      notes: data.notes || null
    });

    await logAudit(c, 'CREATE_TABLE', 'table', tableId, { tableName: data.tableName });

    const newTable = await db.select().from(tables).where(eq(tables.id, tableId)).get();

    return c.json({
      success: true,
      table: newTable
    }, 201);

  } catch (error) {
    console.error('Error creating table:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה ביצירת שולחן' 
    }, 500);
  }
});

/**
 * PUT /api/tables/:id
 * עדכון שולחן
 */
tablesRouter.put('/:id', zValidator('json', updateTableSchema), async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const tableId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const table = await db.select().from(tables).where(eq(tables.id, tableId)).get();
    
    if (!table) {
      throw new AppError(404, 'שולחן לא נמצא', 'TABLE_NOT_FOUND');
    }

    const event = await db.select().from(events).where(eq(events.id, table.eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה', 'FORBIDDEN');
    }

    await db
      .update(tables)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(eq(tables.id, tableId));

    await logAudit(c, 'UPDATE_TABLE', 'table', tableId, data);

    const updated = await db.select().from(tables).where(eq(tables.id, tableId)).get();

    return c.json({
      success: true,
      table: updated
    });

  } catch (error) {
    console.error('Error updating table:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בעדכון שולחן' 
    }, 500);
  }
});

/**
 * DELETE /api/tables/:id
 * מחיקת שולחן
 */
tablesRouter.delete('/:id', async (c) => {
  const db = initDb(c.env.DB);
  const userId = c.get('userId') as string;
  const tableId = c.req.param('id');

  try {
    const table = await db.select().from(tables).where(eq(tables.id, tableId)).get();
    
    if (!table) {
      throw new AppError(404, 'שולחן לא נמצא', 'TABLE_NOT_FOUND');
    }

    const event = await db.select().from(events).where(eq(events.id, table.eventId)).get();
    
    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!user || event.ownerUserId !== user.id) {
      throw new AppError(403, 'אין לך הרשאה', 'FORBIDDEN');
    }

    await db.delete(tables).where(eq(tables.id, tableId));
    await logAudit(c, 'DELETE_TABLE', 'table', tableId, { tableName: table.tableName });

    return c.json({
      success: true,
      message: 'השולחן נמחק בהצלחה'
    });

  } catch (error) {
    console.error('Error deleting table:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה במחיקת שולחן' 
    }, 500);
  }
});

export default tablesRouter;
