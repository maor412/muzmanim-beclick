import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ===================================
// טבלת משתמשים (Users)
// ===================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  authProvider: text('auth_provider').notNull().default('clerk'),
  clerkId: text('clerk_id').unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// ===================================
// טבלת אירועים (Events)
// ===================================
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  ownerUserId: text('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  eventName: text('event_name').notNull(),
  coupleNames: text('couple_names').notNull(),
  dateTime: text('date_time').notNull(),
  venueName: text('venue_name'),
  venueAddress: text('venue_address'),
  wazeLink: text('waze_link'),
  notes: text('notes'),
  isRsvpOpen: integer('is_rsvp_open').default(1),
  lockDate: text('lock_date'),
  timezone: text('timezone').default('Asia/Jerusalem'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// ===================================
// טבלת הגדרות אירוע (Event Settings)
// ===================================
export const eventSettings = sqliteTable('event_settings', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().unique().references(() => events.id, { onDelete: 'cascade' }),
  requirePhone: integer('require_phone').default(0),
  showMealChoice: integer('show_meal_choice').default(1),
  showAllergies: integer('show_allergies').default(1),
  showNotes: integer('show_notes').default(1),
  allowUpdates: integer('allow_updates').default(1),
  consentMessage: text('consent_message'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// ===================================
// טבלת רשימת יעד (Target Guest List)
// ===================================
export const guests = sqliteTable('guests', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  side: text('side'),
  groupLabel: text('group_label'),
  notes: text('notes'),
  isTargetList: integer('is_target_list').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// ===================================
// טבלת RSVPs (תגובות מוזמנים)
// ===================================
export const rsvps = sqliteTable('rsvps', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  attendingCount: integer('attending_count').notNull().default(0),
  mealChoice: text('meal_choice'),
  allergies: text('allergies'),
  comment: text('comment'),
  seatingNote: text('seating_note'), // הערה על הסרה מהושבה
  consentUpdates: integer('consent_updates').default(0),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// ===================================
// טבלת שולחנות (Tables)
// ===================================
export const tables = sqliteTable('tables', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  tableName: text('table_name').notNull(),
  tableNumber: integer('table_number'),
  capacity: integer('capacity').notNull().default(10),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// ===================================
// טבלת הושבה (Seating Assignments)
// ===================================
export const seating = sqliteTable('seating', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  rsvpId: text('rsvp_id').references(() => rsvps.id, { onDelete: 'set null' }),
  guestId: text('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  tableId: text('table_id').notNull().references(() => tables.id, { onDelete: 'cascade' }),
  seatIndex: integer('seat_index'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// ===================================
// טבלת צ'ק-אין (Check-ins)
// ===================================
export const checkins = sqliteTable('checkins', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  rsvpId: text('rsvp_id').notNull().references(() => rsvps.id, { onDelete: 'cascade' }),
  checkedInAt: text('checked_in_at').default(sql`CURRENT_TIMESTAMP`),
  checkedInByUserId: text('checked_in_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes')
});

// ===================================
// טבלת לוגים (Audit Logs)
// ===================================
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventId: text('event_id').references(() => events.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  metadataJson: text('metadata_json'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type EventSettings = typeof eventSettings.$inferSelect;
export type InsertEventSettings = typeof eventSettings.$inferInsert;

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;

export type Rsvp = typeof rsvps.$inferSelect;
export type InsertRsvp = typeof rsvps.$inferInsert;

export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;

export type Seating = typeof seating.$inferSelect;
export type InsertSeating = typeof seating.$inferInsert;

export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = typeof checkins.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
