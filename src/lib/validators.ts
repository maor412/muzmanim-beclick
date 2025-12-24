import { z } from 'zod';

// ===================================
// Event Validators
// ===================================
export const createEventSchema = z.object({
  eventName: z.string().min(2, 'שם האירוע חייב להכיל לפחות 2 תווים').max(100),
  coupleNames: z.string().min(2, 'שמות בני הזוג נדרשים').max(100),
  dateTime: z.string().datetime('תאריך לא תקין'),
  venueName: z.string().max(200).optional().or(z.literal('')),
  venueAddress: z.string().max(500).optional().or(z.literal('')),
  wazeLink: z.string().url('קישור Waze לא תקין').optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  isRsvpOpen: z.boolean().default(true),
  // הגדרות RSVP
  requirePhone: z.boolean().default(false),
  showMealChoice: z.boolean().default(true),
  showAllergies: z.boolean().default(true),
  showNotes: z.boolean().default(true),
  allowUpdates: z.boolean().default(true),
  consentMessage: z.string().max(500).optional().or(z.literal(''))
});

export const updateEventSchema = createEventSchema.partial();

// ===================================
// RSVP Validators
// ===================================
export const createRsvpSchema = z.object({
  fullName: z.string().min(2, 'שם מלא נדרש').max(100),
  phone: z.string()
    .regex(/^(05[0-9]|972-?5[0-9])[0-9]{7}$/, 'מספר טלפון לא תקין (דוגמה: 050-1234567)')
    .optional()
    .or(z.literal('')),
  attendingCount: z.number().int().min(0, 'מספר מגיעים חייב להיות 0 או יותר').max(20),
  mealChoice: z.string().max(100).optional().or(z.literal('')),
  allergies: z.string().max(500).optional().or(z.literal('')),
  comment: z.string().max(1000).optional().or(z.literal('')),
  consentUpdates: z.boolean().default(false)
});

export const updateRsvpSchema = createRsvpSchema.partial();

// ===================================
// Guest Validators (רשימת יעד)
// ===================================
export const createGuestSchema = z.object({
  fullName: z.string().min(2, 'שם מלא נדרש').max(100),
  phone: z.string()
    .regex(/^(05[0-9]|972-?5[0-9])[0-9]{7}$/, 'מספר טלפון לא תקין')
    .optional()
    .or(z.literal('')),
  side: z.string().max(50).optional().or(z.literal('')),
  groupLabel: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal(''))
});

export const bulkGuestsSchema = z.array(createGuestSchema);

// ===================================
// Table Validators
// ===================================
export const createTableSchema = z.object({
  tableName: z.string().min(1, 'שם שולחן נדרש').max(100),
  tableNumber: z.number().int().min(1).max(500).optional(),
  capacity: z.number().int().min(1, 'קיבולת חייבת להיות לפחות 1').max(50).default(10),
  notes: z.string().max(500).optional().or(z.literal(''))
});

export const updateTableSchema = createTableSchema.partial();

// ===================================
// Seating Validators
// ===================================
export const createSeatingSchema = z.object({
  tableId: z.string().min(1, 'מזהה שולחן נדרש'),
  rsvpId: z.string().optional(),
  guestId: z.string().optional(),
  seatIndex: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional().or(z.literal(''))
}).refine(
  (data) => data.rsvpId || data.guestId,
  { message: 'נדרש rsvpId או guestId' }
);

// ===================================
// Checkin Validators
// ===================================
export const createCheckinSchema = z.object({
  rsvpId: z.string().min(1, 'מזהה RSVP נדרש'),
  notes: z.string().max(500).optional().or(z.literal(''))
});

// ===================================
// Search/Filter Validators
// ===================================
export const searchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50)
});

// Type exports
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateRsvpInput = z.infer<typeof createRsvpSchema>;
export type UpdateRsvpInput = z.infer<typeof updateRsvpSchema>;
export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type CreateSeatingInput = z.infer<typeof createSeatingSchema>;
export type CreateCheckinInput = z.infer<typeof createCheckinSchema>;
