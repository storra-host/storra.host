-- Per-file data key, wrapped with the master key (Vercel-safe direct R2 upload path).
-- NULL = legacy row encrypted only with the global ENCRYPTION_KEY.
alter table public.files add column if not exists wrapped_file_key text;
comment on column public.files.wrapped_file_key is 'AES-256 data key, encrypted with ENCRYPTION_KEY, base64url. NULL for pre-direct-upload rows.';
