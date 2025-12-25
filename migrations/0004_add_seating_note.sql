-- Migration: Add seating_note column to rsvps table
-- Purpose: Store removal notes when RSVP is removed from seating due to capacity

ALTER TABLE rsvps ADD COLUMN seating_note TEXT;
