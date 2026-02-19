-- ============================================================
-- SENZO CRYPTO — SUPABASE SQL SCHEMA
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- Enable UUID extension (already enabled by default on Supabase)
create extension if not exists "uuid-ossp";


-- ============================================================
-- 1. USER PROFILES
--    Auto-created when a user signs up via auth trigger.
-- ============================================================
create table if not exists public.user_profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    email           text,
    display_name    text,
    first_name      text,
    last_name       text,
    username        text unique,
    photo_url       text,
    role            text default 'user',
    subscription    text default 'free',   -- 'free' | 'pro' | 'elite'
    xp              jsonb default '{"trader": 0, "web3": 0}'::jsonb,
    saved_posts     text[] default '{}',
    mastered_posts  text[] default '{}',
    privacy         jsonb default '{"showPnL": true, "showPortfolio": true, "showSavedPosts": true, "isPublic": true}'::jsonb,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
    insert into public.user_profiles (id, email, display_name, photo_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. PORTFOLIOS
-- ============================================================
create table if not exists public.portfolios (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references public.user_profiles(id) on delete cascade,
    name            text not null,
    description     text,
    currency        text default 'USD',
    initial_balance numeric default 0,
    current_balance numeric default 0,
    is_default      boolean default false,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);


-- ============================================================
-- 3. TRADES
-- ============================================================
create table if not exists public.trades (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references public.user_profiles(id) on delete cascade,
    portfolio_id    uuid references public.portfolios(id) on delete set null,
    symbol          text not null,
    side            text not null,           -- 'long' | 'short'
    entry_price     numeric not null,
    exit_price      numeric,
    stop_loss       numeric,
    take_profit     numeric,
    size            numeric not null,
    pnl             numeric default 0,
    pnl_percent     numeric default 0,
    fees            numeric default 0,
    status          text default 'open',     -- 'open' | 'closed' | 'cancelled'
    notes           text,
    tags            text[] default '{}',
    entry_time      timestamptz default now(),
    exit_time       timestamptz,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);


-- ============================================================
-- 4. BACKTEST TRADES
-- ============================================================
create table if not exists public.backtest_trades (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references public.user_profiles(id) on delete cascade,
    strategy_name   text not null,
    symbol          text not null,
    side            text not null,           -- 'long' | 'short'
    entry_price     numeric not null,
    exit_price      numeric not null,
    stop_loss       numeric,
    take_profit     numeric,
    size            numeric not null,
    pnl             numeric default 0,
    r_multiple      numeric default 0,
    status          text default 'win',      -- 'win' | 'loss' | 'breakeven'
    notes           text,
    entry_time      timestamptz,
    exit_time       timestamptz,
    created_at      timestamptz default now()
);


-- ============================================================
-- 5. QUIZ RESULTS
-- ============================================================
create table if not exists public.quiz_results (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references public.user_profiles(id) on delete cascade,
    post_id         text not null,
    score           int not null,
    total           int not null,
    passed          boolean default false,
    answers         jsonb default '[]'::jsonb,
    completed_at    timestamptz default now()
);


-- ============================================================
-- 6. POSTS  (admin-managed content)
-- ============================================================
create table if not exists public.posts (
    id              uuid primary key default uuid_generate_v4(),
    title           text not null,
    slug            text unique not null,
    content         text,
    excerpt         text,
    featured_image  text,
    category        text,
    tags            text[] default '{}',
    difficulty      text default 'beginner',  -- 'beginner' | 'intermediate' | 'advanced'
    status          text default 'draft',     -- 'draft' | 'published'
    type            text default 'article',   -- 'article' | 'case' | 'game' | 'project' | 'airdrop'
    source_url      text,
    ai_generated    boolean default false,
    project_link    text,
    investment_required boolean default false,
    author          jsonb default '{}'::jsonb, -- { uid, name, email }
    views           int default 0,
    published_at    timestamptz,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);


-- ============================================================
-- 7. PROJECTS
-- ============================================================
create table if not exists public.projects (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references public.user_profiles(id) on delete cascade,
    title           text not null,
    description     text,
    start_amount    numeric default 0,
    target_amount   numeric default 0,
    current_amount  numeric default 0,
    currency        text default 'USD',
    status          text default 'active',  -- 'active' | 'completed' | 'paused'
    tags            text[] default '{}',
    milestones      jsonb default '[]'::jsonb,
    cover_image     text,
    featured_image  text,
    icon            text,
    icon_color      text,
    display_mode    text default 'icon',    -- 'icon' | 'featured' | 'both'
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);


-- ============================================================
-- 8. PROJECT ENTRIES
-- ============================================================
create table if not exists public.project_entries (
    id          uuid primary key default uuid_generate_v4(),
    project_id  uuid not null references public.projects(id) on delete cascade,
    content     text not null,
    type        text default 'note',  -- 'note' | 'trade' | 'update'
    date        timestamptz default now(),
    tags        text[] default '{}',
    images      text[] default '{}'
);


-- ============================================================
-- 9. EMOJI PACKS
-- ============================================================
create table if not exists public.emoji_packs (
    id          uuid primary key default uuid_generate_v4(),
    name        text not null,
    description text,
    emojis      jsonb default '[]'::jsonb,  -- [{ id, name, url, keywords }]
    is_active   boolean default true,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);


-- ============================================================
-- 10. STICKER PACKS
-- ============================================================
create table if not exists public.sticker_packs (
    id          uuid primary key default uuid_generate_v4(),
    name        text not null,
    description text,
    stickers    jsonb default '[]'::jsonb,  -- [{ id, name, lottieData, thumbnailUrl, keywords }]
    is_active   boolean default true,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.user_profiles     enable row level security;
alter table public.portfolios         enable row level security;
alter table public.trades             enable row level security;
alter table public.backtest_trades    enable row level security;
alter table public.quiz_results       enable row level security;
alter table public.posts              enable row level security;
alter table public.projects           enable row level security;
alter table public.project_entries    enable row level security;
alter table public.emoji_packs        enable row level security;
alter table public.sticker_packs      enable row level security;


-- ── user_profiles ──────────────────────────────────────────
create policy "Users can view their own profile"
    on public.user_profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.user_profiles for update
    using (auth.uid() = id);

-- (insert handled by trigger — no insert policy needed for users)


-- ── portfolios ─────────────────────────────────────────────
create policy "Users manage their own portfolios"
    on public.portfolios for all
    using (auth.uid() = user_id);


-- ── trades ─────────────────────────────────────────────────
create policy "Users manage their own trades"
    on public.trades for all
    using (auth.uid() = user_id);


-- ── backtest_trades ────────────────────────────────────────
create policy "Users manage their own backtest trades"
    on public.backtest_trades for all
    using (auth.uid() = user_id);


-- ── quiz_results ───────────────────────────────────────────
create policy "Users manage their own quiz results"
    on public.quiz_results for all
    using (auth.uid() = user_id);


-- ── posts — public read, authenticated write ───────────────
create policy "Anyone can read published posts"
    on public.posts for select
    using (status = 'published' or auth.uid() is not null);

create policy "Authenticated users can create posts"
    on public.posts for insert
    with check (auth.uid() is not null);

create policy "Authenticated users can update posts"
    on public.posts for update
    using (auth.uid() is not null);

create policy "Authenticated users can delete posts"
    on public.posts for delete
    using (auth.uid() is not null);


-- ── projects ───────────────────────────────────────────────
create policy "Users manage their own projects"
    on public.projects for all
    using (auth.uid() = user_id);


-- ── project_entries ────────────────────────────────────────
create policy "Users manage entries for their projects"
    on public.project_entries for all
    using (
        exists (
            select 1 from public.projects p
            where p.id = project_entries.project_id
            and p.user_id = auth.uid()
        )
    );


-- ── emoji_packs — public read ──────────────────────────────
create policy "Anyone can read active emoji packs"
    on public.emoji_packs for select
    using (is_active = true or auth.uid() is not null);

create policy "Authenticated users can manage emoji packs"
    on public.emoji_packs for all
    using (auth.uid() is not null);


-- ── sticker_packs — public read ────────────────────────────
create policy "Anyone can read active sticker packs"
    on public.sticker_packs for select
    using (is_active = true or auth.uid() is not null);

create policy "Authenticated users can manage sticker packs"
    on public.sticker_packs for all
    using (auth.uid() is not null);


-- ============================================================
-- STORAGE BUCKETS
-- Run separately if buckets don't exist yet
-- ============================================================
-- In Supabase Dashboard → Storage → New Bucket:
--   Name: "posts"     — Public: YES
--   Name: "emojis"    — Public: YES
--   Name: "stickers"  — Public: YES
--   Name: "avatars"   — Public: YES
--
-- Or uncomment and run these SQL statements:
-- insert into storage.buckets (id, name, public) values ('posts',    'posts',    true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('emojis',   'emojis',   true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('stickers', 'stickers', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('avatars',  'avatars',  true) on conflict do nothing;


-- ============================================================
-- INDEXES (optional but recommended for performance)
-- ============================================================
create index if not exists idx_trades_user_id         on public.trades(user_id);
create index if not exists idx_trades_entry_time      on public.trades(entry_time desc);
create index if not exists idx_backtest_user_id       on public.backtest_trades(user_id);
create index if not exists idx_backtest_strategy      on public.backtest_trades(strategy_name);
create index if not exists idx_posts_status           on public.posts(status);
create index if not exists idx_posts_slug             on public.posts(slug);
create index if not exists idx_posts_created_at       on public.posts(created_at desc);
create index if not exists idx_projects_user_id       on public.projects(user_id);
create index if not exists idx_project_entries_proj   on public.project_entries(project_id);
create index if not exists idx_quiz_results_user      on public.quiz_results(user_id);
