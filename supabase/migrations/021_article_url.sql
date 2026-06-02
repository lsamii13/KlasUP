-- Add a nullable URL column to research_articles.
-- Stores the public source link (e.g. PubMed, ERIC, DOI landing page) for each article.
-- Uses IF NOT EXISTS because migration 009 may have already added this column.
alter table research_articles add column if not exists url text;
