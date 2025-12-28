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

// Debug logging system (in-memory) - BEFORE auth middleware
const debugLogs: any[] = [];
const MAX_LOGS = 200;

app.post('/api/debug/log', async (c) => {
  try {
    const body = await c.req.json();
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...body
    };
    
    debugLogs.push(logEntry);
    
    // Keep only last MAX_LOGS entries
    if (debugLogs.length > MAX_LOGS) {
      debugLogs.shift();
    }
    
    return c.json({ success: true, count: debugLogs.length });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get('/api/debug/logs', (c) => {
  return c.json({ 
    logs: debugLogs,
    count: debugLogs.length,
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/debug/logs', (c) => {
  debugLogs.length = 0;
  return c.json({ success: true, message: 'Logs cleared' });
});

// Dev Authentication middleware (after debug endpoints)
app.use('*', devAuthMiddleware);

// Serve static files from dist (Cloudflare Pages deployment)
app.use('/static/*', serveStatic({ root: './' }));

// Health check (before other routes)
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes (order matters!)
// Mount public routes FIRST (before protected routers with auth middleware)
app.route('/api/rsvp', publicRsvpsRouter);         // Public RSVP routes (:slug, :slug/event) - NO AUTH
app.route('/api/auth', authRouter);
app.route('/api/auth/google', googleRouter);
app.route('/api', eventsRouter);
app.route('/api', guestsRouter);
app.route('/api', tablesRouter);
app.route('/api', seatingRouter);
app.route('/api', checkinsRouter);
app.route('/api/events', rsvpsRouter);            // Protected RSVP routes (/:eventId/rsvps)

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
          
          /* Mobile Responsive */
          @media (max-width: 768px) {
            .hero-title { font-size: 2rem !important; line-height: 1.2 !important; }
            .hero-subtitle { font-size: 1.125rem !important; }
            .nav-links { display: none; }
          }
        </style>
    </head>
    <body class="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 min-h-screen">
        <!-- Loading Spinner (shown while checking auth) -->
        <div id="auth-check-loading" class="fixed inset-0 bg-white flex items-center justify-center z-50">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-6xl text-pink-500 mb-4"></i>
                <p class="text-gray-600 text-lg">בודק אימות...</p>
            </div>
        </div>

        <!-- Main Content (hidden until auth check completes) -->
        <div id="main-content" class="hidden">
        <!-- Header -->
        <nav class="bg-white shadow-lg">
            <div class="container mx-auto px-3 md:px-4 py-3 md:py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-heart text-pink-500 text-2xl md:text-3xl"></i>
                        <h1 class="text-lg md:text-2xl font-bold text-gray-800">מוזמנים בקליק</h1>
                    </div>
                    <div class="nav-links flex gap-4 items-center">
                        <a href="/about" class="text-gray-600 hover:text-pink-500 py-2">אודות</a>
                        <a href="/contact" class="text-gray-600 hover:text-pink-500 py-2">צור קשר</a>
                        <a href="/login" class="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition">התחברות</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <div class="container mx-auto px-4 py-8 md:py-16">
            <div class="max-w-4xl mx-auto text-center">
                <h2 class="hero-title text-3xl md:text-5xl font-bold text-gray-800 mb-4 md:mb-6">
                    ניהול מוזמנים לחתונה<br />
                    <span class="text-pink-500">בקליק אחד</span>
                </h2>
                <p class="hero-subtitle text-base md:text-xl text-gray-600 mb-6 md:mb-8 px-4">
                    מערכת מתקדמת לניהול אירועים: RSVP, רשימות מוזמנים, סידורי הושבה, צ'ק-אין ועוד
                </p>
                <div class="flex flex-col md:flex-row justify-center gap-3 md:gap-4 px-4">
                    <a href="/login" class="bg-pink-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-pink-600 transition shadow-lg">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        התחל עכשיו - התחברות
                    </a>
                    <a href="#features" class="hidden md:flex bg-white text-gray-800 px-6 py-3 md:px-8 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-gray-100 transition shadow-lg items-center justify-center">
                        <i class="fas fa-info-circle mr-2"></i>
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
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // Check if user is already logged in
            async function checkAuth() {
                try {
                    // Try to get token from localStorage first
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                        axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                    }

                    // Check authentication status (with credentials to send cookies)
                    const response = await axios.get('/api/auth/me', {
                        withCredentials: true
                    });
                    
                    if (response.data.user) {
                        // User is logged in - redirect to dashboard
                        window.location.href = '/dashboard';
                    } else {
                        // Not logged in - show landing page
                        showLandingPage();
                    }
                } catch (error) {
                    console.log('Auth check:', error.response?.status || error.message);
                    // Auth check failed - show landing page
                    showLandingPage();
                }
            }

            function showLandingPage() {
                document.getElementById('auth-check-loading').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
            }

            // Run auth check on page load
            checkAuth();
        </script>
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
app.get('/event/:id', (c) => c.html(eventManagementPage()));

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
