import { Context, Next } from 'hono';
import { verifyJWT } from '../utils/auth';

/**
 * Authentication middleware - requires valid JWT token
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  const token = authHeader.substring(7);
  const { DB, JWT_SECRET } = c.env as any;
  
  try {
    // Verify JWT
    const payload = await verifyJWT(token, JWT_SECRET);
    
    // Check if session exists and is valid
    const session = await DB.prepare(`
      SELECT s.*, u.* 
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    
    if (!session) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    // Attach user to context
    c.set('user', {
      id: session.user_id,
      email: session.email,
      fullName: session.full_name,
      avatarUrl: session.avatar_url,
      authProvider: session.auth_provider
    });
    
    c.set('token', token);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
}

/**
 * Optional authentication middleware - allows both authenticated and anonymous users
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth - continue as anonymous
    await next();
    return;
  }
  
  const token = authHeader.substring(7);
  const { DB, JWT_SECRET } = c.env as any;
  
  try {
    const payload = await verifyJWT(token, JWT_SECRET);
    
    const session = await DB.prepare(`
      SELECT s.*, u.* 
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    
    if (session) {
      c.set('user', {
        id: session.user_id,
        email: session.email,
        fullName: session.full_name,
        avatarUrl: session.avatar_url,
        authProvider: session.auth_provider
      });
      c.set('token', token);
    }
  } catch (error) {
    // Invalid token - continue as anonymous
    console.warn('Optional auth failed:', error);
  }
  
  await next();
}
