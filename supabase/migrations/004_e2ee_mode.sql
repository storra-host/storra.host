-- Explicit encryption mode for dual-mode operation:
-- - legacy_server: server can decrypt (existing behavior)
-- - e2ee_client: browser-only decryption key path (true E2EE)
alter table public.files
  add column if not exists encryption_mode text not null default 'legacy_server';

alter table public.files
  drop constraint if exists files_encryption_mode_check;

alter table public.files
  add constraint files_encryption_mode_check
  check (encryption_mode in ('legacy_server', 'e2ee_client'));

comment on column public.files.encryption_mode is
  'Encryption model: legacy_server (server decrypts) or e2ee_client (browser decrypts)';
