-- Migration: Add generated full-text search (fts) tsvector column to products table
-- and GIN index for fast search queries.

alter table public.products
  add column if not exists fts tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists products_fts_idx
  on public.products using gin (fts);
