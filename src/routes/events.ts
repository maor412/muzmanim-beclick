import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import { initDb } from '../db';
import { events, eventSettings, users, rsvps, guests, tables, seating, checkins } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimit';
import { logAudit } from '../middleware/audit';
import { 
  createEventSchema, 
  updateEventSchema 
} from '../lib/validators';
import { 
  generateId, 
  generateSlug, 
  AppError 
} from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const eventsRouter = new Hono<{ Bindings: Bindings }>();

// כל ה-routes דורשים אימות
eventsRouter.use('/*', authMiddleware);
eventsRouter.use('/*', apiRateLimiter);

/**
 * יצירת אירוע חדש
 * POST /api/events
 */
eventsRouter.post('/events', zValidator('json', createEventSchema), async (c) => {
  const db = initDb(c.env.DB);
  const currentUser = c.get('user') as any; // Get user from authMiddleware
  
  if (!currentUser || !currentUser.id) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  
  const userId = currentUser.id;
  const data = c.req.valid('json');

  try {
    // בדיקת משתמש קיים
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    
    if (!user) {
      throw new AppError(404, 'משתמש לא נמצא', 'USER_NOT_FOUND');
    }

    // יצירת slug ייחודי
    const slug = generateSlug(data.eventName);

    // יצירת האירוע
    const eventId = generateId();
    await db.insert(events).values({
      id: eventId,
      ownerUserId: user.id,
      slug,
      eventName: data.eventName,
      coupleNames: data.coupleNames,
      dateTime: data.dateTime,
      venueName: data.venueName || null,
      venueAddress: data.venueAddress || null,
      wazeLink: data.wazeLink || null,
      notes: data.notes || null,
      isRsvpOpen: data.isRsvpOpen ? 1 : 0
    });

    // יצירת הגדרות האירוע
    await db.insert(eventSettings).values({
      id: generateId(),
      eventId,
      requirePhone: data.requirePhone ? 1 : 0,
      showMealChoice: data.showMealChoice ? 1 : 0,
      showAllergies: data.showAllergies ? 1 : 0,
      showNotes: data.showNotes ? 1 : 0,
      allowUpdates: data.allowUpdates ? 1 : 0,
      consentMessage: data.consentMessage || null
    });

    // רישום audit log
    await logAudit(c, 'CREATE_EVENT', 'event', eventId, { eventName: data.eventName });

    // החזרת האירוע שנוצר
    const newEvent = await db.select().from(events).where(eq(events.id, eventId)).get();

    return c.json({
      success: true,
      event: newEvent,
      rsvpUrl: `/e/${slug}`
    }, 201);

  } catch (error) {
    console.error('Error creating event:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה ביצירת האירוע. אנא נסה שוב' 
    }, 500);
  }
});

/**
 * קבלת כל האירועים של המשתמש
 * GET /api/events
 */
eventsRouter.get('/events', async (c) => {
  const db = initDb(c.env.DB);
  const currentUser = c.get('user') as any;
  
  if (!currentUser || !currentUser.id) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  
  const userId = currentUser.id;

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    
    if (!user) {
      return c.json({ success: true, events: [] });
    }

    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.ownerUserId, user.id))
      .orderBy(desc(events.createdAt))
      .all();

    return c.json({
      success: true,
      events: userEvents
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת האירועים' 
    }, 500);
  }
});

/**
 * קבלת אירוע ספציפי לפי ID
 * GET /api/events/:id
 */
eventsRouter.get('/events/:id', async (c) => {
  const db = initDb(c.env.DB);
  const currentUser = c.get('user') as any;
  
  if (!currentUser || !currentUser.id) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  
  const userId = currentUser.id;
  const eventId = c.req.param('id');

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    
    if (!user) {
      throw new AppError(404, 'משתמש לא נמצא', 'USER_NOT_FOUND');
    }

    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.ownerUserId, user.id)))
      .get();

    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    const settings = await db
      .select()
      .from(eventSettings)
      .where(eq(eventSettings.eventId, eventId))
      .get();

    return c.json({
      success: true,
      event: {
        ...event,
        settings
      }
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בטעינת האירוע' 
    }, 500);
  }
});

/**
 * עדכון אירוע
 * PUT /api/events/:id
 */
eventsRouter.put('/events/:id', zValidator('json', updateEventSchema), async (c) => {
  const db = initDb(c.env.DB);
  const currentUser = c.get('user') as any;
  
  if (!currentUser || !currentUser.id) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  
  const userId = currentUser.id;
  const eventId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    
    if (!user) {
      throw new AppError(404, 'משתמש לא נמצא', 'USER_NOT_FOUND');
    }

    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.ownerUserId, user.id)))
      .get();

    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    // עדכון האירוע
    await db
      .update(events)
      .set({
        ...data,
        isRsvpOpen: data.isRsvpOpen !== undefined ? (data.isRsvpOpen ? 1 : 0) : undefined,
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId));

    // עדכון הגדרות אם הן קיימות
    if (data.requirePhone !== undefined || data.showMealChoice !== undefined) {
      await db
        .update(eventSettings)
        .set({
          requirePhone: data.requirePhone !== undefined ? (data.requirePhone ? 1 : 0) : undefined,
          showMealChoice: data.showMealChoice !== undefined ? (data.showMealChoice ? 1 : 0) : undefined,
          showAllergies: data.showAllergies !== undefined ? (data.showAllergies ? 1 : 0) : undefined,
          showNotes: data.showNotes !== undefined ? (data.showNotes ? 1 : 0) : undefined,
          allowUpdates: data.allowUpdates !== undefined ? (data.allowUpdates ? 1 : 0) : undefined,
          consentMessage: data.consentMessage,
          updatedAt: new Date().toISOString()
        })
        .where(eq(eventSettings.eventId, eventId));
    }

    await logAudit(c, 'UPDATE_EVENT', 'event', eventId, data);

    const updatedEvent = await db.select().from(events).where(eq(events.id, eventId)).get();

    return c.json({
      success: true,
      event: updatedEvent
    });

  } catch (error) {
    console.error('Error updating event:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה בעדכון האירוע' 
    }, 500);
  }
});

/**
 * מחיקת אירוע
 * DELETE /api/events/:id
 */
eventsRouter.delete('/events/:id', async (c) => {
  const db = initDb(c.env.DB);
  const currentUser = c.get('user') as any;
  
  if (!currentUser || !currentUser.id) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  
  const userId = currentUser.id;
  const eventId = c.req.param('id');

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    
    if (!user) {
      throw new AppError(404, 'משתמש לא נמצא', 'USER_NOT_FOUND');
    }

    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.ownerUserId, user.id)))
      .get();

    if (!event) {
      throw new AppError(404, 'אירוע לא נמצא', 'EVENT_NOT_FOUND');
    }

    // Delete all related data first (due to foreign key constraints)
    // Order matters: delete children before parents
    
    // 1. Delete checkins (references rsvps)
    await db.delete(checkins).where(eq(checkins.eventId, eventId));
    
    // 2. Delete seating (references tables, rsvps, and guests)
    await db.delete(seating).where(eq(seating.eventId, eventId));
    
    // 3. Delete tables
    await db.delete(tables).where(eq(tables.eventId, eventId));
    
    // 4. Delete guests
    await db.delete(guests).where(eq(guests.eventId, eventId));
    
    // 5. Delete RSVPs
    await db.delete(rsvps).where(eq(rsvps.eventId, eventId));
    
    // 6. Finally, delete the event itself
    await db.delete(events).where(eq(events.id, eventId));
    await logAudit(c, 'DELETE_EVENT', 'event', eventId, { eventName: event.eventName });

    return c.json({
      success: true,
      message: 'האירוע נמחק בהצלחה'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    
    if (error instanceof AppError) {
      return c.json({ success: false, error: error.message }, error.statusCode);
    }
    
    return c.json({ 
      success: false, 
      error: 'שגיאה במחיקת האירוע' 
    }, 500);
  }
});

export default eventsRouter;
