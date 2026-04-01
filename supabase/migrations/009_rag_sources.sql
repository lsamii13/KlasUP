-- KlasUp RAG Sources Expansion
-- Adds source_type column to research_articles and seeds TED talks, book summaries,
-- teaching blogs, and CTL resources.

-- 1. Add source_type column
alter table research_articles add column if not exists source_type text
  not null default 'peer_reviewed'
  check (source_type in (
    'peer_reviewed',
    'ctl_resource',
    'teaching_blog',
    'ted_talk',
    'book_summary',
    'practical_guide'
  ));

-- 2. Add url column for linkable resources
alter table research_articles add column if not exists url text;

-- 3. Index on source_type
create index if not exists idx_research_articles_source_type on research_articles (source_type);

-- 4. Update keyword_search_articles to return new columns
create or replace function keyword_search_articles(
  query_text text,
  match_count int default 10,
  filter_dimension text default null
)
returns table (
  id uuid,
  title text,
  authors text,
  year integer,
  journal text,
  abstract text,
  content text,
  dimension text,
  search_terms text[],
  source_type text,
  url text,
  rank float
)
language plpgsql
as $$
declare
  tsquery_val tsquery;
begin
  tsquery_val := plainto_tsquery('english', query_text);
  return query
  select
    ra.id,
    ra.title,
    ra.authors,
    ra.year,
    ra.journal,
    ra.abstract,
    ra.content,
    ra.dimension,
    ra.search_terms,
    ra.source_type,
    ra.url,
    greatest(
      ts_rank_cd(ra.fts, tsquery_val),
      case when exists (
        select 1 from unnest(ra.search_terms) st
        where lower(st) like '%' || lower(query_text) || '%'
      ) then 0.5 else 0.0 end
    ) as rank
  from research_articles ra
  where
    (ra.fts @@ tsquery_val
     or exists (
       select 1 from unnest(ra.search_terms) st
       where lower(st) like '%' || lower(query_text) || '%'
     ))
    and (filter_dimension is null or ra.dimension = filter_dimension)
  order by rank desc
  limit match_count;
end;
$$;

-- ════════════════════════════════════════
--  TED TALKS
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms, source_type, url) values
(
  'Do Schools Kill Creativity?',
  'Ken Robinson',
  2006,
  'TED Talk',
  'Argues that schools suppress creativity and that we need to rethink how we educate children, with humor and insight about the value of arts and diverse intelligences.',
  'Pedagogy',
  '{creativity, education reform, arts, diverse intelligences, Ken Robinson}',
  'ted_talk',
  'https://www.ted.com/talks/ken_robinson_says_schools_kill_creativity'
),
(
  'Every Kid Needs a Champion',
  'Rita Pierson',
  2013,
  'TED Talk',
  'A powerful call for human connection in education — every child deserves a champion who believes in them, pushes them, and refuses to give up on them.',
  'Student Wellbeing',
  '{student relationships, champion, connection, motivation, Rita Pierson}',
  'ted_talk',
  'https://www.ted.com/talks/rita_pierson_every_kid_needs_a_champion'
),
(
  'Grit: The Power of Passion and Perseverance',
  'Angela Duckworth',
  2013,
  'TED Talk',
  'Research on what makes students succeed — not IQ or talent, but grit: passion and perseverance toward long-term goals.',
  'Metacognition',
  '{grit, perseverance, passion, student success, Angela Duckworth}',
  'ted_talk',
  'https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance'
),
(
  'The Puzzle of Motivation',
  'Dan Pink',
  2009,
  'TED Talk',
  'Challenges traditional reward-based motivation, arguing that autonomy, mastery, and purpose are the real drivers of performance and learning.',
  'Active Learning',
  '{motivation, autonomy, mastery, purpose, intrinsic motivation, Dan Pink}',
  'ted_talk',
  'https://www.ted.com/talks/dan_pink_the_puzzle_of_motivation'
);

-- ════════════════════════════════════════
--  BOOK SUMMARIES
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms, source_type, url) values
(
  'Make It Stick: The Science of Successful Learning',
  'Brown, P. C., Roediger, H. L., & McDaniel, M. A.',
  2014,
  'Belknap Press',
  'Evidence-based strategies for durable learning including retrieval practice, spaced repetition, and interleaving — counterintuitive techniques that outperform re-reading and highlighting.',
  'Active Learning',
  '{retrieval practice, spaced repetition, interleaving, durable learning, study strategies}',
  'book_summary',
  'https://www.retrievalpractice.org/make-it-stick'
),
(
  'Small Teaching: Everyday Lessons from the Science of Learning',
  'James Lang',
  2016,
  'Jossey-Bass',
  'Small, manageable changes to teaching practice — opening and closing rituals, low-stakes testing, prediction exercises — that dramatically improve student learning.',
  'Pedagogy',
  '{small teaching, low-stakes testing, prediction, classroom rituals, James Lang}',
  'book_summary',
  'https://www.jamesmlang.com/small-teaching'
),
(
  'The Courage to Teach: Exploring the Inner Landscape of a Teacher''s Life',
  'Parker Palmer',
  1998,
  'Jossey-Bass',
  'Explores the inner life of teachers, arguing that good teaching comes from the identity and integrity of the teacher — who you are matters as much as what you do.',
  'Faculty Development',
  '{teacher identity, inner life, authenticity, reflective teaching, Parker Palmer}',
  'book_summary',
  'https://www.couragetolearn.ca/resources/the-courage-to-teach/'
),
(
  'What the Best College Teachers Do',
  'Ken Bain',
  2004,
  'Harvard University Press',
  'Research on what separates the best college professors — they create natural critical learning environments, focus on student understanding, and trust students to take responsibility for their learning.',
  'Pedagogy',
  '{best teachers, critical learning environment, student understanding, Ken Bain}',
  'book_summary',
  'https://www.hup.harvard.edu/books/9780674013254'
),
(
  'Minds Online: Teaching Effectively with Technology',
  'Michelle Miller',
  2014,
  'Harvard University Press',
  'How cognitive science principles apply to online teaching — attention, memory, motivation, and metacognition in digital learning environments.',
  'Pedagogy',
  '{online teaching, cognitive science, attention, memory, digital learning, Michelle Miller}',
  'book_summary',
  'https://www.hup.harvard.edu/books/9780674368248'
),
(
  'Teach Students How to Learn',
  'Saundra McGuire',
  2015,
  'Stylus Publishing',
  'Practical strategies for teaching metacognition and study skills so students take ownership of their learning.',
  'Metacognition',
  '{metacognition, study skills, student ownership, learning strategies, Saundra McGuire}',
  'book_summary',
  'https://www.amazon.com/Teach-Students-How-Learn-Metacognition/dp/162036316X'
);

-- ════════════════════════════════════════
--  TEACHING BLOGS
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms, source_type, url) values
(
  'The Evidence on Active Learning',
  'Faculty Focus',
  2024,
  'Faculty Focus',
  'Overview of research supporting active learning strategies and practical classroom applications.',
  'Active Learning',
  '{active learning, evidence, classroom strategies, Faculty Focus}',
  'teaching_blog',
  'https://www.facultyfocus.com/articles/active-learning/'
),
(
  'Effective Feedback Strategies',
  'Faculty Focus',
  2024,
  'Faculty Focus',
  'Research-backed approaches to giving students feedback that actually improves learning.',
  'Feedback Quality',
  '{feedback, student learning, assessment, Faculty Focus}',
  'teaching_blog',
  'https://www.facultyfocus.com/articles/educational-assessment/effective-feedback/'
),
(
  'Teaching First-Generation Students',
  'Chronicle of Higher Education',
  2024,
  'Chronicle of Higher Education',
  'Strategies and perspectives on supporting first-generation college students in the classroom.',
  'Student Wellbeing',
  '{first-generation students, equity, support, Chronicle of Higher Education}',
  'teaching_blog',
  'https://www.chronicle.com/article/teaching-first-generation-students'
);

-- ════════════════════════════════════════
--  CTL RESOURCES
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms, source_type, url) values
(
  'Active Learning Strategies',
  'Vanderbilt CTL',
  2024,
  'Vanderbilt Center for Teaching',
  'Research-backed guide to active learning techniques including think-pair-share, case studies, and problem-based learning.',
  'Active Learning',
  '{active learning, think-pair-share, case studies, problem-based learning, Vanderbilt}',
  'ctl_resource',
  'https://cft.vanderbilt.edu/guides-sub-pages/active-learning/'
),
(
  'Bloom''s Taxonomy',
  'Vanderbilt CTL',
  2024,
  'Vanderbilt Center for Teaching',
  'Overview of Bloom''s Taxonomy and how to use it to write learning objectives and design assessments.',
  'Bloom''s Taxonomy',
  '{Bloom taxonomy, learning objectives, assessment design, Vanderbilt}',
  'ctl_resource',
  'https://cft.vanderbilt.edu/guides-sub-pages/blooms-taxonomy/'
),
(
  'Course Design',
  'Stanford CTL',
  2024,
  'Stanford Center for Teaching and Learning',
  'Stanford''s framework for intentional course design, from learning outcomes to assessment alignment.',
  'Pedagogy',
  '{course design, learning outcomes, assessment alignment, Stanford}',
  'ctl_resource',
  'https://ctl.stanford.edu/course-design'
),
(
  'Inclusive Teaching',
  'Stanford CTL',
  2024,
  'Stanford Center for Teaching and Learning',
  'Strategies for creating equitable and inclusive learning environments that support all students.',
  'Universal Design for Learning',
  '{inclusive teaching, equity, UDL, Stanford}',
  'ctl_resource',
  'https://ctl.stanford.edu/inclusive-teaching'
),
(
  'Teaching Resources A-Z',
  'Harvard Bok Center',
  2024,
  'Harvard Bok Center for Teaching and Learning',
  'Harvard''s comprehensive collection of teaching resources covering discussion facilitation, feedback, assessment, and more.',
  'Pedagogy',
  '{teaching resources, discussion, feedback, assessment, Harvard}',
  'ctl_resource',
  'https://bokcenter.harvard.edu/resources'
);
