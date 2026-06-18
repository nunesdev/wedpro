import { supabase } from '@/lib/supabase';
import { TIMELINE_EVENT_ID } from '@/lib/timeline/constants';

const AUDIO_BUCKET = 'audio_files';

export type AudioUploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadAudioFile(file: File): Promise<AudioUploadResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  const path = `${TIMELINE_EVENT_ID}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(path, file, {
    contentType: file.type || 'audio/mpeg',
    upsert: false,
  });

  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
