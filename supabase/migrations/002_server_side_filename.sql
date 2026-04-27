-- Plain original filename (also in 001 for new installs; safe if re-run).
alter table public.files add column if not exists filename text;

comment on column public.files.filename is 'Sanitized original name for downloads; optional.';
