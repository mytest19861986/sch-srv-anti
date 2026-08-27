-- database/migrations/20260827_event_lifecycle_and_device_tokens.sql

-- 1. Extend attendance_event_type ENUM
ALTER TYPE attendance_event_type ADD VALUE IF NOT EXISTS 'ABSENT';
ALTER TYPE attendance_event_type ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE attendance_event_type ADD VALUE IF NOT EXISTS 'CORRECTED';

-- 2. Extend attendance_events table with lifecycle & lineage columns
ALTER TABLE attendance_events
  ADD COLUMN IF NOT EXISTS cancelled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_event_id UUID REFERENCES attendance_events(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS corrected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS correction_of_event_id UUID REFERENCES attendance_events(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS correction_reason TEXT;

-- Constraint: correction_reason must be at least 10 chars when event_type is CORRECTED
ALTER TABLE attendance_events
  ADD CONSTRAINT chk_attendance_correction_reason
  CHECK (
    (event_type = 'CORRECTED' AND correction_reason IS NOT NULL AND length(trim(correction_reason)) >= 10)
    OR (event_type != 'CORRECTED')
  );

-- Indexes for lightning-fast daily event resolution per student
CREATE INDEX IF NOT EXISTS idx_attendance_events_student_day 
  ON attendance_events(tenant_id, student_id, created_at DESC);

-- 3. Device Tokens Table for Multi-Device Push Notifications
CREATE TABLE IF NOT EXISTS parent_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ANDROID', 'IOS', 'WEB')),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_parent_device_token UNIQUE (tenant_id, parent_id, token)
);

CREATE INDEX IF NOT EXISTS idx_parent_device_tokens_lookup 
  ON parent_device_tokens(tenant_id, parent_id);
