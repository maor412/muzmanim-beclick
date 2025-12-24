import { Context, Next } from 'hono';
import { AppError } from '../lib/utils';
import { getCurrentUser } from './devAuth';

/**
 * Middleware לאימות - בודק אם המשתמש מחובר
 */
export const requireAuth = async (c: Context, next: Next) => {
  const session = await getCurrentUser(c);
  
  if (!session?.userId) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  
  // שמירת userId ב-context
  c.set('userId', session.userId);
  c.set('sessionId', session.userId);
  
  await next();
};

/**
 * Middleware אופציונלי לאימות - לא זורק שגיאה אם אין משתמש
 */
export const optionalAuth = async (c: Context, next: Next) => {
  const session = await getCurrentUser(c);
  
  if (session?.userId) {
    c.set('userId', session.userId);
    c.set('sessionId', session.userId);
  }
  
  await next();
};
