import { Context, Next } from 'hono';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { AppError } from '../lib/utils';

/**
 * Middleware לאימות Clerk - בודק אם המשתמש מחובר
 */
export const requireAuth = async (c: Context, next: Next) => {
  const auth = getAuth(c);
  
  if (!auth?.userId) {
    throw new AppError(401, 'נדרשת התחברות', 'UNAUTHORIZED');
  }
  
  // שמירת userId ב-context
  c.set('userId', auth.userId);
  c.set('sessionId', auth.sessionId);
  
  await next();
};

/**
 * Middleware אופציונלי לאימות - לא זורק שגיאה אם אין משתמש
 */
export const optionalAuth = async (c: Context, next: Next) => {
  const auth = getAuth(c);
  
  if (auth?.userId) {
    c.set('userId', auth.userId);
    c.set('sessionId', auth.sessionId);
  }
  
  await next();
};

// Export של clerkMiddleware לשימוש בראוטר הראשי
export { clerkMiddleware };
