-- 042_chat_storage_setup.sql
-- Initial chat-attachments bucket creation and storage policies.
-- Idempotent: safe to re-run.

-- Storage Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: drop before create for idempotency
DROP POLICY IF EXISTS "Allow users to upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own chat attachments" ON storage.objects;

-- 1. Allow users to upload their own attachments (folder must match user id)
CREATE POLICY "Allow users to upload chat attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 2. Allow authenticated users to view attachments in the bucket.
--    Fine-grained access is enforced in migration 043 via helper function.
CREATE POLICY "Allow users to view chat attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-attachments'
  );

-- 3. Allow users to delete their own attachments
CREATE POLICY "Allow users to delete their own chat attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );
