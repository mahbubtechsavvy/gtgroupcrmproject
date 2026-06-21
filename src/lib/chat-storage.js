import { getSupabaseClient } from './supabase';

/**
 * Uploads a file to the chat-attachments bucket
 * Path structure: bucket/userId/timestamp_filename
 */
export async function uploadChatAttachment(file, userId) {
  const supabase = getSupabaseClient();
  const timestamp = new Date().getTime();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(fileName);

  return {
    storage_path: data.path,
    public_url: publicUrl,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type
  };
}

/**
 * Deletes a file from chat storage
 */
export async function deleteChatAttachment(path) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from('chat-attachments')
    .remove([path]);
  
  if (error) throw error;
}
