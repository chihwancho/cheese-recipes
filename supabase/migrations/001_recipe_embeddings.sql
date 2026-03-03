-- Enable pgvector extension
create extension if not exists vector;

-- Embeddings table for RAG-based recipe retrieval
create table if not exists recipe_embeddings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  embedding vector(1536) not null,
  embedding_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id)
);

-- HNSW index for fast cosine similarity search
create index on recipe_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Row-level security
alter table recipe_embeddings enable row level security;

create policy "Users can view own recipe embeddings"
  on recipe_embeddings for select using (auth.uid() = user_id);
create policy "Users can insert own recipe embeddings"
  on recipe_embeddings for insert with check (auth.uid() = user_id);
create policy "Users can update own recipe embeddings"
  on recipe_embeddings for update using (auth.uid() = user_id);
create policy "Users can delete own recipe embeddings"
  on recipe_embeddings for delete using (auth.uid() = user_id);

-- Auto-update timestamp trigger
create trigger recipe_embeddings_updated_at
  before update on recipe_embeddings
  for each row execute function update_updated_at();

-- Similarity search RPC function
create or replace function match_recipes(
  query_embedding vector(1536),
  match_user_id uuid,
  match_count int default 20,
  match_threshold float default 0.3
)
returns table (recipe_id uuid, similarity float)
language sql stable
as $$
  select
    re.recipe_id,
    1 - (re.embedding <=> query_embedding) as similarity
  from recipe_embeddings re
  where re.user_id = match_user_id
    and 1 - (re.embedding <=> query_embedding) > match_threshold
  order by re.embedding <=> query_embedding
  limit match_count;
$$;

-- Add embedding API key column to user_settings
alter table user_settings
  add column if not exists encrypted_embedding_api_key text not null default '';
