import { Hono } from 'hono';
import { DEV_USERS, devLogin, devLogout, getCurrentUser } from '../middleware/devAuth';
import { initDb } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '../lib/utils';

type Bindings = {
  DB: D1Database;
};

const authRouter = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/auth/me
 * קבלת פרטי משתמש נוכחי
 */
authRouter.get('/me', async (c) => {
  const session = await getCurrentUser(c);
  
  if (!session) {
    return c.json({ 
      success: false, 
      authenticated: false 
    }, 401);
  }
  
  const devUser = DEV_USERS.find(u => u.id === session.userId);
  
  if (!devUser) {
    return c.json({ 
      success: false, 
      authenticated: false 
    }, 401);
  }
  
  return c.json({
    success: true,
    authenticated: true,
    user: devUser
  });
});

/**
 * POST /api/auth/login
 * התחברות dev
 */
authRouter.post('/login', async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'חסר מזהה משתמש' 
      }, 400);
    }
    
    const db = initDb(c.env.DB);
    const user = await devLogin(c, userId);
    
    // וודא שהמשתמש קיים ב-DB
    const dbUser = await db.select().from(users).where(eq(users.id, userId)).get();
    
    if (!dbUser) {
      // צור משתמש חדש
      await db.insert(users).values({
        id: userId,
        email: user.email,
        name: user.name,
        authProvider: 'dev',
        clerkId: userId
      });
    }
    
    return c.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ 
      success: false, 
      error: 'שגיאה בהתחברות' 
    }, 500);
  }
});

/**
 * POST /api/auth/logout
 * התנתקות
 */
authRouter.post('/logout', async (c) => {
  devLogout(c);
  
  return c.json({
    success: true,
    message: 'התנתקת בהצלחה'
  });
});

/**
 * GET /api/auth/dev-users
 * רשימת משתמשי dev זמינים
 */
authRouter.get('/dev-users', (c) => {
  return c.json({
    success: true,
    users: DEV_USERS
  });
});

export default authRouter;
