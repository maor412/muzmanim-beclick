import { Context, Next } from 'hono';
import { checkRateLimit, AppError } from '../lib/utils';

/**
 * Rate limiting middleware with optional bypass for authenticated users
 */
export function rateLimiter(maxRequests: number = 10, windowMs: number = 60000, bypassAuth: boolean = false) {
  return async (c: Context, next: Next) => {
    // If bypassAuth is enabled and user is authenticated, skip rate limiting
    if (bypassAuth) {
      const user = c.get('user');
      if (user && user.id) {
        // Authenticated user - skip rate limiting
        await next();
        return;
      }
    }
    
    const ip = c.req.header('cf-connecting-ip') || 
               c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    
    const allowed = checkRateLimit(ip, maxRequests, windowMs);
    
    if (!allowed) {
      throw new AppError(429, 'יותר מדי בקשות. אנא נסה שוב מאוחר יותר', 'RATE_LIMIT_EXCEEDED');
    }
    
    await next();
  };
}

/**
 * Rate limiter חמור יותר ל-RSVP endpoints
 * בסביבת פיתוח מקל יותר
 */
export const rsvpRateLimiter = rateLimiter(50, 60000); // 50 בקשות לדקה (הוגדל לפיתוח)

/**
 * Rate limiter רגיל ל-API endpoints
 * משתמשים מחוברים לא מוגבלים
 */
export const apiRateLimiter = rateLimiter(100, 60000, true); // 100 בקשות לדקה, bypass for authenticated users

/**
 * Rate limiter מקל ל-Auth endpoints
 */
export const authRateLimiter = rateLimiter(50, 60000); // 50 בקשות לדקה (הוגדל לפיתוח)
