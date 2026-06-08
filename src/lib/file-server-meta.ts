import { getSupabase } from "@/lib/supabase";
import { toPublicFileMeta, type PublicFileMeta } from "@/lib/file-public-meta";

export async function fetchPublicFileMeta(fileId: string): Promise<PublicFileMeta | null> {
  const supabase = getSupabase();
  const { data: file, error } = await supabase
    .from("files")
    .select(
      "id, size, mime_type, filename, iv, expires_at, max_downloads, download_count, view_count, upload_complete, password_key_wrap, encryption_mode, transcode_status, playback_mime_type, poster_storage_key"
    )
    .eq("id", fileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !file || !file.upload_complete) return null;
  if (file.expires_at && new Date(file.expires_at) < new Date()) return null;
  return toPublicFileMeta(file);
}
