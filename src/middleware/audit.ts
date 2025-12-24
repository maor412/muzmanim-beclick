import { Context } from 'hono';
import { initDb } from '../db';
import { auditLogs } from '../db/schema';
import { generateId } from '../lib/utils';

/**
 * רישום audit log
 */
export async function logAudit(
  c: Context,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  try {
    const db = initDb(c.env.DB);
    const userId = c.get('userId') || null;
    const eventId = c.get('eventId') || null;
    
    // קבלת IP ו-User Agent
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    
    await db.insert(auditLogs).values({
      id: generateId(),
      userId,
      eventId,
      action,
      entityType,
      entityId,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent
    });
  } catch (error) {
    // לוג שגיאה אבל לא לזרוק - אנחנו לא רוצים שבעיה בלוגים תקרוס את האפליקציה
    console.error('Failed to log audit:', error);
  }
}

/**
 * Middleware אוטומטי לרישום פעולות
 */
export async function auditMiddleware(c: Context, next: Function) {
  const start = Date.now();
  
  await next();
  
  const duration = Date.now() - start;
  const method = c.req.method;
  const path = c.req.path;
  const status = c.res.status;
  
  // רק רושמים פעולות חשובות (POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    await logAudit(c, `${method} ${path}`, 'http_request', undefined, {
      method,
      path,
      status,
      duration
    });
  }
}
