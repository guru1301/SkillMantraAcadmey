-- ==================================================
-- Skill Mantra Migration: 014_add_trainer_auth.sql
-- Adds password hashing to trainers for trainer portal login
-- ==================================================

ALTER TABLE trainers 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_trainers_email_active 
ON trainers (LOWER(TRIM(email))) 
WHERE (email IS NOT NULL AND status = 'active');
