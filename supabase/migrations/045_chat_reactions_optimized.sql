-- 045_chat_reactions_optimized.sql
-- Creating and optimizing chat_reactions for real-time performance.

CREATE TABLE IF NOT EXISTS public.chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    dm_message_id UUID REFERENCES public.chat_direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(message_id, user_id, emoji),
    UNIQUE(dm_message_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON public.chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_dm_message_id ON public.chat_reactions(dm_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_group_id ON public.chat_reactions(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_conversation_id ON public.chat_reactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user_id ON public.chat_reactions(user_id);

-- Enable RLS
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view reactions in their groups" ON public.chat_reactions;
CREATE POLICY "Users can view reactions in their groups" ON public.chat_reactions
    FOR SELECT TO authenticated
    USING (
        (message_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.chat_group_members 
            WHERE group_id = (SELECT group_id FROM public.chat_messages WHERE id = message_id)
            AND user_id = auth.uid()
        )) OR
        (dm_message_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE id = (SELECT conversation_id FROM public.chat_direct_messages WHERE id = dm_message_id)
            AND (participant_a = auth.uid() OR participant_b = auth.uid())
        ))
    );

DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.chat_reactions;
CREATE POLICY "Users can manage their own reactions" ON public.chat_reactions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
