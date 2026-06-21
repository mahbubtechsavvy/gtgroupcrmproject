-- Execute this in the Supabase SQL Editor to create the Global Chat & Announcements tables

CREATE TABLE IF NOT EXISTS public.global_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'info', -- 'info', 'warning', 'urgent'
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_general BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_group_members (
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure a default 'General' group exists for the entire company
INSERT INTO public.chat_groups (name, description, is_general) 
VALUES ('Global General Chat', 'Company-wide communication for all GT Group staff.', true)
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE public.global_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated to read announcements" ON public.global_announcements;
CREATE POLICY "Allow all authenticated to read announcements" ON public.global_announcements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all authenticated to insert announcements" ON public.global_announcements;
CREATE POLICY "Allow all authenticated to insert announcements" ON public.global_announcements FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated to read groups" ON public.chat_groups;
CREATE POLICY "Allow all authenticated to read groups" ON public.chat_groups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all authenticated to insert groups" ON public.chat_groups;
CREATE POLICY "Allow all authenticated to insert groups" ON public.chat_groups FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated to read members" ON public.chat_group_members;
CREATE POLICY "Allow all authenticated to read members" ON public.chat_group_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all authenticated to insert members" ON public.chat_group_members;
CREATE POLICY "Allow all authenticated to insert members" ON public.chat_group_members FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated to read messages" ON public.chat_messages;
CREATE POLICY "Allow all authenticated to read messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all authenticated to insert messages" ON public.chat_messages;
CREATE POLICY "Allow all authenticated to insert messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);
