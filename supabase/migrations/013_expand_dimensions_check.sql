-- KlasUp: Expand dimension CHECK constraint to include 12 additional dimensions
-- the crawler was attempting to insert but failing on. Combines original 21
-- with 12 new higher-ed pedagogy dimensions.

-- Drop the existing constraint
alter table research_articles drop constraint research_articles_dimension_check;

-- Add the expanded constraint with all 33 dimensions
alter table research_articles add constraint research_articles_dimension_check
  check (dimension in (
    -- Original 21
    'Active Learning',
    'Pedagogy',
    'Experiential Learning',
    'Kagan Structures',
    'Problem-Based Learning',
    'Project-Based Learning',
    'Teamwork & Group Projects',
    'Andragogy',
    'Action Research',
    'Universal Design for Learning',
    'Socratic Seminar',
    'Flipped Classroom',
    'Metacognition',
    'Feedback Quality',
    'Student Wellbeing',
    'Faculty Development',
    'Bloom''s Taxonomy',
    'Case Studies',
    'Reflective Practice',
    'Community of Inquiry',
    'Trauma-Informed Teaching',
    -- New 12
    'Team-Based Learning',
    'Culturally Responsive Teaching',
    'Inclusive Teaching',
    'Course Design',
    'Student Engagement',
    'Assessment Design',
    'Discussion-Based Learning',
    'Case-Based Learning',
    'Collaborative Learning',
    'Simulation-Based Learning',
    'Contemplative Pedagogy',
    'High Impact Practices'
  ));
