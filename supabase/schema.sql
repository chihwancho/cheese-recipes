-- MealPlan Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables and security policies.

-- ============================================================
-- RECIPES
-- ============================================================
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  prep_time text not null default '',
  cook_time text not null default '',
  servings integer not null default 1,
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  tags text[] not null default '{}',
  images text[] not null default '{}',
  rating integer not null default 0,
  notes text not null default '',
  is_favorite boolean not null default false,
  source text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recipes enable row level security;

create policy "Users can view own recipes"
  on recipes for select using (auth.uid() = user_id);

create policy "Users can insert own recipes"
  on recipes for insert with check (auth.uid() = user_id);

create policy "Users can update own recipes"
  on recipes for update using (auth.uid() = user_id);

create policy "Users can delete own recipes"
  on recipes for delete using (auth.uid() = user_id);

-- ============================================================
-- SHOPPING ITEMS
-- ============================================================
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  quantity text not null default '',
  category text not null default 'pantry'
    check (category in ('produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery')),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table shopping_items enable row level security;

create policy "Users can view own shopping items"
  on shopping_items for select using (auth.uid() = user_id);

create policy "Users can insert own shopping items"
  on shopping_items for insert with check (auth.uid() = user_id);

create policy "Users can update own shopping items"
  on shopping_items for update using (auth.uid() = user_id);

create policy "Users can delete own shopping items"
  on shopping_items for delete using (auth.uid() = user_id);

-- ============================================================
-- MEAL PLANS (one row per week per user, JSONB for day plans)
-- ============================================================
create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null,
  days jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_key)
);

alter table meal_plans enable row level security;

create policy "Users can view own meal plans"
  on meal_plans for select using (auth.uid() = user_id);

create policy "Users can insert own meal plans"
  on meal_plans for insert with check (auth.uid() = user_id);

create policy "Users can update own meal plans"
  on meal_plans for update using (auth.uid() = user_id);

create policy "Users can delete own meal plans"
  on meal_plans for delete using (auth.uid() = user_id);

-- ============================================================
-- USER SETTINGS
-- ============================================================
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  llm_provider text not null default 'anthropic',
  encrypted_api_key text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "Users can view own settings"
  on user_settings for select using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update using (auth.uid() = user_id);

create policy "Users can delete own settings"
  on user_settings for delete using (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamp on row change)
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on recipes
  for each row execute function update_updated_at();

create trigger meal_plans_updated_at
  before update on meal_plans
  for each row execute function update_updated_at();

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();
