-- Add category column to learning_outcomes
-- Supports: outcome (default), competency, skill
-- Existing rows automatically backfilled as 'outcome'

ALTER TABLE learning_outcomes
  ADD COLUMN category text NOT NULL DEFAULT 'outcome'
  CONSTRAINT learning_outcomes_category_check CHECK (category IN ('outcome', 'competency', 'skill'));

CREATE INDEX idx_learning_outcomes_course_category
  ON learning_outcomes(course_id, category);
