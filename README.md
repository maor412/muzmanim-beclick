# 🎉 מוזמנים בקליק - Wedding Guest OS

מערכת מקצועית מלאה לניהול מוזמנים לחתונה בעברית עם תמיכה מלאה ב-RTL.

## ✨ תכונות עיקריות

### 📱 **RSVP ציבורי**
- לינק ייחודי לכל אירוע (`/e/:slug`)
- טופס אישור הגעה בעברית מלאה
- שדות מותאמים אישית: מספר מגיעים, בחירת מנה, אלרגיות, הערות
- מנגנון מניעת כפילויות
- אפשרות לקבלת הסכמה לעדכונים

### 👥 **ניהול מוזמנים**
- רשימת יעד: ייבוא ידני או CSV
- עריכה ומחיקה של מוזמנים
- זיהוי כפילויות לפי טלפון
- חיפוש וסינון מתקדם
- דוח מי ענה ומי לא

### 🪑 **סידורי הושבה**
- יצירת שולחנות עם קיבולת
- הקצאה ידנית של מוזמנים לשולחנות
- תצוגה ויזואלית של תפוסה
- ייצוא רשימת הושבה

### ✅ **צ'ק-אין ביום האירוע**
- מסך מותאם מובייל
- חיפוש מהיר של מוזמנים
- רישום הגעה בלחיצה
- סטטיסטיקות בזמן אמת

### 📊 **דשבורד מרכזי**
- סקירה כללית: כמות תגובות, סך מגיעים
- דוחות מנות מיוחדות ואלרגיות
- ייצוא לExcel/CSV
- מעקב אחר כל הפעולות (Audit Logs)

### 🔒 **אבטחה מלאה**
- אימות Clerk: Google, Email, Apple, Facebook
- Rate limiting למניעת spam
- Validation מלא עם Zod
- Audit logs לכל פעולה חשובה
- הרשאות מבוססות בעלות

## 🏗️ טכנולוגיות

### Backend
- **Hono** - Web framework קליל ומהיר
- **Cloudflare D1** - SQLite מבוזר גלובלי
- **Drizzle ORM** - Type-safe ORM
- **Zod** - Schema validation
- **@hono/clerk-auth** - Authentication

### Frontend
- **TailwindCSS** - CSS framework
- **FontAwesome** - Icons
- **Axios** - HTTP client
- **Vanilla JS** - ללא framework (ניתן להוסיף React/Vue)

### Infrastructure
- **Cloudflare Pages** - Hosting + Edge Functions
- **Cloudflare Workers** - Serverless runtime
- **Wrangler** - CLI tool לפריסה

## 📦 התקנה והרצה מקומית

### דרישות מוקדמות
- Node.js 18+
- npm או pnpm
- חשבון Cloudflare (חינמי)
- חשבון Clerk (חינמי)

### 1. Clone והתקנה

```bash
git clone <repository-url>
cd webapp
npm install
```

### 2. הגדרת Clerk Authentication

1. צור חשבון ב-[Clerk Dashboard](https://dashboard.clerk.com)
2. צור Application חדש
3. הפעל את Authentication Providers:
   - ✅ Email
   - ✅ Google
   - ✅ Apple (אופציונלי)
   - ✅ Facebook (אופציונלי)
4. העתק את המפתחות ל-`.dev.vars`:

```env
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### 3. הגדרת Database

```bash
# הרצת migrations
npm run db:migrate:local

# טעינת seed data לדוגמה
npm run db:seed
```

### 4. הרצה מקומית

```bash
# Build
npm run build

# Start development server
npm run dev:sandbox

# או עם PM2 (מומלץ לסביבת sandbox)
fuser -k 3000/tcp 2>/dev/null || true
npm run build
pm2 start ecosystem.config.cjs
```

הגש ל: http://localhost:3000

### 5. בדיקת API

```bash
# Health check
curl http://localhost:3000/api/health

# Public RSVP page (slug לדוגמה)
http://localhost:3000/e/wedding-demo-abc123
```

## 🚀 פריסה לפרודקשן (Cloudflare Pages)

### 1. התקן Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. צור D1 Database בפרודקשן

```bash
# צור database
npx wrangler d1 create mozmanim-production

# העתק את database_id ל-wrangler.jsonc
```

עדכן `wrangler.jsonc`:
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "mozmanim-production",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ]
}
```

### 3. הרץ Migrations בפרודקשן

```bash
npm run db:migrate:prod
```

### 4. הגדר Secrets

```bash
# הגדר Clerk keys
npx wrangler pages secret put CLERK_PUBLISHABLE_KEY --project-name mozmanim-beclick
npx wrangler pages secret put CLERK_SECRET_KEY --project-name mozmanim-beclick
```

### 5. Deploy

```bash
# Build + Deploy
npm run deploy

# או יד manually
npm run build
npx wrangler pages deploy dist --project-name mozmanim-beclick
```

התוצאה:
- **Production URL**: `https://mozmanim-beclick.pages.dev`
- **API Endpoints**: `https://mozmanim-beclick.pages.dev/api/*`

## 📁 מבנה הפרויקט

```
webapp/
├── migrations/                 # D1 Database migrations
│   └── 0001_initial_schema.sql
├── src/
│   ├── db/                    # Database schema + ORM
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── lib/                   # Utilities + validators
│   │   ├── utils.ts
│   │   └── validators.ts
│   ├── middleware/            # Authentication + Rate limiting
│   │   ├── auth.ts
│   │   ├── audit.ts
│   │   └── rateLimit.ts
│   ├── routes/                # API endpoints
│   │   ├── events.ts          # ניהול אירועים
│   │   ├── rsvps.ts           # RSVP endpoints
│   │   ├── guests.ts          # רשימת יעד
│   │   ├── tables.ts          # שולחנות
│   │   ├── seating.ts         # הושבה
│   │   └── checkins.ts        # צ'ק-אין
│   └── index.tsx              # Main app entry
├── public/
│   └── static/                # Static assets
├── seed.sql                   # Seed data
├── ecosystem.config.cjs       # PM2 config
├── wrangler.jsonc             # Cloudflare config
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Users
משתמשים רשומים (בעלי אירועים)

### Events
אירועים (חתונות)

### Event Settings
הגדרות מותאמות לכל אירוע

### RSVPs
תגובות מוזמנים דרך הלינק הציבורי

### Guests
רשימת יעד - מוזמנים שהוזנו על ידי בעל האירוע

### Tables
שולחנות באירוע

### Seating
סידורי הושבה

### Checkins
צ'ק-אינים ביום האירוע

### Audit Logs
לוגים של כל הפעולות החשובות

## 🔌 API Endpoints

### Public (ללא אימות)
- `POST /api/rsvp/:slug` - יצירת RSVP

### Protected (דורש אימות)
- `GET /api/events` - רשימת אירועים
- `POST /api/events` - יצירת אירוע
- `GET /api/events/:id` - פרטי אירוע
- `PUT /api/events/:id` - עדכון אירוע
- `DELETE /api/events/:id` - מחיקת אירוע

- `GET /api/events/:eventId/rsvps` - רשימת RSVPs
- `PUT /api/rsvps/:id` - עדכון RSVP
- `DELETE /api/rsvps/:id` - מחיקת RSVP

- `GET /api/events/:eventId/guests` - רשימת יעד
- `POST /api/events/:eventId/guests` - הוספת אורח
- `POST /api/events/:eventId/guests/bulk` - ייבוא המוני
- `DELETE /api/guests/:id` - מחיקת אורח

- `GET /api/events/:eventId/tables` - רשימת שולחנות
- `POST /api/events/:eventId/tables` - יצירת שולחן
- `PUT /api/tables/:id` - עדכון שולחן
- `DELETE /api/tables/:id` - מחיקת שולחן

- `GET /api/events/:eventId/seating` - סידורי הושבה
- `POST /api/events/:eventId/seating` - הוספת הושבה
- `DELETE /api/seating/:id` - מחיקת הושבה

- `GET /api/events/:eventId/checkins` - רשימת צ'ק-אינים
- `POST /api/events/:eventId/checkins` - ביצוע צ'ק-אין
- `DELETE /api/checkins/:id` - ביטול צ'ק-אין

## 🛡️ אבטחה

### Rate Limiting
- RSVP: 5 בקשות לדקה
- API: 30 בקשות לדקה
- Auth: 10 בקשות לדקה

### Validation
- כל ה-inputs מאומתים עם Zod
- מספרי טלפון ישראליים בלבד
- פורמט E.164 לשמירה

### Audit Logs
כל פעולה חשובה נרשמת:
- יצירת/עדכון/מחיקת אירועים
- הוספת/עדכון RSVPs
- שינויים בהושבה
- צ'ק-אינים

## 📝 פיתוח עתידי (Roadmap)

- [ ] ממשק Admin מלא (React/Vue)
- [ ] Wizard מלא ליצירת אירוע
- [ ] Drag & Drop להושבה
- [ ] ייצוא PDF לרשימות
- [ ] WhatsApp Business API integration
- [ ] תזכורות אוטומטיות
- [ ] Multi-language support
- [ ] Analytics מתקדם

## 🤝 תמיכה

לשאלות, בעיות או הצעות:
- Email: support@mozmanim-beclick.com
- GitHub Issues: [קישור]

## 📄 רישיון

MIT License - ראה קובץ LICENSE

---

**Built with ❤️ using Cloudflare Pages + Hono + D1**
