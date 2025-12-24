-- Seed Data for מוזמנים בקליק (Wedding Guest OS)
-- להרצה: npm run db:seed

-- משתמש לדוגמה
INSERT OR IGNORE INTO users (id, email, name, auth_provider, clerk_id) VALUES 
('user_demo_1', 'demo@example.com', 'דמו משתמש', 'clerk', 'clerk_demo_123');

-- אירוע לדוגמה
INSERT OR IGNORE INTO events (
  id, owner_user_id, slug, event_name, couple_names, 
  date_time, venue_name, venue_address, waze_link, 
  notes, is_rsvp_open, timezone
) VALUES (
  'event_demo_1',
  'user_demo_1',
  'wedding-demo-abc123',
  'חתונת דני ורונית',
  'דני כהן ורונית לוי',
  '2024-08-15T19:00:00',
  'אולמי כלה יפה',
  'דרך השלום 123, תל אביב',
  'https://waze.com/ul?ll=32.0853,34.7818',
  'נשמח לראותכם!',
  1,
  'Asia/Jerusalem'
);

-- הגדרות אירוע
INSERT OR IGNORE INTO event_settings (
  id, event_id, require_phone, show_meal_choice, 
  show_allergies, show_notes, allow_updates, consent_message
) VALUES (
  'settings_demo_1',
  'event_demo_1',
  0,
  1,
  1,
  1,
  1,
  'אנחנו נשמח לשלוח לכם עדכונים על האירוע בוואטסאפ'
);

-- RSVPs לדוגמה (20 מוזמנים)
INSERT OR IGNORE INTO rsvps (id, event_id, full_name, phone, attending_count, meal_choice, allergies, comment, consent_updates) VALUES
('rsvp_1', 'event_demo_1', 'משה ישראלי', '+972501234567', 2, 'בשר', '', 'מחכים בקוצר רוח!', 1),
('rsvp_2', 'event_demo_1', 'שרה כהן', '+972502345678', 3, 'בשר', '', 'נגיע בשמחה', 1),
('rsvp_3', 'event_demo_1', 'דוד לוי', '+972503456789', 1, 'דג', 'אלרגיה לאגוזים', '', 0),
('rsvp_4', 'event_demo_1', 'מיכל אברהם', '+972504567890', 4, 'בשר', '', '', 1),
('rsvp_5', 'event_demo_1', 'יוסף בן-דוד', '+972505678901', 2, 'צמחוני', 'טבעוני', 'תודה על ההזמנה', 1),
('rsvp_6', 'event_demo_1', 'רחל מזרחי', '+972506789012', 2, 'בשר', '', '', 1),
('rsvp_7', 'event_demo_1', 'אברהם ביטון', '+972507890123', 3, 'בשר', '', '', 0),
('rsvp_8', 'event_demo_1', 'רות שמיר', '+972508901234', 1, 'דג', '', '', 1),
('rsvp_9', 'event_demo_1', 'יעקב מור', '+972509012345', 2, 'בשר', 'ללא גלוטן', '', 1),
('rsvp_10', 'event_demo_1', 'לאה גולדברג', '+972500123456', 4, 'בשר', '', 'מאוד מתרגשים!', 1),
('rsvp_11', 'event_demo_1', 'שמעון פרץ', '+972501234568', 2, 'דג', '', '', 0),
('rsvp_12', 'event_demo_1', 'מרים אלון', '+972502345679', 3, 'צמחוני', '', '', 1),
('rsvp_13', 'event_demo_1', 'חיים דהן', '+972503456780', 2, 'בשר', '', '', 1),
('rsvp_14', 'event_demo_1', 'אסתר רוזנברג', '+972504567891', 1, 'דג', '', '', 0),
('rsvp_15', 'event_demo_1', 'נעם חדד', '+972505678902', 2, 'בשר', '', 'נהיה שם!', 1),
('rsvp_16', 'event_demo_1', 'תמר אשכנזי', '+972506789013', 3, 'בשר', '', '', 1),
('rsvp_17', 'event_demo_1', 'אליהו עמר', '+972507890124', 2, 'דג', '', '', 1),
('rsvp_18', 'event_demo_1', 'שושנה כץ', '+972508901235', 1, 'צמחוני', 'אלרגיה לחלב', '', 1),
('rsvp_19', 'event_demo_1', 'אילן גבאי', '+972509012346', 2, 'בשר', '', '', 0),
('rsvp_20', 'event_demo_1', 'נורית שחר', '+972500123457', 4, 'בשר', '', '', 1);

-- רשימת יעד (guests) - 10 אורחים נוספים שעדיין לא ענו
INSERT OR IGNORE INTO guests (id, event_id, full_name, phone, side, group_label, notes) VALUES
('guest_1', 'event_demo_1', 'ארנון זהבי', '+972501111111', 'חתן', 'משפחה קרובה', 'דוד'),
('guest_2', 'event_demo_1', 'יעל כהן', '+972502222222', 'חתן', 'חברי עבודה', ''),
('guest_3', 'event_demo_1', 'גדי לוי', '+972503333333', 'כלה', 'חברים מהצבא', ''),
('guest_4', 'event_demo_1', 'טלי מזרחי', '+972504444444', 'כלה', 'משפחה קרובה', 'דודה'),
('guest_5', 'event_demo_1', 'רון שלום', '+972505555555', 'חתן', 'חברי לימודים', ''),
('guest_6', 'event_demo_1', 'מיה אברהם', '+972506666666', 'כלה', 'שכנים', ''),
('guest_7', 'event_demo_1', 'עידו ברוך', '+972507777777', 'חתן', 'משפחה קרובה', 'בן דוד'),
('guest_8', 'event_demo_1', 'נועה פרידמן', '+972508888888', 'כלה', 'חברות מילדות', ''),
('guest_9', 'event_demo_1', 'עמית דגן', '+972509999999', 'חתן', 'חברי צבא', ''),
('guest_10', 'event_demo_1', 'לינוי חזן', '+972500000000', 'כלה', 'חברות עבודה', '');

-- שולחנות (10 שולחנות)
INSERT OR IGNORE INTO tables (id, event_id, table_name, table_number, capacity) VALUES
('table_1', 'event_demo_1', 'שולחן 1', 1, 10),
('table_2', 'event_demo_1', 'שולחן 2', 2, 10),
('table_3', 'event_demo_1', 'שולחן 3', 3, 10),
('table_4', 'event_demo_1', 'שולחן 4', 4, 10),
('table_5', 'event_demo_1', 'שולחן 5', 5, 10),
('table_6', 'event_demo_1', 'שולחן 6', 6, 10),
('table_7', 'event_demo_1', 'שולחן 7', 7, 10),
('table_8', 'event_demo_1', 'שולחן 8', 8, 8),
('table_9', 'event_demo_1', 'שולחן 9', 9, 8),
('table_10', 'event_demo_1', 'שולחן VIP', 10, 12);

-- סידורי הושבה לדוגמה (חלק מה-RSVPs)
INSERT OR IGNORE INTO seating (id, event_id, rsvp_id, table_id, seat_index) VALUES
('seat_1', 'event_demo_1', 'rsvp_1', 'table_1', 1),
('seat_2', 'event_demo_1', 'rsvp_2', 'table_1', 2),
('seat_3', 'event_demo_1', 'rsvp_3', 'table_2', 1),
('seat_4', 'event_demo_1', 'rsvp_4', 'table_2', 2),
('seat_5', 'event_demo_1', 'rsvp_5', 'table_3', 1),
('seat_6', 'event_demo_1', 'rsvp_6', 'table_3', 2),
('seat_7', 'event_demo_1', 'rsvp_7', 'table_4', 1),
('seat_8', 'event_demo_1', 'rsvp_8', 'table_4', 2),
('seat_9', 'event_demo_1', 'rsvp_9', 'table_5', 1),
('seat_10', 'event_demo_1', 'rsvp_10', 'table_5', 2);

-- צ'ק-אינים (5 אורחים שכבר הגיעו)
INSERT OR IGNORE INTO checkins (id, event_id, rsvp_id, checked_in_by_user_id) VALUES
('checkin_1', 'event_demo_1', 'rsvp_1', 'user_demo_1'),
('checkin_2', 'event_demo_1', 'rsvp_2', 'user_demo_1'),
('checkin_3', 'event_demo_1', 'rsvp_3', 'user_demo_1'),
('checkin_4', 'event_demo_1', 'rsvp_4', 'user_demo_1'),
('checkin_5', 'event_demo_1', 'rsvp_5', 'user_demo_1');

-- Audit logs
INSERT OR IGNORE INTO audit_logs (id, user_id, event_id, action, entity_type, entity_id, metadata_json) VALUES
('log_1', 'user_demo_1', 'event_demo_1', 'CREATE_EVENT', 'event', 'event_demo_1', '{"eventName": "חתונת דני ורונית"}'),
('log_2', 'user_demo_1', 'event_demo_1', 'BULK_CREATE_GUESTS', 'guest', 'event_demo_1', '{"count": 10}'),
('log_3', 'user_demo_1', 'event_demo_1', 'CREATE_TABLE', 'table', 'table_1', '{"tableName": "שולחן 1"}');
