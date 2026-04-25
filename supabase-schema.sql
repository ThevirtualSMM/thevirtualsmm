-- ============================================================
-- SMM AUDIT PLATFORM — SUPABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";


-- ============================================================
-- USERS
-- ============================================================
create table if not exists users (
  id            uuid        default gen_random_uuid() primary key,
  email         text        unique not null,
  password_hash text        not null,
  name          text,
  created_at    timestamptz default now()
);


-- ============================================================
-- INSTAGRAM ACCOUNTS
-- One user can connect one Instagram account
-- ============================================================
create table if not exists instagram_accounts (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references users(id) on delete cascade not null,
  instagram_user_id   text        not null,
  username            text        not null,
  access_token        text        not null,
  token_expires_at    timestamptz,
  connected_at        timestamptz default now(),
  unique(user_id, instagram_user_id)
);


-- ============================================================
-- AUDITS
-- One row per audit run triggered by the user
-- ============================================================
create table if not exists audits (
  id                    uuid        default gen_random_uuid() primary key,
  user_id               uuid        references users(id) on delete cascade not null,
  instagram_account_id  uuid        references instagram_accounts(id) on delete cascade not null,
  status                text        default 'pending',
    -- pending | scraping | analyzing | complete | failed
  triggered_at          timestamptz default now(),
  completed_at          timestamptz,
  date_range_start      date        not null,
  date_range_end        date        not null,
  total_posts_scraped   integer     default 0,
  claude_summary        text,
  claude_json           jsonb,
  error_message         text
);


-- ============================================================
-- POSTS
-- One row per Instagram post within an audit
-- ============================================================
create table if not exists posts (
  id                    uuid        default gen_random_uuid() primary key,
  audit_id              uuid        references audits(id) on delete cascade not null,
  user_id               uuid        references users(id) on delete cascade not null,
  instagram_post_id     text        not null,

  -- Content metadata
  post_type             text,       -- image | carousel | reel
  posted_at             timestamptz,
  caption               text,
  hashtags              text[],
  is_collab             boolean     default false,
  duration_seconds      integer,    -- reels only
  thumbnail_url         text,

  -- Core metrics
  views                 integer     default 0,
  accounts_reached      integer     default 0,
  avg_watch_time_seconds numeric,
  follows_from_post     integer     default 0,

  -- Rate metrics (stored as decimals: 0.05 = 5%)
  skip_rate             numeric,
  share_rate            numeric,
  like_rate             numeric,
  save_rate             numeric,
  repost_rate           numeric,
  comment_rate          numeric,

  -- Source of views breakdown (decimals: 0.40 = 40%)
  source_home           numeric,
  source_explore        numeric,
  source_profile        numeric,
  source_hashtags       numeric,
  source_other          numeric,

  -- Comments
  top_comments          jsonb,      -- [{ text: "...", likes: 0 }, ...]
  questions_in_comments text[],

  -- Set by Claude after analysis
  performance_tiers     text[],
  -- e.g. ['best_views', 'worst_followers']

  unique(audit_id, instagram_post_id)
);


-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_instagram_accounts_user_id on instagram_accounts(user_id);
create index if not exists idx_audits_user_id             on audits(user_id);
create index if not exists idx_audits_status              on audits(status);
create index if not exists idx_posts_audit_id             on posts(audit_id);
create index if not exists idx_posts_user_id              on posts(user_id);
create index if not exists idx_posts_posted_at            on posts(posted_at);
create index if not exists idx_posts_views                on posts(views desc);


-- ============================================================
-- ROW LEVEL SECURITY
-- Users can only read/write their own data
-- ============================================================
alter table users               enable row level security;
alter table instagram_accounts  enable row level security;
alter table audits              enable row level security;
alter table posts               enable row level security;

-- We use NextAuth (JWT) so auth happens in the API layer.
-- The service role key (used server-side only) bypasses RLS.
-- The anon key (used client-side) is blocked from all tables by default.
-- This means: all data access goes through our API routes — never direct from the browser.

create policy "block_anon_users"           on users               for all using (false);
create policy "block_anon_instagram"       on instagram_accounts  for all using (false);
create policy "block_anon_audits"          on audits              for all using (false);
create policy "block_anon_posts"           on posts               for all using (false);


-- ============================================================
-- DONE
-- ============================================================
-- After running this, verify in Table Editor that you see:
--   users, instagram_accounts, audits, posts
