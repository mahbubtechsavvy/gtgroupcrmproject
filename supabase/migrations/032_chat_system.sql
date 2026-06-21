-- Migration 032: GT Group Chat & Announcements System
-- Purpose: Real-time internal communication hub for staff

-- 1. Chat Groups (Channels)
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_general BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table already existed from other migrations
ALTER TABLE IF EXISTS public.chat_groups ADD COLUMN IF NOT EXISTS is_general BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.chat_groups ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Global Announcements (Bulletins)
CREATE TABLE IF NOT EXISTS public.global_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'warning', 'urgent')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_announcements ENABLE ROW LEVEL SECURITY;

-- 5. Basic Policies (All authenticated users can read/write for now)
-- In a real production app, we'd restrict by roles, but for the MVP 2.0:

DROP POLICY IF EXISTS "Allow all authenticated to select groups" ON public.chat_groups;
CREATE POLICY "Allow all authenticated to select groups" ON public.chat_groups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all authenticated to insert messages" ON public.chat_messages;
CREATE POLICY "Allow all authenticated to insert messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated to select messages" ON public.chat_messages;
CREATE POLICY "Allow all authenticated to select messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all authenticated to select announcements" ON public.global_announcements;
CREATE POLICY "Allow all authenticated to select announcements" ON public.global_announcements FOR SELECT TO authenticated USING (true);

-- Only managers/admins can post announcements
DROP POLICY IF EXISTS "Allow admins to insert announcements" ON public.global_announcements;
CREATE POLICY "Allow admins to insert announcements" ON public.global_announcements 
FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('ceo', 'coo', 'it_manager', 'branch_manager')
    )
);

-- 6. Enable Realtime
-- Use a safe way to add tables to publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'global_announcements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.global_announcements;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Publication might not exist or other issues, log or ignore
        RAISE NOTICE 'Could not add to publication: %', SQLERRM;
END $$;

-- 7. Initial Data
INSERT INTO public.chat_groups (name, is_general) 
VALUES ('Global General Chat', true)
ON CONFLICT DO NOTHING;
