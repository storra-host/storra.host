-- Video embed / playback support
ALTER TABLE files
  ADD COLUMN IF NOT EXISTS transcoded_storage_key text,
  ADD COLUMN IF NOT EXISTS transcode_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS playback_mime_type text;

ALTER TABLE files
  DROP CONSTRAINT IF EXISTS files_transcode_status_check;

ALTER TABLE files
  ADD CONSTRAINT files_transcode_status_check
  CHECK (transcode_status IN ('none', 'pending', 'ready', 'failed', 'skipped'));
