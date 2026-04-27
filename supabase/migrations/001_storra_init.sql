-- storra: metadata in Postgres, ciphertext in Cloudflare R2 (never in this DB).
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Or: `supabase db push` if you use Supabase CLI linked to the project.

create table if not exists public.files (
  id text not null,
  storage_key text not null,
  size bigint not null,
  mime_type text,
  iv text not null,
  encrypted_name text,
  name_iv text,
  filename text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  max_downloads integer,
  download_count integer not null default 0,
  deleted_at timestamptz,
  upload_complete boolean not null default false,
  password_salt text,
  password_key_wrap text,
  constraint files_pkey primary key (id),
  constraint files_storage_key_key unique (storage_key)
);

create index if not exists files_created_at_idx on public.files (created_at);
create index if not exists files_expires_at_idx on public.files (expires_at);
create index if not exists files_deleted_at_idx on public.files (deleted_at);

alter table public.files enable row level security;

-- No policies: anon/auth cannot read/write via PostgREST. The app uses the service role (server only).

comment on table public.files is 'File metadata; ciphertext in R2 only.';
