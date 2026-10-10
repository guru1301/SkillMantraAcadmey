-- ==================================================
-- Skill Matra Migration: 002_create_colleges.sql
-- ==================================================

CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    logo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_college_status CHECK (status IN ('active', 'inactive'))
);

-- Case-insensitive uniqueness for College Name + City
CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_name_city_lower 
ON colleges (LOWER(TRIM(name)), LOWER(TRIM(COALESCE(city, ''))));

-- Query indexes for common search and filter patterns
CREATE INDEX IF NOT EXISTS idx_colleges_status ON colleges (status);
CREATE INDEX IF NOT EXISTS idx_colleges_city ON colleges (LOWER(city));
