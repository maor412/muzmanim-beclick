import { Context, Next } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { AppError } from '../lib/utils';

// Dev users לטסטים
export const DEV_USERS = [
  { id: 'dev_user_1', email: 'admin1@test.local', name: 'מנהל 1', role: 'admin' },
  { id: 'dev_user_2', email: 'admin2@test.local', name: 'מנהל 2', role: 'admin' },
  { id: 'dev_user_3', email: 'user@test.local', name: 'משתמש רגיל', role: 'user' }
];

// Secret לחתימת cookies (בפרודקשן יהיה ב-env)
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev-secret-key-change-in-production';
const COOKIE_NAME = 'mozmanim_session';

/**
 * יצירת session token
 */
export async function createSessionToken(userId: string): Promise<string> {
  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
    iat: Math.floor(Date.now() / 1000)
  };
  
  return await sign(payload, COOKIE_SECRET);
}

/**
 * אימות session token
 */
export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  try {
    const payload = await verify(token, COOKIE_SECRET);
    if (payload.userId && typeof payload.userId === 'string') {
      return { userId: payload.userId };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Dev Login - התחברות למשתמש dev
 */
export async function devLogin(c: Context, userId: string) {
  const user = DEV_USERS.find(u => u.id === userId);
  
  if (!user) {
    throw new AppError(400, 'משתמש לא נמצא', 'USER_NOT_FOUND');
  }
  
  const token = await createSessionToken(userId);
  
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // במצב dev
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
  
  return user;
}

/**
 * Dev Logout - התנתקות
 */
export function devLogout(c: Context) {
  deleteCookie(c, COOKIE_NAME);
}

/**
 * קבלת משתמש נוכחי מה-session
 */
export async function getCurrentUser(c: Context): Promise<{ userId: string } | null> {
  const token = getCookie(c, COOKIE_NAME);
  
  if (!token) {
    return null;
  }
  
  return await verifySessionToken(token);
}

/**
 * Middleware לאימות - גרסת dev auth
 */
export const devAuthMiddleware = async (c: Context, next: Next) => {
  const session = await getCurrentUser(c);
  
  if (session) {
    c.set('userId', session.userId);
    c.set('sessionId', session.userId); // לתאימות
  }
  
  await next();
};

/**
 * Middleware שדורש התחברות
 */
export const requireDevAuth = async (c: Context, next: Next) => {
  const session = await getCurrentUser(c);
  
  if (!session) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  
  c.set('userId', session.userId);
  c.set('sessionId', session.userId);
  
  await next();
};

/**
 * Middleware אופציונלי - לא זורק שגיאה
 */
export const optionalDevAuth = async (c: Context, next: Next) => {
  const session = await getCurrentUser(c);
  
  if (session) {
    c.set('userId', session.userId);
    c.set('sessionId', session.userId);
  }
  
  await next();
};
