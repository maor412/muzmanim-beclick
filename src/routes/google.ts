import { Hono } from 'hono';
import { generateId, createJWT, getCurrentTimestamp } from '../utils/auth';

const google = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/auth/google - Redirect to Google OAuth
google.get('/', async (c) => {
  const { GOOGLE_CLIENT_ID, APP_URL } = c.env;
  
  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  const scope = 'email profile';
  const state = generateId(); // CSRF protection
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  return c.redirect(googleAuthUrl);
});

// GET /api/auth/google/callback - Google OAuth callback
google.get('/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const error = c.req.query('error');
    
    if (error) {
      return c.redirect(`/login?error=${encodeURIComponent('Google authentication failed')}`);
    }
    
    if (!code) {
      return c.redirect('/login?error=' + encodeURIComponent('No authorization code'));
    }
    
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL, DB, JWT_SECRET } = c.env;
    const redirectUri = `${APP_URL}/api/auth/google/callback`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google token error:', errorText);
      return c.redirect('/login?error=' + encodeURIComponent('Failed to get Google tokens'));
    }
    
    const tokens = await tokenResponse.json() as any;
    
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    
    if (!userInfoResponse.ok) {
      return c.redirect('/login?error=' + encodeURIComponent('Failed to get user info'));
    }
    
    const googleUser = await userInfoResponse.json() as any;
    
    // Check if user exists
    let user = await DB.prepare(`
      SELECT * FROM users WHERE google_id = ? OR email = ?
    `).bind(googleUser.id, googleUser.email.toLowerCase()).first();
    
    if (!user) {
      // Create new user
      const userId = generateId();
      const now = getCurrentTimestamp();
      
      await DB.prepare(`
        INSERT INTO users (id, email, full_name, avatar_url, auth_provider, google_id, created_at, last_login)
        VALUES (?, ?, ?, ?, 'google', ?, ?, ?)
      `).bind(
        userId,
        googleUser.email.toLowerCase(),
        googleUser.name || '',
        googleUser.picture || '',
        googleUser.id,
        now,
        now
      ).run();
      
      user = {
        id: userId,
        email: googleUser.email,
        full_name: googleUser.name,
        avatar_url: googleUser.picture
      };
    } else {
      // Update existing user
      await DB.prepare(`
        UPDATE users 
        SET last_login = ?, google_id = ?, full_name = ?, avatar_url = ?
        WHERE id = ?
      `).bind(
        getCurrentTimestamp(),
        googleUser.id,
        googleUser.name || user.full_name,
        googleUser.picture || user.avatar_url,
        user.id
      ).run();
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
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    ).run();
    
    // Redirect to app with token
    return c.redirect(`/auth/success?token=${sessionToken}`);
    
  } catch (error) {
    console.error('Google callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Error details:', errorMessage, error);
    return c.redirect('/login?error=' + encodeURIComponent(errorMessage));
  }
});

export default google;
