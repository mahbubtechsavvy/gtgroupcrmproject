-- 047_chat_muting_and_prefs.sql
-- Adding mute functionality and fine-grained notification preferences.

-- 1. Add mute columns to members and conversations
ALTER TABLE public.chat_group_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS is_muted_a BOOLEAN DEFAULT false;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS is_muted_b BOOLEAN DEFAULT false;

-- 2. Add notification preferences if not already robust
-- (chat_user_preferences already exists from 041)

-- 3. Function to check if a user should receive a notification for a specific channel
CREATE OR REPLACE FUNCTION public.should_notify_user(p_user_id UUID, p_group_id UUID, p_conversation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_muted BOOLEAN;
BEGIN
    IF p_group_id IS NOT NULL THEN
        SELECT is_muted INTO v_is_muted FROM public.chat_group_members 
        WHERE group_id = p_group_id AND user_id = p_user_id;
    ELSIF p_conversation_id IS NOT NULL THEN
        SELECT CASE 
            WHEN participant_a = p_user_id THEN is_muted_a 
            ELSE is_muted_b 
        END INTO v_is_muted 
        FROM public.chat_conversations 
        WHERE id = p_conversation_id;
    END IF;
    
    RETURN NOT COALESCE(v_is_muted, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the trigger or API logic that creates notifications to use this check
-- For now, we'll implement the check in the API routes.
