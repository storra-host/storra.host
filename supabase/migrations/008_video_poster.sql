-- Thumbnail for Discord / Open Graph video embeds
ALTER TABLE files ADD COLUMN IF NOT EXISTS poster_storage_key text;
