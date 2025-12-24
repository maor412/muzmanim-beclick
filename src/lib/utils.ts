/**
 * יצירת ID ייחודי קצר באמצעות Web Crypto API
 * תואם ל-Cloudflare Workers, בטוח לשימוש ב-URLs
 */
export function generateId(): string {
  // יצירת 10 bytes אקראיים (20 תווים hex)
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  
  // המרה ל-hex (בטוח לחלוטין ב-URLs - רק 0-9, a-f)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * יצירת slug ייחודי לאירוע
 */
export function generateSlug(eventName: string): string {
  const base = eventName
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  
  // יצירת 6 תווים אקראיים (hex)
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${base}-${random}`;
}

/**
 * ולידציה של מספר טלפון ישראלי
 */
export function validateIsraeliPhone(phone: string): boolean {
  // הסרת רווחים ומקפים
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // בדיקה: 05X-XXXXXXX או 972-5X-XXXXXXX
  const israeliRegex = /^(05[0-9]|972-?5[0-9])[0-9]{7}$/;
  return israeliRegex.test(cleaned);
}

/**
 * פורמט של מספר טלפון לפורמט E.164
 */
export function formatPhoneE164(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // אם מתחיל ב-05, החלף ל-+9725
  if (cleaned.startsWith('05')) {
    return `+972${cleaned.substring(1)}`;
  }
  
  // אם מתחיל ב-9725, הוסף +
  if (cleaned.startsWith('9725')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * המרת תאריך לפורמט ISO
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

/**
 * קבלת תאריך בפורמט עברי
 */
export function formatDateHebrew(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jerusalem'
  }).format(date);
}

/**
 * sanitize HTML למניעת XSS
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * בדיקה האם המשתמש הוא הבעלים של האירוע
 */
export function isEventOwner(userId: string, eventOwnerId: string): boolean {
  return userId === eventOwnerId;
}

/**
 * שגיאה מותאמת אישית
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Rate limiting - בדיקה פשוטה לפי IP
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * ניקוי rate limit map (להרצה מדי פעם)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}
