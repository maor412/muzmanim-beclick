-- מוזמנים בקליק - Wedding Guest OS Database Schema
-- Cloudflare D1 (SQLite) Database

-- ===================================
-- טבלת משתמשים (Users)
-- ===================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  auth_provider TEXT NOT NULL DEFAULT 'clerk',
  clerk_id TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);

-- ===================================
-- טבלת אירועים (Events)
-- ===================================
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  event_name TEXT NOT NULL,
  couple_names TEXT NOT NULL,
  date_time DATETIME NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  waze_link TEXT,
  notes TEXT,
  is_rsvp_open INTEGER DEFAULT 1,
  lock_date DATETIME,
  timezone TEXT DEFAULT 'Asia/Jerusalem',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_owner ON events(owner_user_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_date ON events(date_time);

-- ===================================
-- טבלת הגדרות אירוע (Event Settings)
-- ===================================
CREATE TABLE IF NOT EXISTS event_settings (
  id TEXT PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  require_phone INTEGER DEFAULT 0,
  show_meal_choice INTEGER DEFAULT 1,
  show_allergies INTEGER DEFAULT 1,
  show_notes INTEGER DEFAULT 1,
  allow_updates INTEGER DEFAULT 1,
  consent_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_event_settings_event ON event_settings(event_id);

-- ===================================
-- טבלת רשימת יעד (Target Guest List)
-- ===================================
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  side TEXT,
  group_label TEXT,
  notes TEXT,
  is_target_list INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_guests_event ON guests(event_id);
CREATE INDEX idx_guests_phone ON guests(phone);
CREATE INDEX idx_guests_name ON guests(full_name);

-- ===================================
-- טבלת RSVPs (תגובות מוזמנים)
-- ===================================
CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  attending_count INTEGER NOT NULL DEFAULT 0,
  meal_choice TEXT,
  allergies TEXT,
  comment TEXT,
  consent_updates INTEGER DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_phone ON rsvps(phone);
CREATE INDEX idx_rsvps_name ON rsvps(full_name);
CREATE INDEX idx_rsvps_created ON rsvps(created_at);

-- ===================================
-- טבלת שולחנות (Tables)
-- ===================================
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  table_number INTEGER,
  capacity INTEGER NOT NULL DEFAULT 10,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_tables_event ON tables(event_id);
CREATE INDEX idx_tables_number ON tables(table_number);

-- ===================================
-- טבלת הושבה (Seating Assignments)
-- ===================================
CREATE TABLE IF NOT EXISTS seating (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  rsvp_id TEXT,
  guest_id TEXT,
  table_id TEXT NOT NULL,
  seat_index INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (rsvp_id) REFERENCES rsvps(id) ON DELETE SET NULL,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

CREATE INDEX idx_seating_event ON seating(event_id);
CREATE INDEX idx_seating_rsvp ON seating(rsvp_id);
CREATE INDEX idx_seating_guest ON seating(guest_id);
CREATE INDEX idx_seating_table ON seating(table_id);

-- ===================================
-- טבלת צ'ק-אין (Check-ins)
-- ===================================
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  rsvp_id TEXT NOT NULL,
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  checked_in_by_user_id TEXT,
  notes TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (rsvp_id) REFERENCES rsvps(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_checkins_event ON checkins(event_id);
CREATE INDEX idx_checkins_rsvp ON checkins(rsvp_id);
CREATE INDEX idx_checkins_time ON checkins(checked_in_at);

-- ===================================
-- טבלת לוגים (Audit Logs)
-- ===================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event ON audit_logs(event_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
