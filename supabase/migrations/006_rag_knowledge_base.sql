-- KlasUp RAG Knowledge Base
-- Stores peer-reviewed research articles for keyword-based retrieval,
-- powering research-grounded AI recommendations.
--
-- EMBEDDINGS: The embedding column exists for future vector search but is
-- nullable and unused until an embedding provider is configured. All current
-- retrieval uses full-text search (tsvector) and keyword array matching.

-- 1. Enable the pgvector extension (safe to run even if already enabled).
--    If your Supabase project doesn't have pgvector, comment this line out —
--    the app works with keyword search alone.
create extension if not exists vector with schema extensions;

-- 2. Create the research_articles table
create table if not exists research_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text not null,
  year integer not null,
  journal text,
  abstract text,
  content text,
  dimension text not null check (dimension in (
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
    'Trauma-Informed Teaching'
  )),
  embedding vector(1536),
  search_terms text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 3. GIN index for fast keyword search on the search_terms array
create index if not exists idx_research_articles_search_terms
  on research_articles using gin (search_terms);

-- 4. Index on dimension for filtered queries
create index if not exists idx_research_articles_dimension
  on research_articles (dimension);

-- 5. Full-text search index on title + abstract + authors
--    This is the PRIMARY retrieval mechanism until embeddings are added.
alter table research_articles add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(authors, '')), 'C')
  ) stored;

create index if not exists idx_research_articles_fts
  on research_articles using gin (fts);

-- 6. (FUTURE) Vector similarity index — only useful once embeddings are populated.
--    IVFFlat requires rows to already exist, so this index is created but won't
--    speed up queries until embeddings are backfilled.
--    If pgvector is not available, comment this line out.
create index if not exists idx_research_articles_embedding
  on research_articles using ivfflat (embedding vector_cosine_ops) with (lists = 10);

-- 7. RPC: keyword_search_articles — full-text and array keyword search
--    This is the PRIMARY search function used by all retrieval paths.
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

-- 8. RPC: match_articles — vector similarity search (FUTURE USE)
--    Requires embeddings to be populated. Returns nothing until then.
--    Kept here so the function exists and won't cause errors if called.
create or replace function match_articles(
  query_embedding vector(1536),
  match_count int default 5,
  match_threshold float default 0.5,
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
  similarity float
)
language plpgsql
as $$
begin
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
    1 - (ra.embedding <=> query_embedding) as similarity
  from research_articles ra
  where
    ra.embedding is not null
    and 1 - (ra.embedding <=> query_embedding) > match_threshold
    and (filter_dimension is null or ra.dimension = filter_dimension)
  order by ra.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 9. RLS: research_articles is public read, no user writes from client
alter table research_articles enable row level security;

-- Drop existing policy if re-running
drop policy if exists "Anyone can read research articles" on research_articles;

create policy "Anyone can read research articles"
  on research_articles for select
  using (true);

-- Only service_role can insert/update/delete (via migrations/seeds/admin).
-- No insert/update/delete policies for anon or authenticated roles.
