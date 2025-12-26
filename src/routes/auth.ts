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
        subject: 'קישור התחברות למערכת - מוזמנים בקליק',
        text: `
שלום,

קיבלנו בקשה להתחברות למערכת ניהול האירועים שלך.

לחץ על הקישור הבא להתחברות:
${magicLinkUrl}

⚠️ הערת אבטחה:
קישור זה תקף ל-15 דקות בלבד ומיועד רק לשימושך האישי.

לא ביקשת את המייל הזה?
אין צורך לעשות דבר - הקישור יפוג אוטומטית תוך 15 דקות.

---
מערכת מוזמנים בקליק
מערכת מקצועית לניהול מוזמנים לאירועים
בקר באתר: ${APP_URL}
        `.trim(),
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>קישור התחברות</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: right; 
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #ec4899;
                font-size: 24px;
                margin: 0;
              }
              .content {
                color: #333;
                line-height: 1.6;
              }
              .button { 
                display: inline-block; 
                padding: 14px 32px; 
                background-color: #ec4899; 
                color: white !important; 
                text-decoration: none; 
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
              }
              .button:hover {
                background-color: #db2777;
              }
              .link-box {
                background-color: #f9fafb;
                padding: 12px;
                border-radius: 4px;
                word-break: break-all;
                color: #666;
                font-size: 12px;
                margin: 15px 0;
              }
              .footer { 
                color: #999; 
                font-size: 12px; 
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
              }
              .security-notice {
                background-color: #fef3c7;
                padding: 12px;
                border-radius: 4px;
                margin: 20px 0;
                font-size: 14px;
                color: #92400e;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 מוזמנים בקליק</h1>
              </div>
              
              <div class="content">
                <p><strong>שלום,</strong></p>
                <p>קיבלנו בקשה להתחברות למערכת ניהול האירועים שלך.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLinkUrl}" class="button">👉 לחץ כאן להתחברות 👈</a>
                </div>
                
                <div class="security-notice">
                  <strong>⚠️ הערת אבטחה:</strong><br>
                  קישור זה תקף ל-15 דקות בלבד ומיועד רק לשימושך האישי.
                </div>
                
                <p>אם הכפתור לא עובד, העתק והדבק את הקישור הבא בדפדפן:</p>
                <div class="link-box">
                  ${magicLinkUrl}
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  <strong>לא ביקשת את המייל הזה?</strong><br>
                  אין צורך לעשות דבר - הקישור יפוג אוטומטית תוך 15 דקות.
                </p>
              </div>
              
              <div class="footer">
                מערכת מוזמנים בקליק<br>
                מערכת מקצועית לניהול מוזמנים לאירועים<br>
                <a href="${APP_URL}" style="color: #ec4899; text-decoration: none;">בקר באתר</a>
              </div>
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
