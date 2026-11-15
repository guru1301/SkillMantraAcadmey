-- ==============================================================================
-- Skill Mantra Migration: 018_create_exam_proctoring_system.sql
-- ==============================================================================
-- Provisions audit logging table for online exam proctoring events:
-- 1. TAB_HIDDEN: Student navigated away or switched browser tabs
-- 2. WINDOW_BLUR: Browser lost OS focus (e.g. opened external app)
-- 3. FULLSCREEN_EXIT: Browser escaped mandatory fullscreen mode
-- 4. PAGE_HIDDEN: Page visibility state hidden (minimized or switched)
-- 5. CONNECTION_LOST: Client network connectivity offline
-- 6. CONNECTION_RESTORED: Client re-established network connection
-- 7. EXAM_RESUMED: Student acknowledged warning and returned to exam terminal
-- ==============================================================================

CREATE TABLE IF NOT EXISTS exam_proctoring_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    sequence_number INTEGER NOT NULL DEFAULT 1,
    duration_seconds NUMERIC(10, 2) DEFAULT 0.0,
    event_metadata JSONB DEFAULT '{}'::jsonb,
    acknowledged BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_proctoring_event_type CHECK (
        event_type IN (
            'TAB_HIDDEN',
            'WINDOW_BLUR',
            'FULLSCREEN_EXIT',
            'PAGE_HIDDEN',
            'CONNECTION_LOST',
            'CONNECTION_RESTORED',
            'EXAM_RESUMED'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_exam_events_assessment_student 
    ON exam_proctoring_events (assessment_id, student_id);

CREATE INDEX IF NOT EXISTS idx_exam_events_type 
    ON exam_proctoring_events (event_type);

CREATE INDEX IF NOT EXISTS idx_exam_events_created 
    ON exam_proctoring_events (created_at);

