# 🎯 Project Context - מוזמנים בקליק

## 📋 מידע בסיסי
- **שם הפרויקט**: מוזמנים בקליק (Wedding Guest OS)
- **GitHub Repository**: https://github.com/maor412/muzmanim-beclick
- **Production URL**: https://9404ebe2.webapp-cio.pages.dev
- **Custom Domain**: https://webapp-cio.pages.dev
- **טכנולוגיה עיקרית**: Hono + Cloudflare Pages + D1 Database

## 🏗️ ארכיטקטורה טכנית

### Backend
- **Framework**: Hono (lightweight web framework)
- **Runtime**: Cloudflare Workers
- **Deployment**: Cloudflare Pages

### Database & Storage
- **Database**: Cloudflare D1 (SQLite מבוזר)
  - Production DB: `webapp-production`
  - Local development: `.wrangler/state/v3/d1/` (auto-generated with `--local` flag)
  - Migrations: `migrations/` directory
  
### Authentication
- **Magic Link**: Resend API (email-based passwordless login)
- **Google OAuth**: Google Cloud Console OAuth 2.0
- **Session Management**: JWT tokens + D1 sessions table (7 days expiry)
- **Cookie-based auth**: `mozmanim_token` cookie (httpOnly, secure, sameSite: Lax)

### Frontend
- **No Framework**: Vanilla JavaScript
- **Styling**: TailwindCSS (CDN)
- **Icons**: FontAwesome (CDN)
- **HTTP Client**: Axios (CDN)
- **Charts**: Chart.js (CDN)

## 🔑 Environment Variables & Secrets

### Local Development (`.dev.vars`)
```env
APP_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
RESEND_API_KEY=re_xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
DEV_AUTH=true
```

### Production (Cloudflare Pages Secrets)
**הגדרו ב-Cloudflare דרך:**
```bash
npx wrangler pages secret put SECRET_NAME --project-name webapp-cio
```

**Secrets שהוגדרו:**
1. `APP_URL`: https://webapp-cio.pages.dev
2. `JWT_SECRET`: סיסמה חזקה אקראית (32+ bytes)
3. `RESEND_API_KEY`: re_8Xzeixn6_Ff9rYGE6qv1FfKLpPMzMx68m
4. `GOOGLE_CLIENT_ID`: מ-Google Cloud Console
5. `GOOGLE_CLIENT_SECRET`: מ-Google Cloud Console

## 🗄️ Database Schema (D1)

### Tables קיימות
1. **users** - משתמשים רשומים (בעלי אירועים)
2. **magic_links** - קישורי קסם זמניים (15 דקות)
3. **sessions** - סשנים אקטיביים (7 ימים)
4. **events** - אירועים (חתונות)
5. **rsvps** - תגובות מוזמנים דרך לינק ציבורי
6. **guests** - רשימת יעד (מוזמנים שהוזנו ידנית)
7. **tables** - שולחנות באירוע
8. **seating** - סידורי הושבה
9. **checkins** - צ'ק-אינים ביום האירוע
10. **audit_logs** - לוגים של פעולות

### Migration Commands
```bash
# Local development
npm run db:migrate:local

# Production
npm run db:migrate:prod

# Reset local DB
npm run db:reset
```

## 🔐 Third-Party Services

### 1. Resend (Email Service)
- **Purpose**: Magic Link emails
- **Free Tier**: 100 emails/day
- **API Key**: `re_8Xzeixn6_Ff9rYGE6qv1FfKLpPMzMx68m`
- **Dashboard**: https://resend.com
- **From Email**: onboarding@resend.dev (default)

### 2. Google OAuth
- **Purpose**: התחברות עם חשבון Google
- **Console**: https://console.cloud.google.com
- **Project**: [שם הפרויקט שלך]
- **Redirect URIs**:
  - https://webapp-cio.pages.dev/api/auth/google/callback
  - http://localhost:3000/api/auth/google/callback

### 3. Cloudflare
- **Account**: [חשבון Cloudflare שלך]
- **Dashboard**: https://dash.cloudflare.com
- **D1 Database ID**: [מופיע ב-wrangler.jsonc]
- **Pages Project**: webapp-cio

## 📁 מבנה הפרויקט

```
webapp/
├── src/
│   ├── index.tsx              # Main app entry
│   ├── routes/                # API endpoints
│   │   ├── auth.ts           # /api/auth/*
│   │   ├── events.ts         # /api/events/*
│   │   ├── rsvps.ts          # /api/rsvp/*
│   │   ├── guests.ts         # /api/guests/*
│   │   ├── tables.ts         # /api/tables/*
│   │   ├── seating.ts        # /api/seating/*
│   │   ├── checkins.ts       # /api/checkins/*
│   │   └── google.ts         # Google OAuth
│   ├── pages/                 # Server-rendered HTML pages
│   ├── middleware/            # Auth, rate limiting
│   └── db/                    # D1 schema
├── public/static/             # Static assets
│   ├── event-management.js   # Client-side logic
│   └── styles.css
├── migrations/                # D1 migrations
├── .wrangler/                 # Local D1 database (auto-generated)
├── wrangler.jsonc             # Cloudflare config
├── ecosystem.config.cjs       # PM2 config
└── package.json
```

## 🚀 Development Workflow

### Local Development
```bash
# Clean port
fuser -k 3000/tcp 2>/dev/null || true

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Check status
pm2 list

# Check logs
pm2 logs webapp-cio --nostream

# Restart
pm2 restart webapp-cio
```

### Deployment
```bash
# Build + Deploy
npm run build
npm run deploy

# Or deploy to production
npm run deploy:prod
```

## 🎨 UI/UX Features

### עיצוב ומבנה
- **RTL Support**: תמיכה מלאה בעברית מימין לשמאל
- **Mobile Responsive**: 100% responsive (תוקן 27/12/2024)
- **Tailwind Classes**: שימוש ב-utility classes
- **Icons**: FontAwesome 6.4.0

### טאבים בדשבורד
1. **סקירה** - Analytics + גרפים
2. **אישורי הגעה** - ניהול RSVPs
3. **מוזמנים** - ניהול guest list
4. **הושבה** - Drag & Drop seating
5. **צ'ק-אין** - רישום הגעה
6. **Walk-ins** - אורחים ללא הזמנה
7. **הודעות** - תבניות הודעות
8. **הגדרות** - הגדרות אירוע

## 🐛 תיקונים עיקריים שבוצעו

### Authentication & Sessions
- ✅ Cookie-based auth (`mozmanim_token`)
- ✅ Auto-redirect לדשבורד למשתמשים מחוברים
- ✅ `withCredentials: true` ב-axios requests

### PDF Export
- ✅ Multi-page PDF support (30 rows per page)
- ✅ תיקון `groupLabel` mapping בעברית
- ✅ תיקון `side` mapping (חתן/כלה/משותף)

### UI/UX
- ✅ הסרת כותרות מיותרות בטאבים
- ✅ שמות כפתורים ברורים יותר
- ✅ תיקון גודל כפתור "אוטומציה" (responsive)
- ✅ Mobile responsive optimization

### Seating Algorithm
- ✅ Smart auto-fill with `attendingCount`
- ✅ Table-group matching
- ✅ Bulk seating API

## 📝 נקודות חשובות להמשך

### כשפותחים שיחה חדשה, ספק:
1. **Link לריפוזיטורי**: https://github.com/maor412/muzmanim-beclick
2. **המסמך הזה**: `PROJECT_CONTEXT.md`
3. **הבעיה/תכונה** שרוצים לעבוד עליה

### מידע שלא צריך (כבר מוגדר):
- ❌ Cloudflare secrets (כבר מוגדרים בפרודקשן)
- ❌ D1 Database (כבר קיים)
- ❌ Google OAuth (כבר מוגדר)
- ❌ Resend API (כבר מוגדר)

### מידע שכדאי לשמור:
- ✅ Cloudflare API Token (אם רוצה לעשות deploy)
- ✅ GitHub Personal Access Token (אם רוצה push/pull)

## 🔧 Common Commands

```bash
# Development
npm run dev:sandbox          # Local dev with wrangler
npm run db:migrate:local     # Run DB migrations locally
npm run db:seed              # Load test data

# Build & Deploy
npm run build                # Build project
npm run deploy               # Deploy to Cloudflare

# Database
npm run db:reset             # Reset local DB
npm run db:console:local     # DB console (local)
npm run db:console:prod      # DB console (production)

# Git
git status                   # Check status
git add -A                   # Stage all
git commit -m "message"      # Commit
git push origin main         # Push to GitHub

# PM2
pm2 list                     # List services
pm2 logs webapp-cio          # Show logs
pm2 restart webapp-cio       # Restart service
pm2 delete webapp-cio        # Delete from PM2
```

## 🎯 Latest Deploy Info
- **Latest URL**: https://9404ebe2.webapp-cio.pages.dev
- **Deploy Date**: 27/12/2024
- **Last Commit**: `077cfc1` - Update README: latest deploy URL

## 📞 Support & Resources
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Hono Docs**: https://hono.dev/
- **D1 Docs**: https://developers.cloudflare.com/d1/
- **Resend Docs**: https://resend.com/docs

---

**הערה**: מסמך זה מעודכן ל-27/12/2024. אם יש שינויים משמעותיים בפרויקט, עדכן מסמך זה!
