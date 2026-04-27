-- Defense-in-depth constraints for files metadata integrity.
alter table public.files
  drop constraint if exists files_size_nonnegative;

alter table public.files
  add constraint files_size_nonnegative
  check (size >= 0);

alter table public.files
  drop constraint if exists files_download_count_nonnegative;

alter table public.files
  add constraint files_download_count_nonnegative
  check (download_count >= 0);

alter table public.files
  drop constraint if exists files_max_downloads_positive;

alter table public.files
  add constraint files_max_downloads_positive
  check (max_downloads is null or max_downloads > 0);

alter table public.files
  drop constraint if exists files_expires_after_created;

alter table public.files
  add constraint files_expires_after_created
  check (expires_at is null or expires_at > created_at);
