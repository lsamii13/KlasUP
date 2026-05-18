-- KlasUp Phase 1: Klas Mode 2 — Conversations & Article Interactions
-- Adds tables for storing Klas brainstorm conversations and tracking
-- how users interact with research articles surfaced by Klas.

-- ============================================================
-- Helper: auto-update updated_at on row modification
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- TABLE 1: klas_conversations
-- ============================================================
create table klas_conversations (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  title           text        not null default 'Untitled brainstorm',
  core_4_context  jsonb       not null default '{}'::jsonb,
  messages        jsonb       not null default '[]'::jsonb,
  current_mode    text        not null default 'gathering'
                              check (current_mode in ('gathering', 'confirming', 'brainstorming')),
  dimensions_touched text[]   not null default '{}',
  reached_mode_2  boolean     not null default false,
  actions_taken   text[]      not null default '{}',
  message_count   integer     not null default 0,
  archived        boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes
create index idx_klas_conversations_user_id    on klas_conversations (user_id);
create index idx_klas_conversations_updated_at on klas_conversations (updated_at desc);
create index idx_klas_conversations_archived   on klas_conversations (archived);

-- Auto-update updated_at
create trigger trg_klas_conversations_updated_at
  before update on klas_conversations
  for each row execute function set_updated_at();

-- RLS
alter table klas_conversations enable row level security;

create policy "Users can manage own conversations"
  on klas_conversations for all using (auth.uid() = user_id);

-- ============================================================
-- TABLE 2: klas_article_interactions
-- ============================================================
create table klas_article_interactions (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  conversation_id  uuid        references klas_conversations(id) on delete set null,
  article_id       uuid        not null references research_articles(id) on delete cascade,
  interaction_type text        not null
                               check (interaction_type in ('shown', 'clicked', 'saved', 'shared')),
  dimension        text,
  created_at       timestamptz not null default now()
);

-- Indexes
create index idx_klas_article_interactions_user_id         on klas_article_interactions (user_id);
create index idx_klas_article_interactions_article_id      on klas_article_interactions (article_id);
create index idx_klas_article_interactions_conversation_id on klas_article_interactions (conversation_id);
create index idx_klas_article_interactions_user_article    on klas_article_interactions (user_id, article_id);

-- RLS
alter table klas_article_interactions enable row level security;

create policy "Users can manage own article interactions"
  on klas_article_interactions for all using (auth.uid() = user_id);
