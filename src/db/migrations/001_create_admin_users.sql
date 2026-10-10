-- ==================================================
-- Skill Matra Migration: 001_create_admin_users.sql
-- Neon PostgreSQL: skillmantra (branch: production)
-- ==================================================

-- 1. Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 3. Case-insensitive unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower 
ON admin_users (LOWER(email));

-- 4. Composite index on role and status for quick queries
CREATE INDEX IF NOT EXISTS idx_admin_users_role_status 
ON admin_users (role, status);
