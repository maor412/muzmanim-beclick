export function renderPage(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | מוזמנים בקליק</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <nav class="bg-white shadow-lg">
            <div class="container mx-auto px-4 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-reverse space-x-2">
                        <i class="fas fa-heart text-pink-500 text-3xl"></i>
                        <a href="/" class="text-2xl font-bold text-gray-800 hover:text-pink-500">מוזמנים בקליק</a>
                    </div>
                    <div class="space-x-reverse space-x-4">
                        <a href="/" class="text-gray-600 hover:text-pink-500">בית</a>
                        <a href="/about" class="text-gray-600 hover:text-pink-500">אודות</a>
                        <a href="/faq" class="text-gray-600 hover:text-pink-500">שאלות נפוצות</a>
                        <a href="/contact" class="text-gray-600 hover:text-pink-500">צור קשר</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Content -->
        <div class="container mx-auto px-4 py-12">
            <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                ${content}
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
  `;
}

export const aboutPage = renderPage('אודות', `
  <h1 class="text-4xl font-bold text-gray-800 mb-6">אודות מוזמנים בקליק</h1>
  
  <div class="prose max-w-none">
    <h2 class="text-2xl font-semibold text-gray-700 mb-4">מי אנחנו?</h2>
    <p class="text-gray-600 mb-6">
      מוזמנים בקליק היא מערכת מתקדמת לניהול מוזמנים לחתונה, שפותחה במיוחד עבור זוגות ישראליים.
      המערכת מספקת פתרון מקיף החל מאיסוף אישורי הגעה, דרך ניהול רשימות ועד לצ'ק-אין ביום האירוע.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700 mb-4">למה דווקא אנחנו?</h2>
    <ul class="list-disc list-inside space-y-2 text-gray-600 mb-6">
      <li><strong>עברית מלאה + RTL</strong> - כל המערכת מותאמת לשפה העברית</li>
      <li><strong>פשוט ונוח</strong> - ממשק אינטואיטיבי שקל לשימוש</li>
      <li><strong>מאובטח</strong> - אימות מתקדם והגנה על המידע שלכם</li>
      <li><strong>בחינם</strong> - השירות הבסיסי זמין בחינם</li>
      <li><strong>ללא התקנה</strong> - הכל בענן, נגיש מכל מקום</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700 mb-4">הטכנולוגיה שלנו</h2>
    <p class="text-gray-600 mb-6">
      אנחנו משתמשים בטכנולוגיות המתקדמות ביותר כדי להבטיח שירות מהיר, יציב ומאובטח:
      Cloudflare Pages, Hono Framework, D1 Database, Clerk Authentication.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700 mb-4">צור קשר</h2>
    <p class="text-gray-600">
      יש לכם שאלות או רעיונות? נשמח לשמוע מכם!<br />
      <a href="/contact" class="text-pink-500 hover:text-pink-600">צרו איתנו קשר</a>
    </p>
  </div>
`);

export const faqPage = renderPage('שאלות נפוצות', `
  <h1 class="text-4xl font-bold text-gray-800 mb-8">שאלות נפוצות</h1>
  
  <div class="space-y-6">
    <div class="border-b pb-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-3">איך מתחילים?</h3>
      <p class="text-gray-600">
        פשוט הירשמו למערכת, צרו אירוע חדש, והמערכת תיצור לכם לינק ייחודי לשיתוף עם המוזמנים.
        המוזמנים יוכלו לאשר הגעה דרך הלינק, ואתם תקבלו את כל המידע במקום אחד.
      </p>
    </div>

    <div class="border-b pb-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-3">האם השירות בחינם?</h3>
      <p class="text-gray-600">
        כן! השירות הבסיסי לחלוטין בחינם ללא הגבלת זמן. תוכלו לנהל אירוע אחד עם עד 200 מוזמנים.
        עבור אירועים גדולים יותר או תכונות מתקדמות, יהיו תוכניות בתשלום בעתיד.
      </p>
    </div>

    <div class="border-b pb-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-3">האם המוזמנים צריכים להירשם?</h3>
      <p class="text-gray-600">
        לא! המוזמנים רק צריכים לפתוח את הלינק, למלא את הפרטים ולשלוח. אין צורך בהרשמה או התחברות.
      </p>
    </div>

    <div class="border-b pb-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-3">איך מייבאים רשימת מוזמנים?</h3>
      <p class="text-gray-600">
        במערכת יש אפשרות להוסיף מוזמנים ידנית אחד אחד, או לייבא רשימה שלמה מקובץ Excel/CSV.
        ניתן גם להדביק (paste) רשימה ישירות לתוך הטבלה.
      </p>
    </div>

    <div class="border-b pb-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-3">מה עם פרטיות ואבטחה?</h3>
      <p class="text-gray-600">
        אנחנו מאוד רציניים לגבי האבטחה. כל המידע מוצפן, יש אימות משתמשים מתקדם דרך Clerk,
        והנתונים שלכם שמורים בענן מאובטח של Cloudflare. רק אתם יכולים לגשת לנתוני האירוע שלכם.
      </p>
    </div>

    <div class="border-b pb-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-3">האם יש אפליקציה למובייל?</h3>
      <p class="text-gray-600">
        כרגע האתר מותאם מלא למובייל, אז אפשר להשתמש בו בנוחות מהטלפון.
        בעתיד נשקול לפתח אפליקציה ייעודית אם יהיה ביקוש.
      </p>
    </div>

    <div>
      <h3 class="text-xl font-semibold text-gray-800 mb-3">מה אם יש לי עוד שאלות?</h3>
      <p class="text-gray-600">
        נשמח לעזור! <a href="/contact" class="text-pink-500 hover:text-pink-600">צרו איתנו קשר</a>
        ונחזור אליכם בהקדם.
      </p>
    </div>
  </div>
`);

export const contactPage = renderPage('צור קשר', `
  <h1 class="text-4xl font-bold text-gray-800 mb-8">צור קשר</h1>
  
  <div class="grid md:grid-cols-2 gap-8">
    <div>
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">שלחו לנו הודעה</h2>
      <form class="space-y-4">
        <div>
          <label class="block text-gray-700 mb-2">שם מלא *</label>
          <input type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500" required>
        </div>
        <div>
          <label class="block text-gray-700 mb-2">אימייל *</label>
          <input type="email" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500" required>
        </div>
        <div>
          <label class="block text-gray-700 mb-2">טלפון</label>
          <input type="tel" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500">
        </div>
        <div>
          <label class="block text-gray-700 mb-2">הודעה *</label>
          <textarea rows="5" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500" required></textarea>
        </div>
        <button type="submit" class="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition">
          <i class="fas fa-paper-plane ml-2"></i>
          שלח הודעה
        </button>
      </form>
    </div>
    
    <div>
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">פרטי יצירת קשר</h2>
      <div class="space-y-4">
        <div class="flex items-start space-x-reverse space-x-3">
          <i class="fas fa-envelope text-pink-500 text-xl mt-1"></i>
          <div>
            <h3 class="font-semibold text-gray-800">אימייל</h3>
            <p class="text-gray-600">support@mozmanim-beclick.com</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-reverse space-x-3">
          <i class="fas fa-phone text-pink-500 text-xl mt-1"></i>
          <div>
            <h3 class="font-semibold text-gray-800">טלפון</h3>
            <p class="text-gray-600">050-1234567</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-reverse space-x-3">
          <i class="fas fa-clock text-pink-500 text-xl mt-1"></i>
          <div>
            <h3 class="font-semibold text-gray-800">שעות פעילות</h3>
            <p class="text-gray-600">ראשון - חמישי: 9:00 - 18:00</p>
          </div>
        </div>
      </div>
      
      <div class="mt-8 p-6 bg-pink-50 rounded-lg">
        <h3 class="font-semibold text-gray-800 mb-2">תמיכה טכנית</h3>
        <p class="text-gray-600 text-sm">
          זקוקים לעזרה דחופה? אנחנו כאן בשבילכם!<br />
          נחזור אליכם תוך 24 שעות בימי עבודה.
        </p>
      </div>
    </div>
  </div>
`);

export const termsPage = renderPage('תקנון שימוש', `
  <h1 class="text-4xl font-bold text-gray-800 mb-8">תקנון שימוש</h1>
  
  <div class="prose max-w-none space-y-6 text-gray-600">
    <p class="text-sm text-gray-500">עדכון אחרון: דצמבר 2024</p>

    <h2 class="text-2xl font-semibold text-gray-700">1. תנאים כלליים</h2>
    <p>
      השימוש באתר "מוזמנים בקליק" (להלן: "השירות") כפוף לתקנון זה.
      על ידי שימוש בשירות, הנך מאשר/ת שקראת והבנת את התקנון ואת מדיניות הפרטיות שלנו.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">2. רישום וחשבון משתמש</h2>
    <ul class="list-disc list-inside space-y-2">
      <li>עליך להיות בן/בת 18 לפחות כדי להשתמש בשירות</li>
      <li>עליך לספק מידע מדויק ועדכני בעת ההרשמה</li>
      <li>אתה אחראי לשמירה על סודיות פרטי ההתחברות שלך</li>
      <li>אתה אחראי לכל הפעילות המתרחשת תחת החשבון שלך</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700">3. שימוש מותר</h2>
    <p>השירות מיועד לשימוש אישי למטרות ניהול אירועים בלבד. אסור:</p>
    <ul class="list-disc list-inside space-y-2">
      <li>להעתיק, לשנות או להפיץ את תוכן השירות ללא אישור</li>
      <li>להשתמש בשירות למטרות בלתי חוקיות או לא מוסריות</li>
      <li>לנסות לפגוע באבטחת השירות או לגשת למידע של משתמשים אחרים</li>
      <li>לשלוח spam או תוכן פוגעני דרך השירות</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700">4. קניין רוחני</h2>
    <p>
      כל הזכויות בשירות, לרבות עיצוב, קוד, תוכן וסימנים מסחריים, שייכות לנו או למעניקי הרישיון שלנו.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">5. אחריות והגבלות אחריות</h2>
    <p>
      השירות מסופק "כמות שהוא" ללא אחריות מכל סוג. אנחנו לא אחראים לנזקים העלולים להיגרם משימוש בשירות.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">6. שינויים בתקנון</h2>
    <p>
      אנו שומרים לעצמנו את הזכות לשנות את התקנון בכל עת. שינויים משמעותיים יפורסמו באתר.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">7. סיום השימוש</h2>
    <p>
      אנו רשאים להפסיק או להגביל את הגישה שלך לשירות בכל עת, ללא הודעה מוקדמת,
      אם נחשוד בהפרת התקנון או שימוש לא הולם.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">8. דין וסמכות שיפוט</h2>
    <p>
      תקנון זה כפוף לדיני מדינת ישראל. כל מחלוקת תתברר בבתי המשפט המוסמכים בישראל.
    </p>

    <p class="mt-8">
      לשאלות או בירורים לגבי תקנון זה, אנא <a href="/contact" class="text-pink-500 hover:text-pink-600">צרו קשר</a>.
    </p>
  </div>
`);

export const privacyPage = renderPage('מדיניות פרטיות', `
  <h1 class="text-4xl font-bold text-gray-800 mb-8">מדיניות פרטיות</h1>
  
  <div class="prose max-w-none space-y-6 text-gray-600">
    <p class="text-sm text-gray-500">עדכון אחרון: דצמבר 2024</p>

    <h2 class="text-2xl font-semibold text-gray-700">1. מבוא</h2>
    <p>
      ב"מוזמנים בקליק" אנו מחויבים להגן על הפרטיות שלך. מדיניות זו מסבירה אילו מידע אנו אוספים,
      כיצד אנו משתמשים בו, ואילו זכויות יש לך.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">2. מידע שאנו אוספים</h2>
    <h3 class="text-xl font-semibold text-gray-700">2.1 מידע שאתה מספק</h3>
    <ul class="list-disc list-inside space-y-2">
      <li>פרטי רישום: שם, אימייל</li>
      <li>פרטי אירוע: שם האירוע, תאריך, מקום</li>
      <li>פרטי מוזמנים: שמות, טלפונים (אופציונלי), העדפות</li>
    </ul>

    <h3 class="text-xl font-semibold text-gray-700 mt-4">2.2 מידע שנאסף אוטומטית</h3>
    <ul class="list-disc list-inside space-y-2">
      <li>כתובת IP</li>
      <li>סוג דפדפן ומכשיר</li>
      <li>זמני גישה לשירות</li>
      <li>Cookies טכניים (לאימות)</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700">3. שימוש במידע</h2>
    <p>אנו משתמשים במידע כדי:</p>
    <ul class="list-disc list-inside space-y-2">
      <li>לספק ולשפר את השירות</li>
      <li>לאמת זהות משתמשים</li>
      <li>לשלוח עדכונים על השירות (רק אם הסכמת)</li>
      <li>למנוע שימוש לרעה בשירות</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700">4. שיתוף מידע</h2>
    <p>
      אנו <strong>לא משתפים</strong> את המידע האישי שלך עם צדדים שלישיים למטרות שיווק.
      אנו עשויים לשתף מידע עם:
    </p>
    <ul class="list-disc list-inside space-y-2">
      <li>ספקי שירות (Cloudflare, Clerk) - לצורכי הפעלת השירות בלבד</li>
      <li>רשויות אכיפת החוק - אם נדרש על פי חוק</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700">5. אבטחת מידע</h2>
    <p>
      אנו נוקטים באמצעי אבטחה סבירים כדי להגן על המידע שלך:
    </p>
    <ul class="list-disc list-inside space-y-2">
      <li>הצפנת נתונים (HTTPS)</li>
      <li>אימות דו-שלבי</li>
      <li>גיבויים קבועים</li>
      <li>הגבלת גישה למידע</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700">6. הזכויות שלך</h2>
    <p>יש לך זכות:</p>
    <ul class="list-disc list-inside space-y-2">
      <li>לקבל עותק של המידע שלך</li>
      <li>לתקן מידע שגוי</li>
      <li>למחוק את החשבון שלך</li>
      <li>להתנגד לשימוש במידע למטרות שיווק</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700">7. Cookies</h2>
    <p>
      אנו משתמשים ב-Cookies טכניים הכרחיים לפעולת השירות (אימות משתמשים).
      אינך יכול לסרב ל-Cookies אלה מבלי להשפיע על פעולת השירות.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">8. ילדים</h2>
    <p>
      השירות אינו מיועד לילדים מתחת לגיל 18. אנו לא אוספים במודע מידע מילדים.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">9. שינויים במדיניות</h2>
    <p>
      אנו עשויים לעדכן מדיניות זו מעת לעת. נודיע על שינויים משמעותיים באתר.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">10. צור קשר</h2>
    <p>
      לשאלות לגבי מדיניות הפרטיות, ניתן ליצור קשר:
      <a href="/contact" class="text-pink-500 hover:text-pink-600">דף צור קשר</a>
      או לכתוב ל: privacy@mozmanim-beclick.com
    </p>
  </div>
`);

export const accessibilityPage = renderPage('הצהרת נגישות', `
  <h1 class="text-4xl font-bold text-gray-800 mb-8">הצהרת נגישות</h1>
  
  <div class="prose max-w-none space-y-6 text-gray-600">
    <p>
      אנו ב"מוזמנים בקליק" מחויבים להנגיש את השירות לכלל המשתמשים, לרבות אנשים עם מוגבלויות,
      בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998 ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">תכונות נגישות באתר</h2>
    <ul class="list-disc list-inside space-y-2">
      <li>ניווט מקלדת מלא</li>
      <li>תמיכה בקוראי מסך</li>
      <li>ניגודיות צבעים מתאימה</li>
      <li>טקסט ניתן להגדלה</li>
      <li>תוכן מובנה היררכית</li>
      <li>טפסים נגישים עם תוויות ברורות</li>
    </ul>

    <h2 class="text-2xl font-semibold text-gray-700">רמת הנגישות</h2>
    <p>
      האתר שואף לעמוד ברמת AA של תקן WCAG 2.1. אנו עובדים באופן מתמשך לשיפור הנגישות.
    </p>

    <h2 class="text-2xl font-semibold text-gray-700">בעיות נגישות?</h2>
    <p>
      אם נתקלתם בבעיית נגישות באתר, אנא <a href="/contact" class="text-pink-500 hover:text-pink-600">צרו קשר</a>
      ואנו נפעל לטפל בבעיה בהקדם האפשרי.
    </p>

    <p class="text-sm text-gray-500 mt-8">
      הצהרה זו עודכנה בתאריך: דצמבר 2024
    </p>
  </div>
`);
