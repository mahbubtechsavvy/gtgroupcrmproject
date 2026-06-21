-- ==============================================================================
-- GT GROUP CRM V2.0 - 200x ADVANCE STRUCTURAL FOUNDATION
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. Update Users Table for Multi-Company Affiliation
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS affiliated_companies TEXT[] DEFAULT '{study_abroad}';

COMMENT ON COLUMN public.users.affiliated_companies IS 'Array of companies the staff member is affiliated with (nexus, study_abroad)';

-- 2. Update Contact Network for Multi-Company Hub
ALTER TABLE IF EXISTS public.contact_network
ADD COLUMN IF NOT EXISTS affiliated_companies TEXT[] DEFAULT '{main}';

-- 3. Add Website Type to CMS Tables for Consolidation
ALTER TABLE IF EXISTS public.news_posts ADD COLUMN IF NOT EXISTS website_type TEXT DEFAULT 'study_abroad' CHECK (website_type IN ('nexus', 'main', 'study_abroad'));
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS website_type TEXT DEFAULT 'study_abroad' CHECK (website_type IN ('nexus', 'main', 'study_abroad'));
ALTER TABLE IF EXISTS public.testimonials ADD COLUMN IF NOT EXISTS website_type TEXT DEFAULT 'study_abroad' CHECK (website_type IN ('nexus', 'main', 'study_abroad'));
ALTER TABLE IF EXISTS public.website_courses ADD COLUMN IF NOT EXISTS website_type TEXT DEFAULT 'study_abroad' CHECK (website_type IN ('nexus', 'main', 'study_abroad'));
ALTER TABLE IF EXISTS public.team_members ADD COLUMN IF NOT EXISTS affiliated_companies TEXT[] DEFAULT '{study_abroad}';

-- 4. Create separate categories for Courses to solve the "2 Courses" confusion
ALTER TABLE IF EXISTS public.website_courses ADD COLUMN IF NOT EXISTS course_category TEXT DEFAULT 'academic' CHECK (course_category IN ('academic', 'professional', 'nexus_training'));

-- 5. Nexus Project Management Table (Full Lifecycle)
CREATE TABLE IF NOT EXISTS public.nexus_project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES nexus_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Internal Announcements System
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    target_companies TEXT[] DEFAULT '{main}', -- Which company staff should see this
    created_by UUID REFERENCES public.users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to select announcements" ON public.announcements;
CREATE POLICY "Allow authenticated to select announcements" ON public.announcements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow super admins to manage announcements" ON public.announcements;
CREATE POLICY "Allow super admins to manage announcements" ON public.announcements FOR ALL TO authenticated USING (is_super_admin());

-- 7. Real-time Internal Chat Groups
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure is_private column exists if table already existed
ALTER TABLE IF EXISTS public.chat_groups ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.chat_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_announcement BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure is_announcement column exists if table already existed
ALTER TABLE IF EXISTS public.chat_messages ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT false;

-- Enable RLS for Chat
ALTER TABLE IF EXISTS public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see groups they belong to" ON public.chat_groups;
CREATE POLICY "Users can see groups they belong to" ON public.chat_groups FOR SELECT USING (
    id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()) OR is_private = false
);

DROP POLICY IF EXISTS "Users can see messages in their groups" ON public.chat_messages;
CREATE POLICY "Users can see messages in their groups" ON public.chat_messages FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND 
    group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid())
);
