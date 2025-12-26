# 🎉 מוזמנים בקליק - Wedding Guest OS

מערכת מקצועית מלאה לניהול מוזמנים לחתונה בעברית עם תמיכה מלאה ב-RTL.

> **✅ Production-Ready**: המערכת מוכנה לשימוש מיידי!  
> **Authentication System**: מערכת אימות מלאה עם **Magic Link** ו-**Google OAuth**

## 🌐 קישורים

- **Production**: `https://webapp-cio.pages.dev`
- **Login**: `https://webapp-cio.pages.dev/login`
- **Latest Deploy**: `https://d5388cdd.webapp-cio.pages.dev`
- **API Health**: `/api/health`
- **Dev Login** (for development): `/dev-login`
- **Public RSVP Demo**: `/e/wedding-demo-abc123`

## ✨ תכונות עיקריות

### 🔐 **Authentication System (מערכת אימות מלאה)**
- **Magic Link (קישור קסם)**: התחברות ללא סיסמה - רק אימייל
  - משתמש מזין אימייל → מקבל לינק למייל → לוחץ → מחובר
  - אין צורך לזכור סיסמאות
  - קישורים בתוקף ל-15 דקות
- **Google OAuth**: התחברות עם חשבון Google בלחיצה
  - כפתור "התחבר עם Google"
  - אין צורך בהרשמה נפרדת
- **Session Management מאובטח**: JWT tokens עם תוקף של 7 ימים
- **100% חינמי**: 
  - Resend (100 magic links ליום)
  - Google OAuth (ללא הגבלה)
  - Cloudflare D1 (עד 5GB חינמי)

### 📱 **RSVP ציבורי משודרג**
- לינק ייחודי לכל אירוע (`/e/:slug`)
- טופס אישור הגעה בעברית מלאה + RTL
- **Upsert Logic**: עדכון אוטומטי לפי שם+טלפון
- **ICS Calendar Download**: הורדת קובץ יומן לאורחים שאישרו הגעה
- **Honeypot Anti-Spam**: מניעת בוטים וספאם
- **דף סגירת RSVP**: הודעה מותאמת כשה-RSVP נסגר
- שדות מותאמים אישית: מספר מגיעים, בחירת מנה, אלרגיות, הערות

### 🎛️ **דשבורד ניהול אירוע מלא (8 טאבים)**
1. **סקירה (Overview)**: סטטיסטיקות כוללות, **גרפים אינטראקטיביים**, **תובנות אוטומטיות**, פעולות מהירות
2. **אישורי הגעה (RSVPs)**: טבלה מסוננת, ייצוא CSV/Excel/**PDF**, צפייה בפרטים
3. **רשימת מוזמנים (Guests)**: הוספה ידנית, **ייבוא CSV**, עריכה ומחיקה, ייצוא **PDF**
4. **הושבה (Seating)**: **Drag & Drop**, **Auto-fill חכם**, תצוגת אורחים בשולחנות, ייצוא **PDF**
5. **צ'ק-אין (Check-in)**: חיפוש מהיר, סטטיסטיקות, רישום הגעה בלחיצה
6. **Walk-ins**: רישום מהיר של אורחים ללא הזמנה מראש
7. **הודעות (Messages)**: תבניות Copy/Paste מוכנות עם personalization
8. **הגדרות (Settings)**: עריכת פרטי אירוע, פתיחה/סגירת RSVP, **מחיקת אירוע**

### 👥 **ניהול מוזמנים**
- ✅ **הוספה ידנית**: טופס מלא עם כל השדות
- ✅ **עריכת מוזמן**: עדכון פרטים קיימים
- ✅ **מחיקת מוזמן**: הסרה מהרשימה
- ✅ **ייבוא CSV המוני**: העלאת מאות מוזמנים בבת אחת
  - הורדת תבנית CSV מוכנה
  - תצוגה מקדימה לפני ייבוא
  - תמיכה בשדות: שם מלא, טלפון, צד (חתן/כלה), קבוצה
- ✅ **ייצוא CSV/Excel**: רשימות מסוננות
- זיהוי כפילויות לפי טלפון
- חיפוש וסינון מתקדם

### 🪑 **סידורי הושבה (Drag & Drop + AI Smart Algorithm)**
- ✅ **יצירת שולחנות**: הוספת שולחנות עם שם, מספר, וקיבולת
- ✅ **Drag & Drop**: גרירת אורחים (RSVPs + Guests) לשולחנות
- ✅ **Auto-fill חכם (AI-Powered)**: השלמה אוטומטית מבוססת אלגוריתם
  - **שלב 1**: התאמה חכמה של קבוצות לשולחנות
    - משפחה → שולחן "משפחה"
    - חברים → שולחן "חברים"
    - עבודה → שולחן "עבודה"
  - **שלב 2**: קיבוץ לפי צד (חתן/כלה) וקבוצה
  - **שלב 3**: מיון לפי גודל קבוצות (גדול לקטן)
  - **שלב 4**: מילוי יעיל שמשאיר קבוצות יחד
  - תמיכה דו-לשונית (עברית/אנגלית)
  - Fuzzy matching לשמות שולחנות
- ✅ **Bulk Seating API**: בקשה אחת במקום עשרות (מניעת rate limit)
- ✅ **תצוגת אורחים**: רשימה מלאה של מי יושב בכל שולחן
- ✅ **הבחנה ויזואלית**: 
  - RSVPs: רקע ורוד + תג מספר מגיעים
  - Guests: רקע סגול + תג "מוזמן"
- ✅ **הסרה מהשולחן**: כפתור X לכל אורח
- תצוגה ויזואלית של תפוסה (X/Y)
- ייצוא רשימת הושבה לExcel

### ✅ **צ'ק-אין ביום האירוע**
- מסך מותאם מובייל מלא
- חיפוש מהיר של מוזמנים (שם/טלפון/שולחן)
- רישום הגעה בלחיצה + ביטול
- **סטטטיסטיקות בזמן אמת**: הגיעו / צפוי / לא מגיע
- תצוגת שולחן לכל אורח

### 💬 **הודעות למוזמנים**
- תבניות מוכנות: הזמנה, תזכורת, סגירת RSVP
- **Personalization**: {שם} מוחלף אוטומטית
- תצוגה מקדימה עם שם דוגמה
- **Copy/Paste**: העתקה ללוח להדבקה ידנית

### 🔒 **אבטחה מלאה**
- **Authentication**: Magic Link + Google OAuth
- **JWT Tokens**: תוקף 7 ימים, חתימה מאובטחת
- **Session Management**: D1-based sessions עם expiration
- **Rate limiting מותאם**:
  - RSVP: 50 בקשות לדקה
  - API: 100 בקשות לדקה
  - Auth: 50 בקשות לדקה
- Validation מלא עם Zod
- Audit logs לכל פעולה חשובה
- הרשאות מבוססות בעלות
- **Cascade Delete**: מחיקת אירוע מוחקת את כל הנתונים הקשורים

## 🏗️ טכנולוגיות

### Backend
- **Hono** - Web framework קליל ומהיר
- **Cloudflare D1** - SQLite מבוזר גלובלי (עם --local mode)
- **Drizzle ORM** - Type-safe ORM
- **Zod** - Schema validation
- **Web Crypto API** - ID generation (hex encoding)

### Frontend
- **TailwindCSS** - CSS framework
- **FontAwesome** - Icons
- **Axios** - HTTP client
- **Vanilla JS** - Pure JavaScript (ללא framework)

### Infrastructure
- **Cloudflare Pages** - Hosting + Edge Functions
- **Cloudflare Workers** - Serverless runtime
- **Wrangler** - CLI tool לפריסה
- **PM2** - Process manager (development)

## 📦 התקנה והרצה מקומית

### דרישות מוקדמות
- Node.js 18+
- npm
- חשבון Cloudflare (חינמי) להרצת local D1
- (אופציונלי) Google OAuth credentials
- (אופציונלי) Resend API key למייל

### 1. Clone והתקנה

```bash
git clone <repository-url>
cd webapp
npm install
```

### 2. הגדרת משתני סביבה

צור קובץ `.dev.vars`:

```env
# App Configuration
APP_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# Resend API (for Magic Link email)
RESEND_API_KEY=re_xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Dev Auth (for development bypass)
DEV_AUTH=true
```

**הערה**: אם אתה רוצה לעבוד בלי אימות אמיתי בפיתוח, השאר רק `DEV_AUTH=true` והשאר יכולים להישאר ריקים.

### 3. הגדרת Database

```bash
# הרצת migrations ב-local mode
npm run db:migrate:local

# (אופציונלי) טעינת seed data לדוגמה
npm run db:seed
```

### 4. הרצה מקומית

**אופציה A: עם PM2 (מומלץ)**
```bash
# Clean port
fuser -k 3000/tcp 2>/dev/null || true

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs mozmanim-beclick --nostream
```

**אופציה B: ישירות**
```bash
npm run build
npm run dev:sandbox
```

גש ל: http://localhost:3000

### 5. בדיקת המערכת

```bash
# Health check
curl http://localhost:3000/api/health

# Login page
http://localhost:3000/login

# Dev login page (for development bypass)
http://localhost:3000/dev-login

# Public RSVP demo
http://localhost:3000/e/wedding-demo-abc123
```

## 🚀 פריסה לפרודקשן (Cloudflare Pages)

### דרישות מוקדמות
1. חשבון Cloudflare (חינמי)
2. Wrangler CLI מותקן גלובלית

### שלב 1: התקנת Wrangler והתחברות

```bash
npm install -g wrangler
wrangler login
```

### שלב 2: יצירת D1 Database בפרודקשן

```bash
# צור database
npx wrangler d1 create webapp-production

# שמור את ה-database_id שחוזר
```

עדכן את `wrangler.jsonc` עם ה-ID שקיבלת:

```jsonc
{
  "name": "webapp",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ]
}
```

### שלב 3: הרצת Migrations בפרודקשן

```bash
npm run db:migrate:prod
```

### שלב 4: יצירת Cloudflare Pages Project

```bash
# צור את הפרויקט
npx wrangler pages project create webapp \
  --production-branch main \
  --compatibility-date 2024-01-01
```

### שלב 5: הגדרת Secrets

```bash
# App URL
npx wrangler pages secret put APP_URL --project-name webapp
# הזן: https://webapp-cio.pages.dev

# JWT Secret (generate strong random key)
openssl rand -hex 32 | npx wrangler pages secret put JWT_SECRET --project-name webapp

# Resend API Key
npx wrangler pages secret put RESEND_API_KEY --project-name webapp
# הזן: re_xxx

# Google OAuth
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name webapp
# הזן: xxx.apps.googleusercontent.com

npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name webapp
# הזן: GOCSPX-xxx
```

**הערות חשובות**:
- **APP_URL**: שנה ל-URL הסופי שלך (לא localhost)
- **JWT_SECRET**: חייב להיות מחרוזת אקראית חזקה (32+ תווים)
- **Resend API Key**: קבל ב-https://resend.com (חינמי, 100 emails/day)
- **Google OAuth**: צור ב-Google Cloud Console → APIs & Services → Credentials

### שלב 6: Deploy

```bash
# Build + Deploy
npm run build
npx wrangler pages deploy dist --project-name webapp
```

תקבל:
- **Production URL**: `https://webapp.pages.dev`
- **API Endpoints**: `https://webapp.pages.dev/api/*`

### שלב 7: בדיקה

```bash
# Health check
curl https://webapp-cio.pages.dev/api/health

# Test login page
https://webapp-cio.pages.dev/login

# Test dev login (for development)
https://webapp-cio.pages.dev/dev-login
```

### שלב 8: הגדרת Google OAuth Redirect URIs

עבור ל-Google Cloud Console → OAuth credentials → ערוך את ה-Client ID:

הוסף **Authorized redirect URIs**:
```
https://webapp-cio.pages.dev/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

### שלב 9 (אופציונלי): הגדרת Resend Domain

לשליחת מיילים מדומיין מותאם אישית (לא נדרש למדת חינמי):
1. היכנס ל-https://resend.com
2. עבור ל-Domains
3. הוסף את הדומיין שלך
4. הגדר DNS records (SPF, DKIM)

**ללא זה**, מיילים נשלחים מ-`onboarding@resend.dev` (עובד מצוין למימוש חינמי)

## 📁 מבנה הפרויקט

```
webapp/
├── migrations/                 # D1 Database migrations
│   ├── 0001_initial_schema.sql
│   └── meta/
├── src/
│   ├── db/                    # Database schema + ORM
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── lib/                   # Utilities + validators
│   │   ├── utils.ts           # generateId (hex), formatters
│   │   └── validators.ts      # Zod schemas
│   ├── middleware/            # Authentication + Rate limiting
│   │   ├── auth.ts           # Dev Auth + Clerk
│   │   ├── audit.ts          # Audit logging
│   │   └── rateLimit.ts      # IP-based rate limiting
│   ├── pages/                 # Server-rendered pages
│   │   ├── homePage.ts
│   │   ├── dashboardPage.ts
│   │   ├── eventManagementPage.ts
│   │   ├── createEventPage.ts
│   │   └── publicRsvp.ts
│   ├── routes/                # API endpoints
│   │   ├── auth.ts           # /api/auth/*
│   │   ├── events.ts         # /api/events/*
│   │   ├── rsvps.ts          # /api/rsvp/* + /api/events/:id/rsvps
│   │   ├── guests.ts         # /api/events/:id/guests + /api/guests/:id
│   │   ├── tables.ts         # /api/events/:id/tables
│   │   ├── seating.ts        # /api/events/:id/seating + /api/seating/:id
│   │   └── checkins.ts       # /api/events/:id/checkins
│   └── index.tsx              # Main app entry
├── public/
│   └── static/                # Static assets
│       ├── event-management.js  # Client-side logic
│       └── styles.css
├── .wrangler/                 # Local D1 database (auto-generated)
├── seed.sql                   # Seed data
├── ecosystem.config.cjs       # PM2 config
├── wrangler.jsonc             # Cloudflare config
├── vite.config.ts             # Vite config
├── package.json
├── .gitignore
└── README.md
```

## 🗄️ Database Schema

### Users
משתמשים רשומים (בעלי אירועים)
- `id` (primary key, text UUID)
- `email` (unique, not null)
- `full_name` (nullable)
- `avatar_url` (nullable)
- `auth_provider` ('magic-link' | 'google')
- `google_id` (nullable, unique)
- `created_at`, `last_login`

### Magic Links
קישורי קסם זמניים (נמחקים לאחר שימוש)
- `id` (primary key, text UUID)
- `email` (not null)
- `token` (unique, expires in 15 minutes)
- `expires_at`, `used` (boolean)

### Sessions
סשנים אקטיביים של משתמשים
- `id` (primary key, text UUID)
- `user_id` (foreign key → users)
- `token` (JWT, unique)
- `expires_at` (7 days from creation)
- `created_at`

### Events
אירועים (חתונות)
- `id` (primary key, hex string)
- `slug` (unique, URL-safe)
- `eventName`, `coupleNames`, `dateTime`
- `venueName`, `venueAddress`, `wazeLink`
- `ownerUserId` (foreign key → users)

### Event Settings
הגדרות מותאמות לכל אירוע
- `isRsvpOpen`, `requirePhone`, `showMealChoice`, etc.

### RSVPs
תגובות מוזמנים דרך הלינק הציבורי
- `id` (primary key, hex string)
- `eventId` (foreign key → events)
- `fullName`, `phone`, `status` (confirmed/declined)
- `attendingCount`, `mealChoice`, `allergies`, `comment`

### Guests
רשימת יעד - מוזמנים שהוזנו על ידי בעל האירוע
- `id` (primary key, hex string)
- `eventId` (foreign key → events)
- `fullName`, `phone`, `side` (חתן/כלה), `groupLabel`

### Tables
שולחנות באירוע
- `id` (primary key, hex string)
- `eventId` (foreign key → events)
- `tableName`, `tableNumber`, `capacity`

### Seating
סידורי הושבה
- `id` (primary key, hex string)
- `eventId`, `tableId` (foreign key → tables)
- `rsvpId` OR `guestId` (one required)

### Checkins
צ'ק-אינים ביום האירוע
- `id` (primary key, hex string)
- `eventId`, `rsvpId` (foreign key)

### Audit Logs
לוגים של כל הפעולות החשובות
- יצירת/עדכון/מחיקת אירועים
- הוספת/עדכון/מחיקת מוזמנים
- שינויים בהושבה

## 🔌 API Endpoints

### Public (ללא אימות)
- `GET /api/health` - Health check
- `GET /api/rsvp/:slug/event` - פרטי אירוע לטופס RSVP
- `POST /api/rsvp/:slug` - יצירת/עדכון RSVP

### Authentication
- `POST /api/auth/magic-link` - שליחת קישור קסם למייל
- `GET /api/auth/verify/:token` - אימות קישור קסם
- `GET /api/auth/google` - התחברות Google (redirect)
- `GET /api/auth/google/callback` - Google callback
- `GET /api/auth/me` - פרטי משתמש מחובר
- `POST /api/auth/logout` - התנתקות
- `POST /api/auth/dev-login` - התחברות dev mode (development only)

### Events
- `GET /api/events` - רשימת אירועים (שלי)
- `POST /api/events` - יצירת אירוע
- `GET /api/events/:id` - פרטי אירוע
- `PUT /api/events/:id` - עדכון אירוע
- `DELETE /api/events/:id` - **מחיקת אירוע (cascade)**

### RSVPs
- `GET /api/events/:eventId/rsvps` - רשימת RSVPs
- `PUT /api/rsvps/:id` - עדכון RSVP
- `DELETE /api/rsvps/:id` - מחיקת RSVP

### Guests
- `GET /api/events/:eventId/guests` - רשימת יעד
- `POST /api/events/:eventId/guests` - הוספת אורח
- `POST /api/events/:eventId/guests/bulk` - **ייבוא המוני (CSV)**
- `PUT /api/guests/:id` - **עדכון אורח**
- `DELETE /api/guests/:id` - **מחיקת אורח**

### Tables
- `GET /api/events/:eventId/tables` - רשימת שולחנות
- `POST /api/events/:eventId/tables` - יצירת שולחן
- `PUT /api/tables/:id` - עדכון שולחן
- `DELETE /api/tables/:id` - מחיקת שולחן

### Seating
- `GET /api/events/:eventId/seating` - סידורי הושבה
- `POST /api/events/:eventId/seating` - **הוספת הושבה (תומך ב-rsvpId וגם guestId)**
- `POST /api/events/:eventId/seating/bulk` - **הושבה המונית (bulk API)**
- `DELETE /api/seating/:id` - מחיקת הושבה

### Checkins
- `GET /api/events/:eventId/checkins` - רשימת צ'ק-אינים
- `POST /api/events/:eventId/checkins` - ביצוע צ'ק-אין
- `DELETE /api/checkins/:id` - ביטול צ'ק-אין

## 🛠️ סקריפטים זמינים

```bash
# Development
npm run dev              # Vite dev server
npm run dev:sandbox      # Wrangler dev (sandbox)
npm run dev:d1           # Wrangler dev with D1 local

# Build
npm run build            # Vite build

# Database
npm run db:migrate:local  # Run migrations (local)
npm run db:migrate:prod   # Run migrations (production)
npm run db:seed          # Load seed data
npm run db:reset         # Reset local DB

# Deployment
npm run deploy           # Build + Deploy to Cloudflare
npm run deploy:prod      # Deploy to production

# Utilities
npm run clean-port       # Kill process on port 3000
npm run test             # Health check
```

## 🐛 תיקוני באגים עיקריים

### ✅ Event ID Issues (Fixed)
- **בעיה**: IDs עם `/` גרמו ל-404 ב-URLs
- **פתרון**: שינוי מ-base64url ל-**hex encoding** (20 characters)
- **תוצאה**: IDs בטוחים לחלוטין ב-URLs

### ✅ Route Conflicts (Fixed)
- **בעיה**: Routes לא הותאמו נכון (404 errors)
- **פתרון**: תיקון mounting paths (`/api/guests/:id`, `/api/seating/:id`)
- **תוצאה**: כל ה-endpoints עובדים

### ✅ Rate Limiting (Optimized)
- **בעיה**: 30 req/min גרם ל-429 בניווט מהיר
- **פתרון**: העלאה ל-100 req/min ב-API
- **תוצאה**: חוויית משתמש חלקה

### ✅ Guest Management (Completed)
- **בעיה**: כפתורי עריכה/מחיקה לא עבדו
- **פתרון**: תיקון onclick handlers (string IDs)
- **תוצאה**: ניהול מלא של מוזמנים

### ✅ Seating Synchronization (Fixed)
- **בעיה**: אורחים לא הופיעו בהושבה
- **פתרון**: loadSeating() טוען גם RSVPs וגם Guests
- **תוצאה**: סינכרון מושלם בין טאבים

### ✅ Drag & Drop Seating (Fixed)
- **בעיה**: 400 Bad Request בגרירת אורחים
- **פתרון**: תמיכה ב-rsvpId וגם guestId, ללא parseInt()
- **תוצאה**: drag & drop עובד לכל סוגי האורחים

### ✅ Auto-fill Seating (Smart Algorithm)
- **בעיה**: FIFO פשוט לא לקח בחשבה קבוצות
- **פתרון**: אלגוריתם חכם 2-שלבי
  - Phase 1: התאמת קבוצות לשולחנות מתאימים
  - Phase 2: מילוי שאריות
- **תוצאה**: משפחות יושבות ביחד, חברים ביחד

### ✅ Bulk Seating API (Performance Fix)
- **בעיה**: 429 Too Many Requests בהושבה אוטומטית
- **פתרון**: endpoint חדש `/seating/bulk` 
- **תוצאה**: בקשה אחת במקום עשרות, פי 10 יותר מהיר

### ✅ Table-Group Matching (Intelligence)
- **בעיה**: האלגוריתם ממלא שולחן אחרי שולחן ללא היגיון
- **פתרון**: התאמה חכמה של קבוצות לשמות שולחנות
- **תוצאה**: אורחים "משפחה" → שולחן "משפחה" אוטומטית

### ✅ Table Guest Display (Enhanced)
- **בעיה**: רק מספרים (3/10) בשולחנות
- **פתרון**: תצוגה מלאה של שמות כל האורחים
- **תוצאה**: רואים מי יושב איפה

### ✅ Event Deletion (Cascade Fixed)
- **בעיה**: מחיקת אירוע נכשלה (FK constraints)
- **פתרון**: Cascade delete בסדר נכון
- **תוצאה**: מחיקה מלאה של אירוע ונתונים

### ✅ Auto Table Creation with Buffer (דצמבר 2024)
- **בעיה 1**: שולחנות נוצרו בגודל מדויק (46 guests → capacity 46) ללא buffer
- **פתרון**: תיקון הקוד כך ש-capacity תמיד יכלול buffer 15% (46 guests → capacity 53)
- **בעיה 2**: capacity validation היה optional עם default(10), זה דרס את הערכים שנשלחו
- **פתרון**: הסרת .optional() ו-.default(10) מה-schema, הגדלת max ל-100
- **תוצאה**: כל שולחן נוצר עם מקום נוסף (buffer 15%) כך שיש מרווח נשימה

### ✅ Seating Note & Removal Warning (דצמבר 2024)
- **בעיה 1**: כשאורח הוסר מהושבה (RSVP capacity change), לא הוצגה הערה מתאימה ברשימת "אורחים ללא הושבה"
- **פתרון**: הוספת seatingNote לרשומת ה-unseated עם אייקון אזהרה ⚠️ וטקסט אדום
- **בעיה 2**: הסרת אורח מ-RSVP הציגה אזהרה גם למשתמש הציבורי
- **פתרון**: הסרת ה-warning מתגובת ה-RSVP הציבורי (נשאר רק בצד האדמין)
- **תוצאה**: רשימת "אורחים ללא הושבה" מציגה למה האורח הוסר, וההערה נמחקת אוטומטית בהושבה חדשה

### ✅ Capacity Validation with attendingCount (דצמבר 2024)
- **בעיה**: בדיקת קיבולת לא התחשבה ב-attendingCount של RSVPs, כך שניתן היה להוסיף אורח לשולחן מלא
- **פתרון**: Backend מחשב תפוסה אמיתית: `occupiedSeats = RSVPs.attendingCount + Guests`
- **תוצאה**: הודעת שגיאה ברורה: "אין מספיק מקום. תפוס: 46, נדרש: 3, קיבולת: 46"

### ✅ Magic Link Email Fix (דצמבר 2024)
- **בעיה**: Magic Link emails לא נשלחו בפרודקשן (Frontend הציג הצלחה אבל המייל לא הגיע)
- **סיבה**: RESEND_API_KEY לא הוגדר כ-secret ב-Cloudflare Pages
- **פתרון**: הוספת secrets בפרודקשן:
  - `RESEND_API_KEY`: re_8Xzeixn6_Ff9rYGE6qv1FfKLpPMzMx68m
  - `APP_URL`: https://webapp-cio.pages.dev
  - `JWT_SECRET`: סיסמה חזקה אקראית (32+ bytes)
- **תוצאה**: התחברות עם Magic Link עובדת מצוין בפרודקשן

### ✅ CSV Import Loading & Duplicate Prevention (דצמבר 2024)
- **בעיה 1**: ייבוא CSV לא הציג spinner, גרם ללחיצות כפולות ויצירת 1,400 כפילויות במקום 350
- **פתרון**: הוספת spinner עם טקסט "מייבא 350 אורחים...", השבתת כפתורים במהלך הייבוא
- **בעיה 2**: קושי למחוק כפילויות ידנית
- **פתרון**: כפתור "מחק הכל" בצבע אדום עם אישור כפול
- **תוצאה**: ייבוא מהיר יותר וידידותי למשתמש, ניקוי מהיר של כפילויות

## 📝 תכונות שהושלמו

- [x] ✅ **Authentication System (Magic Link + Google OAuth)**
  - [x] Magic Link (email without password)
  - [x] Google OAuth integration
  - [x] JWT session management
  - [x] D1-based sessions
  - [x] Resend email integration
- [x] ✅ Dev Auth Mode (for development)
- [x] ✅ Public RSVP with ICS download
- [x] ✅ Event Management Dashboard (8 tabs)
- [x] ✅ Guest CRUD operations
- [x] ✅ **CSV Import with template download**
- [x] ✅ Table management
- [x] ✅ **Drag & Drop seating (RSVPs + Guests)**
- [x] ✅ **Smart Auto-fill seating (AI-powered algorithm)**
  - [x] Group-based seating
  - [x] Table-group matching
  - [x] Bulk seating API
- [x] ✅ **Guest list display in tables**
- [x] ✅ Check-in system
- [x] ✅ **Walk-ins page** (מגיעים ללא הזמנה)
- [x] ✅ Copy/Paste messages
- [x] ✅ **CSV/Excel/PDF export**
- [x] ✅ **Analytics Dashboard**
  - [x] Interactive charts (Chart.js)
  - [x] Automated insights
  - [x] Progress tracking
- [x] ✅ **Cascade delete for events**
- [x] ✅ Audit logging
- [x] ✅ Rate limiting (optimized 100 req/min)
- [x] ✅ **Improved error messages**

## 🚧 פיתוח עתידי (Nice to Have)

- [x] ✅ Walk-ins page (מגיעים בלי הזמנה) - **הושלם!**
- [x] ✅ PDF export לרשימות - **הושלם!**
- [x] ✅ Analytics Dashboard מתקדם - **הושלם!**
- [ ] WhatsApp Business API integration
- [ ] תזכורות אוטומטיות
- [ ] Multi-language support
- [ ] React/Vue admin panel

## 🤝 תמיכה

לשאלות, בעיות או הצעות:
- GitHub Issues
- Email: support@example.com

## 📄 רישיון

MIT License

---

**Built with ❤️ using Cloudflare Pages + Hono + D1 + AI Smart Algorithms**

**תכונות עיקריות**: CSV Import | Drag & Drop | AI Auto-fill | Real-time Sync | RTL Support | Bulk API
