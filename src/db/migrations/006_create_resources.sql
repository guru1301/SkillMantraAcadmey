-- ==================================================
-- Skill Matra Migration: 006_create_resources.sql
-- ==================================================

CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'google_drive',
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_resource_type CHECK (type IN ('google_drive', 'document', 'video', 'link'))
);

CREATE INDEX IF NOT EXISTS idx_resources_batch_id ON resources (batch_id);
