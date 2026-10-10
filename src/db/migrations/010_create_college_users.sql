-- ==================================================
-- Skill Matra Migration: 010_create_college_users.sql
-- Multi-Tenant College Coordinator / Institutional Portal Authentication
-- ==================================================

CREATE TABLE IF NOT EXISTS college_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'college_admin',
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    CONSTRAINT chk_college_user_status CHECK (status IN ('active', 'inactive'))
);

-- Case-insensitive uniqueness for email
CREATE UNIQUE INDEX IF NOT EXISTS idx_college_users_email_lower 
ON college_users (LOWER(TRIM(email)));

-- Foreign key lookup and composite status indexes
CREATE INDEX IF NOT EXISTS idx_college_users_college_id 
ON college_users (college_id);

CREATE INDEX IF NOT EXISTS idx_college_users_status 
ON college_users (status);
