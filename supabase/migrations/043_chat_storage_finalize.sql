-- 043_chat_storage_finalize.sql
-- Final production hardening for chat attachment metadata and storage access.
-- Idempotent: safe to re-run.

-- ============================================================================
-- 1. Add relationship columns to chat_attachments for fine-grained access
-- ============================================================================

ALTER TABLE public.chat_attachments
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chat_attachments_conversation_id ON public.chat_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_group_id ON public.chat_attachments(group_id);

-- ============================================================================
-- 2. Helper function for secure attachment access check
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_access_chat_attachment(p_storage_path TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.chat_attachments ca
      LEFT JOIN public.chat_direct_messages dm ON ca.dm_message_id = dm.id
      LEFT JOIN public.chat_conversations conv
        ON ca.conversation_id = conv.id OR dm.conversation_id = conv.id
      LEFT JOIN public.chat_group_members gm ON ca.group_id = gm.group_id
    WHERE ca.storage_path = p_storage_path
      AND (
        ca.uploader_id = auth.uid()
        OR dm.sender_id = auth.uid()
        OR conv.participant_a = auth.uid()
        OR conv.participant_b = auth.uid()
        OR gm.user_id = auth.uid()
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Harden storage bucket: upgrade to secure access-controlled policies
-- ============================================================================

-- Ensure bucket exists (safe if 042 already created it)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies (from 042 or previous runs)
DROP POLICY IF EXISTS "Allow users to view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own chat attachments" ON storage.objects;

-- Re-create with tighter security

-- Upload: user's folder must match their user id
CREATE POLICY "Allow users to upload chat attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- View: only if user has access to the conversation/group/DM this file belongs to
CREATE POLICY "Allow users to view chat attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    public.can_access_chat_attachment(name)
  );

-- Delete: only uploader can delete their own files
CREATE POLICY "Allow users to delete their own chat attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );
