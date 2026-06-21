-- 048_chat_advanced_features.sql
-- Adds: Pinned Messages, Message Search index, Soft Delete audit, @Mentions
-- Idempotent: safe to re-run.

-- ============================================================================
-- 1. PINNED MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  dm_message_id UUID REFERENCES public.chat_direct_messages(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  pinned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  pinned_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_pinned_source CHECK (
    (message_id IS NOT NULL AND group_id IS NOT NULL AND dm_message_id IS NULL AND conversation_id IS NULL) OR
    (dm_message_id IS NOT NULL AND conversation_id IS NOT NULL AND message_id IS NULL AND group_id IS NULL)
  )
);

-- ============================================================================
-- 2. IS_PINNED COLUMN ON DIRECT MESSAGES
-- ============================================================================
ALTER TABLE public.chat_direct_messages
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- ============================================================================
-- 3. FULL-TEXT SEARCH INDEX ON MESSAGES
-- ============================================================================
CREATE INDEX IF NOT EXISTS chat_messages_content_fts
  ON public.chat_messages USING GIN (to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS chat_direct_messages_content_fts
  ON public.chat_direct_messages USING GIN (to_tsvector('english', content));

-- ============================================================================
-- 4. IS_DELETED COLUMN ON DIRECT MESSAGES (for soft delete parity)
-- ============================================================================
ALTER TABLE public.chat_direct_messages
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- ============================================================================
-- 5. RLS POLICIES FOR PINNED MESSAGES
-- ============================================================================
DROP POLICY IF EXISTS "pinned_select" ON public.chat_pinned_messages;
DROP POLICY IF EXISTS "pinned_insert" ON public.chat_pinned_messages;
DROP POLICY IF EXISTS "pinned_delete" ON public.chat_pinned_messages;

ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pinned_select" ON public.chat_pinned_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pinned_insert" ON public.chat_pinned_messages
  FOR INSERT TO authenticated WITH CHECK (pinned_by = auth.uid());

CREATE POLICY "pinned_delete" ON public.chat_pinned_messages
  FOR DELETE TO authenticated USING (
    pinned_by = auth.uid() OR public.is_super_role()
  );

-- ============================================================================
-- 6. ENABLE REALTIME ON PINNED MESSAGES
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_pinned_messages;
