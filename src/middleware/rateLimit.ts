import { Context, Next } from 'hono';
import { checkRateLimit, AppError } from '../lib/utils';

/**
 * Rate limiting middleware
 */
export function rateLimiter(maxRequests: number = 10, windowMs: number = 60000) {
  return async (c: Context, next: Next) => {
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
export const rsvpRateLimiter = rateLimiter(20, 60000); // 20 בקשות לדקה (הוגדל לפיתוח)

/**
 * Rate limiter רגיל ל-API endpoints
 */
export const apiRateLimiter = rateLimiter(30, 60000); // 30 בקשות לדקה

/**
 * Rate limiter מקל ל-Auth endpoints
 */
export const authRateLimiter = rateLimiter(10, 60000); // 10 בקשות לדקה
