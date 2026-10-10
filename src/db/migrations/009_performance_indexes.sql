-- Migration 009: Database Performance Optimization Indexes
-- Adds covering and foreign-key indexes to eliminate table scans on joins, aggregations, and sorting.

-- 1. Batch Trainers join & filtering indexes
CREATE INDEX IF NOT EXISTS idx_batch_trainers_trainer_id ON batch_trainers (trainer_id);
CREATE INDEX IF NOT EXISTS idx_batch_trainers_batch_trainer ON batch_trainers (batch_id, trainer_id);
CREATE INDEX IF NOT EXISTS idx_batch_trainers_is_lead ON batch_trainers (batch_id, is_lead);

-- 2. Batches sorting & foreign key filtering
CREATE INDEX IF NOT EXISTS idx_batches_college_status ON batches (college_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_created_at ON batches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_start_date ON batches (start_date DESC);

-- 3. Colleges sorting & filtering
CREATE INDEX IF NOT EXISTS idx_colleges_created_at ON colleges (created_at DESC);

-- 4. Resources foreign key lookup
CREATE INDEX IF NOT EXISTS idx_resources_batch_id ON resources (batch_id);

-- 5. Trainers sorting
CREATE INDEX IF NOT EXISTS idx_trainers_created_at ON trainers (created_at DESC);
