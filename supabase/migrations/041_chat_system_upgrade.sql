-- 041_chat_system_upgrade.sql
-- Consolidated Chat System Migration
-- This migration upgrades the existing basic chat to a full enterprise-grade system.
-- Includes: DMs, Groups, Read Receipts, Presence, Translations, Notifications, and RLS.

-- ============================================================================
-- 1. HELPER FUNCTIONS
-- ============================================================================

-- Check if user has super admin roles
CREATE OR REPLACE FUNCTION public.is_super_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ceo', 'coo', 'it_manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a member of a conversation (DM or Group)
CREATE OR REPLACE FUNCTION public.is_chat_member(p_conversation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE id = p_conversation_id
    AND (participant_a = auth.uid() OR participant_b = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = (SELECT group_id FROM public.chat_conversations WHERE id = p_conversation_id)
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = p_group_id
    AND user_id = auth.uid()
    AND role = 'admin'
  ) OR public.is_super_role();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unified member/admin check for general use
CREATE OR REPLACE FUNCTION public.is_chat_member_or_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = p_user_id OR public.is_super_role();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. SCHEMA UPGRADES
-- ============================================================================

-- Extend chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','file','image','system','status')),
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id),
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- Extend chat_groups
ALTER TABLE public.chat_groups
  ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'office' CHECK (group_type IN ('office','department','country','agency','general','custom')),
  ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id),
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- ============================================================================
-- 3. NEW TABLES
-- ============================================================================

-- 1. Private DM conversations (1-to-1)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE, -- If this conversation belongs to a group
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES public.users(id),
  group_settings JSONB DEFAULT '{}',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_a, participant_b)
);

-- 2. Direct messages (Backwards compatibility or specific DM store)
-- Note: It's better to unify, but we'll follow the plan's separation if needed.
CREATE TABLE IF NOT EXISTS public.chat_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','file','image','system','status')),
  reply_to_id UUID REFERENCES public.chat_direct_messages(id),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Read receipts
CREATE TABLE IF NOT EXISTS public.chat_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  dm_message_id UUID REFERENCES public.chat_direct_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_or_other CHECK (
    (message_id IS NOT NULL AND dm_message_id IS NULL) OR
    (message_id IS NULL AND dm_message_id IS NOT NULL)
  )
);

-- 4. File attachments
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  dm_message_id UUID REFERENCES public.chat_direct_messages(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.users(id),
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  thumbnail_url TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. User presence
CREATE TABLE IF NOT EXISTS public.chat_presence (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online','away','busy','offline')),
  last_seen TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ DEFAULT now(),
  is_typing_in UUID REFERENCES public.chat_groups(id),
  typing_in_conversation UUID REFERENCES public.chat_conversations(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Translation cache
CREATE TABLE IF NOT EXISTS public.chat_message_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  dm_message_id UUID REFERENCES public.chat_direct_messages(id) ON DELETE CASCADE,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  translation_engine TEXT DEFAULT 'google',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (message_id, target_language),
  UNIQUE NULLS NOT DISTINCT (dm_message_id, target_language)
);

-- 7. User language preferences
CREATE TABLE IF NOT EXISTS public.chat_user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  auto_translate BOOLEAN DEFAULT false,
  auto_translate_from TEXT[] DEFAULT '{}',
  notification_sound BOOLEAN DEFAULT true,
  desktop_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Chat notifications
CREATE TABLE IF NOT EXISTS public.chat_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id),
  conversation_id UUID REFERENCES public.chat_conversations(id),
  group_id UUID REFERENCES public.chat_groups(id),
  type TEXT NOT NULL CHECK (type IN ('new_message','mention','reaction','group_invite','announcement','new_direct_message')),
  message_preview TEXT,
  sender_name TEXT,
  is_read BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Pinned messages
CREATE TABLE IF NOT EXISTS public.chat_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  dm_message_id UUID REFERENCES public.chat_direct_messages(id) ON DELETE CASCADE,
  pinned_by UUID REFERENCES public.users(id),
  pinned_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT pin_one_or_other CHECK (
    (group_id IS NOT NULL AND conversation_id IS NULL) OR
    (group_id IS NULL AND conversation_id IS NOT NULL)
  )
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chat_messages_group_time ON public.chat_messages(group_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_chat_dm_conv_time ON public.chat_direct_messages(conversation_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_chat_notifications_recipient ON public.chat_notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_fts ON public.chat_messages USING gin(to_tsvector('english', content));

-- ============================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update conversation metadata on new message
CREATE OR REPLACE FUNCTION public.update_conversation_meta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_meta
  AFTER INSERT ON public.chat_direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_meta();

-- Auto-provision chat profile for new users
CREATE OR REPLACE FUNCTION public.auto_provision_chat_profile()
RETURNS TRIGGER AS $$
DECLARE
  general_group_id UUID;
  office_group_id UUID;
BEGIN
  INSERT INTO public.chat_user_preferences (user_id, preferred_language)
  VALUES (NEW.id, 'en') ON CONFLICT DO NOTHING;

  SELECT id INTO general_group_id FROM public.chat_groups WHERE is_general = true LIMIT 1;
  IF general_group_id IS NOT NULL THEN
    INSERT INTO public.chat_group_members (group_id, user_id)
    VALUES (general_group_id, NEW.id) ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO office_group_id FROM public.chat_groups WHERE office_id = NEW.office_id LIMIT 1;
  IF office_group_id IS NOT NULL THEN
    INSERT INTO public.chat_group_members (group_id, user_id)
    VALUES (office_group_id, NEW.id) ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.chat_presence (user_id, status)
  VALUES (NEW.id, 'offline') ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_provision_chat ON public.users;
CREATE TRIGGER trigger_auto_provision_chat
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_provision_chat_profile();

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: only participants can see/use their DMs
DROP POLICY IF EXISTS "chat_conv_select" ON public.chat_conversations;
CREATE POLICY "chat_conv_select" ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (participant_a = auth.uid() OR participant_b = auth.uid() OR public.is_super_role());

DROP POLICY IF EXISTS "chat_conv_insert" ON public.chat_conversations;
CREATE POLICY "chat_conv_insert" ON public.chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());

-- Direct Messages: only conversation participants
DROP POLICY IF EXISTS "chat_dm_select" ON public.chat_direct_messages;
CREATE POLICY "chat_dm_select" ON public.chat_direct_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND (participant_a = auth.uid() OR participant_b = auth.uid())) OR public.is_super_role());

DROP POLICY IF EXISTS "chat_dm_insert" ON public.chat_direct_messages;
CREATE POLICY "chat_dm_insert" ON public.chat_direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Notifications: users see only their own
DROP POLICY IF EXISTS "chat_notif_select" ON public.chat_notifications;
CREATE POLICY "chat_notif_select" ON public.chat_notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid() OR public.is_super_role());

-- Presence: everyone can see, only own can update
DROP POLICY IF EXISTS "chat_presence_select" ON public.chat_presence;
CREATE POLICY "chat_presence_select" ON public.chat_presence
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "chat_presence_upsert" ON public.chat_presence;
CREATE POLICY "chat_presence_upsert" ON public.chat_presence
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Storage Policies (Summary)
-- Bucket: chat-attachments
-- Auth users can upload.
-- Auth users can download if they are in the group or conversation.
