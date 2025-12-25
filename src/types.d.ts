// Cloudflare Workers environment bindings
declare global {
  interface CloudflareBindings {
    DB: D1Database;
    RESEND_API_KEY: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    JWT_SECRET: string;
    APP_URL: string;
    CLERK_PUBLISHABLE_KEY?: string;
    CLERK_SECRET_KEY?: string;
  }
}

export {};
