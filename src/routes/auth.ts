import { Hono } from 'hono';
import { generateId, generateToken, createJWT, verifyJWT, getCurrentTimestamp, getFutureTimestamp } from '../utils/auth';

const auth = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/auth/magic-link - Send magic link to email
auth.post('/magic-link', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email || !email.includes('@')) {
      return c.json({ error: 'Invalid email address' }, 400);
    }
    
    const { DB, RESEND_API_KEY, APP_URL } = c.env;
    
    // Generate magic link token
    const token = generateToken();
    const id = generateId();
    const expiresAt = getFutureTimestamp(15 * 60); // 15 minutes
    
    // Save magic link to database
    await DB.prepare(`
      INSERT INTO magic_links (id, email, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(id, email.toLowerCase(), token, expiresAt).run();
    
    // Create magic link URL
    const magicLinkUrl = `${APP_URL}/auth/verify?token=${token}`;
    
    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'מוזמנים בקליק <onboarding@resend.dev>',
        to: [email],
        subject: 'קישור התחברות למערכת',
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: right; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #ec4899; 
                color: white; 
                text-decoration: none; 
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer { color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>התחבר למערכת מוזמנים בקליק</h1>
              <p>שלום,</p>
              <p>קיבלנו בקשה להתחברות למערכת עם כתובת המייל שלך.</p>
              <p>לחץ על הכפתור הבא כדי להתחבר:</p>
              <a href="${magicLinkUrl}" class="button">התחבר למערכת</a>
              <p>או העתק את הקישור הבא לדפדפן:</p>
              <p style="word-break: break-all; color: #666;">${magicLinkUrl}</p>
              <p class="footer">
                קישור זה תקף ל-15 דקות בלבד.<br>
                אם לא ביקשת את המייל הזה, אפשר להתעלם ממנו.
              </p>
            </div>
          </body>
          </html>
        `
      })
    });
    
    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend error:', error);
      return c.json({ error: 'Failed to send email' }, 500);
    }
    
    return c.json({ 
      success: true, 
      message: 'Magic link sent to your email' 
    });
    
  } catch (error) {
    console.error('Magic link error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/auth/verify/:token - Verify magic link token
auth.get('/verify/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const { DB, JWT_SECRET } = c.env;
    
    // Find magic link
    const magicLink = await DB.prepare(`
      SELECT * FROM magic_links 
      WHERE token = ? AND used = FALSE
    `).bind(token).first();
    
    if (!magicLink) {
      return c.json({ error: 'Invalid or expired magic link' }, 400);
    }
    
    // Check expiration
    const now = new Date();
    const expiresAt = new Date(magicLink.expires_at as string);
    if (now > expiresAt) {
      return c.json({ error: 'Magic link has expired' }, 400);
    }
    
    // Mark magic link as used
    await DB.prepare(`
      UPDATE magic_links SET used = TRUE WHERE id = ?
    `).bind(magicLink.id).run();
    
    const email = magicLink.email as string;
    
    // Check if user exists
    let user = await DB.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(email).first();
    
    // Create user if doesn't exist
    if (!user) {
      const userId = generateId();
      const now = getCurrentTimestamp();
      
      await DB.prepare(`
        INSERT INTO users (id, email, auth_provider, created_at, last_login)
        VALUES (?, ?, 'magic-link', ?, ?)
      `).bind(userId, email, now, now).run();
      
      user = { id: userId, email, auth_provider: 'magic-link' };
    } else {
      // Update last login
      await DB.prepare(`
        UPDATE users SET last_login = ? WHERE id = ?
      `).bind(getCurrentTimestamp(), user.id).run();
    }
    
    // Create JWT session token
    const sessionToken = await createJWT(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      7 * 24 * 60 * 60 // 7 days
    );
    
    // Save session to database
    const sessionId = generateId();
    await DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      sessionId,
      user.id,
      sessionToken,
      getFutureTimestamp(7 * 24 * 60 * 60)
    ).run();
    
    return c.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url
      }
    });
    
  } catch (error) {
    console.error('Verify error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/auth/me - Get current user
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No authorization token' }, 401);
    }
    
    const token = authHeader.substring(7);
    const { DB, JWT_SECRET } = c.env;
    
    // Verify JWT
    const payload = await verifyJWT(token, JWT_SECRET);
    
    // Check if session exists
    const session = await DB.prepare(`
      SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();
    
    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }
    
    // Get user
    const user = await DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(payload.userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        authProvider: user.auth_provider
      }
    });
    
  } catch (error) {
    console.error('Me error:', error);
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

// POST /api/auth/logout - Logout user
auth.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No authorization token' }, 401);
    }
    
    const token = authHeader.substring(7);
    const { DB } = c.env;
    
    // Delete session
    await DB.prepare(`
      DELETE FROM sessions WHERE token = ?
    `).bind(token).run();
    
    return c.json({ success: true, message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;
