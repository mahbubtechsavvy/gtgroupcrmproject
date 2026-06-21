-- 044_chat_unread_functions.sql
-- RPC functions to efficiently calculate unread message counts per user.

-- 1. Unread counts for Groups
CREATE OR REPLACE FUNCTION public.get_unread_group_counts(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(group_id, unread_count)
  INTO result
  FROM (
    SELECT 
      m.group_id, 
      COUNT(m.id) as unread_count
    FROM public.chat_messages m
    JOIN public.chat_group_members gm ON m.group_id = gm.group_id
    LEFT JOIN public.chat_message_reads r ON m.id = r.message_id AND r.user_id = p_user_id
    WHERE gm.user_id = p_user_id
      AND m.sender_id != p_user_id
      AND m.is_deleted = false
      AND r.id IS NULL
    GROUP BY m.group_id
  ) s;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Unread counts for DMs
CREATE OR REPLACE FUNCTION public.get_unread_dm_counts(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(conversation_id, unread_count)
  INTO result
  FROM (
    SELECT 
      m.conversation_id, 
      COUNT(m.id) as unread_count
    FROM public.chat_direct_messages m
    JOIN public.chat_conversations c ON m.conversation_id = c.id
    LEFT JOIN public.chat_message_reads r ON m.id = r.dm_message_id AND r.user_id = p_user_id
    WHERE (c.participant_a = p_user_id OR c.participant_b = p_user_id)
      AND m.sender_id != p_user_id
      AND m.is_deleted = false
      AND r.id IS NULL
    GROUP BY m.conversation_id
  ) s;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Mark Group messages as read
CREATE OR REPLACE FUNCTION public.mark_group_messages_as_read(p_group_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.chat_message_reads (message_id, user_id)
  SELECT m.id, p_user_id
  FROM public.chat_messages m
  LEFT JOIN public.chat_message_reads r ON m.id = r.message_id AND r.user_id = p_user_id
  WHERE m.group_id = p_group_id
    AND m.sender_id != p_user_id
    AND r.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Mark DM messages as read
CREATE OR REPLACE FUNCTION public.mark_dm_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.chat_message_reads (dm_message_id, user_id)
  SELECT m.id, p_user_id
  FROM public.chat_direct_messages m
  LEFT JOIN public.chat_message_reads r ON m.id = r.dm_message_id AND r.user_id = p_user_id
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND r.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
