import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { serveStatic } from 'hono/cloudflare-workers';

// Routes
import eventsRouter from './routes/events';
import rsvpsRouter from './routes/rsvps';
import publicRsvpsRouter from './routes/publicRsvps';
import guestsRouter from './routes/guests';
import tablesRouter from './routes/tables';
import seatingRouter from './routes/seating';
import checkinsRouter from './routes/checkins';
import authRouter from './routes/auth';
import googleRouter from './routes/google';

// Middleware
import { AppError } from './lib/utils';
import { devAuthMiddleware } from './middleware/devAuth';

// Static pages
import { 
  aboutPage, 
  faqPage, 
  contactPage, 
  termsPage, 
  privacyPage, 
  accessibilityPage 
} from './pages/static';
import { devLoginPage } from './pages/devLogin';
import { loginPage } from './pages/login';
import { authSuccessPage } from './pages/authSuccess';
import { authVerifyPage } from './pages/authVerify';
import { dashboardPage } from './pages/dashboard';
import { createEventPage } from './pages/createEvent';
import { eventManagementPage } from './pages/eventManagement';
import { publicRsvpPage } from './pages/publicRsvp';

type Bindings = {
  DB: D1Database;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());

// CORS - אפשר API calls מכל מקור
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// Dev Authentication middleware
app.use('*', devAuthMiddleware);

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// Health check (before other routes)
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// PUBLIC RSVP API routes (NO AUTH REQUIRED)
app.get('/api/rsvp/:slug/event', async (c) => {
  console.log('🟢 PUBLIC API: Get event details for slug:', c.req.param('slug'));
  
  try {
    const slug = c.req.param('slug');
    const db = c.env.DB as any;
    
    const event = await db.prepare(`
      SELECT * FROM events WHERE slug = ?
    `).bind(slug).first();
    
    if (!event) {
      return c.json({ error: 'אירוע לא נמצא' }, 404);
    }
    
    return c.json({
      success: true,
      event: {
        id: event.id,
        eventName: event.event_name,
        coupleNames: event.couple_names,
        dateTime: event.date_time,
        venueName: event.venue_name,
        venueAddress: event.venue_address,
        wazeLink: event.waze_link,
        notes: event.notes,
        isRsvpOpen: event.is_rsvp_open,
        requirePhone: event.require_phone,
        showMealChoice: event.show_meal_choice,
        showAllergies: event.show_allergies,
        showNotes: event.show_notes,
        allowUpdates: event.allow_updates,
        consentMessage: event.consent_message,
        slug: event.slug
      }
    });
  } catch (error) {
    console.error('Error loading event:', error);
    return c.json({ error: 'שגיאה בטעינת פרטי האירוע' }, 500);
  }
});

// API Routes
app.route('/api/auth', authRouter);
app.route('/api/auth/google', googleRouter);
app.route('/api', eventsRouter);
app.route('/api', guestsRouter);
app.route('/api', tablesRouter);
app.route('/api', seatingRouter);
app.route('/api', checkinsRouter);
app.route('/api/events', rsvpsRouter);            // Protected RSVP routes (/:eventId/rsvps)
app.route('/api/rsvp', publicRsvpsRouter);         // Public RSVP routes (:slug, :slug/event)

// Public RSVP page by slug
app.get('/e/:slug', async (c) => {
  const slug = c.req.param('slug');
  console.log('📄 Public RSVP page requested for slug:', slug);
  return c.html(publicRsvpPage(slug));
});

// Debug: List all routes
app.get('/debug/routes', (c) => {
  return c.json({
    message: 'Use Hono dev tools to see routes',
    hint: 'Routes are registered in order'
  });
});

// Home page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>מוזמנים בקליק - מערכת ניהול מוזמנים לחתונה</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        </style>
    </head>
    <body class="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 min-h-screen">
        <!-- Header -->
        <nav class="bg-white shadow-lg">
            <div class="container mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-reverse space-x-2">
                        <i class="fas fa-heart text-pink-500 text-3xl"></i>
                        <h1 class="text-2xl font-bold text-gray-800">מוזמנים בקליק</h1>
                    </div>
                    <div class="space-x-reverse space-x-4">
                        <a href="/about" class="text-gray-600 hover:text-pink-500">אודות</a>
                        <a href="/contact" class="text-gray-600 hover:text-pink-500">צור קשר</a>
                        <a href="/login" class="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition">התחברות</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <div class="container mx-auto px-4 py-16">
            <div class="max-w-4xl mx-auto text-center">
                <h2 class="text-5xl font-bold text-gray-800 mb-6">
                    ניהול מוזמנים לחתונה<br />
                    <span class="text-pink-500">בקליק אחד</span>
                </h2>
                <p class="text-xl text-gray-600 mb-8">
                    מערכת מתקדמת לניהול אירועים: RSVP, רשימות מוזמנים, סידורי הושבה, צ'ק-אין ועוד
                </p>
                <div class="flex justify-center space-x-reverse space-x-4">
                    <a href="/signup" class="bg-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-pink-600 transition shadow-lg">
                        <i class="fas fa-rocket ml-2"></i>
                        התחל עכשיו בחינם
                    </a>
                    <a href="#features" class="bg-white text-gray-800 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition shadow-lg">
                        <i class="fas fa-info-circle ml-2"></i>
                        למד עוד
                    </a>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div id="features" class="container mx-auto px-4 py-16">
            <h3 class="text-3xl font-bold text-center text-gray-800 mb-12">מה מציעה המערכת?</h3>
            <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <!-- Feature 1 -->
                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
                    <i class="fas fa-link text-pink-500 text-5xl mb-4"></i>
                    <h4 class="text-xl font-bold text-gray-800 mb-2">RSVP בלינק כללי</h4>
                    <p class="text-gray-600">שלחו לינק אחד לכל המוזמנים וקבלו תשובות בקלות</p>
                </div>
                
                <!-- Feature 2 -->
                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
                    <i class="fas fa-users text-purple-500 text-5xl mb-4"></i>
                    <h4 class="text-xl font-bold text-gray-800 mb-2">ניהול רשימות</h4>
                    <p class="text-gray-600">ייבוא, עריכה וניהול מלא של רשימת המוזמנים</p>
                </div>
                
                <!-- Feature 3 -->
                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
                    <i class="fas fa-chair text-blue-500 text-5xl mb-4"></i>
                    <h4 class="text-xl font-bold text-gray-800 mb-2">סידורי הושבה</h4>
                    <p class="text-gray-600">ארגון שולחנות והושבת אורחים בממשק נוח</p>
                </div>
                
                <!-- Feature 4 -->
                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
                    <i class="fas fa-clipboard-check text-green-500 text-5xl mb-4"></i>
                    <h4 class="text-xl font-bold text-gray-800 mb-2">צ'ק-אין באירוע</h4>
                    <p class="text-gray-600">רישום הגעת אורחים במהירות ביום החתונה</p>
                </div>
                
                <!-- Feature 5 -->
                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
                    <i class="fas fa-chart-pie text-yellow-500 text-5xl mb-4"></i>
                    <h4 class="text-xl font-bold text-gray-800 mb-2">דשבורד מרכזי</h4>
                    <p class="text-gray-600">סטטיסטיקות ודוחות בזמן אמת</p>
                </div>
                
                <!-- Feature 6 -->
                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
                    <i class="fas fa-shield-alt text-red-500 text-5xl mb-4"></i>
                    <h4 class="text-xl font-bold text-gray-800 mb-2">אבטחה מלאה</h4>
                    <p class="text-gray-600">אימות משתמשים, הרשאות ושמירה מאובטחת</p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-8 mt-16">
            <div class="container mx-auto px-4">
                <div class="grid md:grid-cols-3 gap-8">
                    <div>
                        <h5 class="text-lg font-bold mb-4">מוזמנים בקליק</h5>
                        <p class="text-gray-400">מערכת מתקדמת לניהול מוזמנים לחתונה</p>
                    </div>
                    <div>
                        <h5 class="text-lg font-bold mb-4">קישורים</h5>
                        <ul class="space-y-2">
                            <li><a href="/about" class="text-gray-400 hover:text-white">אודות</a></li>
                            <li><a href="/faq" class="text-gray-400 hover:text-white">שאלות נפוצות</a></li>
                            <li><a href="/contact" class="text-gray-400 hover:text-white">צור קשר</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 class="text-lg font-bold mb-4">משפטי</h5>
                        <ul class="space-y-2">
                            <li><a href="/terms" class="text-gray-400 hover:text-white">תקנון שימוש</a></li>
                            <li><a href="/privacy" class="text-gray-400 hover:text-white">מדיניות פרטיות</a></li>
                            <li><a href="/accessibility" class="text-gray-400 hover:text-white">נגישות</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2024 מוזמנים בקליק. כל הזכויות שמורות.</p>
                </div>
            </div>
        </footer>
    </body>
    </html>
  `);
});

// Static pages
app.get('/about', (c) => c.html(aboutPage));
app.get('/faq', (c) => c.html(faqPage));
app.get('/contact', (c) => c.html(contactPage));
app.get('/terms', (c) => c.html(termsPage));
app.get('/privacy', (c) => c.html(privacyPage));
app.get('/accessibility', (c) => c.html(accessibilityPage));

// Dev login page
app.get('/dev-login', (c) => c.html(devLoginPage));

// Auth pages
app.get('/login', (c) => c.html(loginPage));
app.get('/auth/verify', (c) => c.html(authVerifyPage));
app.get('/auth/success', (c) => c.html(authSuccessPage));
app.get('/signup', (c) => c.redirect('/login'));

// Dashboard
app.get('/dashboard', (c) => c.html(dashboardPage));

// Create Event
app.get('/create-event', (c) => c.html(createEventPage));

// Event Management
app.get('/event/:id', (c) => c.html(eventManagementPage));

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err);
  
  if (err instanceof AppError) {
    return c.json({
      success: false,
      error: err.message,
      code: err.code
    }, err.statusCode);
  }
  
  return c.json({
    success: false,
    error: 'שגיאה כללית בשרת'
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'הדף לא נמצא'
  }, 404);
});

export default app;
