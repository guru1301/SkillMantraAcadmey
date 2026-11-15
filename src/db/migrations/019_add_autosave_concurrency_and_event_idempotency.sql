-- ==============================================================================
-- Skill Mantra Migration: 019_add_autosave_concurrency_and_event_idempotency.sql
-- ==============================================================================
-- 1. Adds optimistic concurrency version control to assessment_submissions.
--    Prevents older/stale background autosave requests from overwriting newer answers.
-- 2. Adds client-generated idempotency_key to exam_proctoring_events.
--    Guarantees event submission retry safety and prevents duplicate penalty counting.
-- ==============================================================================

-- 1. Assessment Submissions Versioning (Optimistic Concurrency)
ALTER TABLE assessment_submissions 
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2. Exam Proctoring Events Idempotency & Sequencing
ALTER TABLE exam_proctoring_events 
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);

-- Unique index ensuring that any retried or duplicated event with the same idempotency key
-- is deduplicated at the storage layer per assessment and student
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_events_idempotency 
    ON exam_proctoring_events (assessment_id, student_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- Index for ordered sequence number retrieval per attempt
CREATE INDEX IF NOT EXISTS idx_exam_events_seq 
    ON exam_proctoring_events (assessment_id, student_id, sequence_number);

