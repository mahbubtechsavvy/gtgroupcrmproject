-- MIGRATION 024: SMART CRM FEATURES & NEW MODULES
-- Purpose: Implementation of Notebook Plan + User Feedback (Employee IDs, Templates, HR, Inventory, Expenses)

-- 1. EXTEND USERS FOR SMART IDENTITY
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;

COMMENT ON COLUMN public.users.employee_id IS 'Unique 8-digit random ID generated on user creation';

-- 2. EMAIL TEMPLATE SYSTEM (Like Supabase UI)
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT UNIQUE NOT NULL, -- e.g., 'event_invitation', 'leave_approval'
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL, -- Source code / HTML
    preview_text TEXT,
    placeholders JSONB DEFAULT '[]', -- List of available variables like {{student_name}}
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. HR MODULE: WORK SCHEDULE & ATTENDANCE
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.users(id),
    office_id UUID REFERENCES public.offices(id),
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday')),
    check_in TIME,
    check_out TIME,
    overtime_hours NUMERIC DEFAULT 0,
    notes TEXT, -- User placeholders: "e.g. Completed late documentation for Student ID 102"
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CONTACT NETWORK (Enhanced)
CREATE TABLE IF NOT EXISTS public.contact_network (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    employee_id TEXT,
    phone TEXT,
    date_of_birth DATE,
    email TEXT,
    office_name TEXT,
    company_name TEXT,
    role TEXT,
    country TEXT,
    nid_or_passport TEXT,
    company_logo_url TEXT,
    photo_url TEXT,
    linkedin_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_x_url TEXT,
    whatsapp TEXT,
    notes TEXT,
    office_id UUID REFERENCES public.offices(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INVENTORY MANAGEMENT (Restricted)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID REFERENCES public.offices(id),
    item_name TEXT NOT NULL, -- Placeholder: "e.g. Dell Monitor 24 inch"
    specification TEXT,    -- Placeholder: "e.g. Model P2422H, 1080p"
    quantity INTEGER DEFAULT 1,
    purchase_date DATE,
    purchase_price NUMERIC,
    currency TEXT DEFAULT 'USD',
    item_location TEXT,   -- Placeholder: "e.g. Front Desk, Bangladesh Office"
    person_in_charge UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_repair', 'disposed', 'lost')),
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. VISITOR LOG
CREATE TABLE IF NOT EXISTS public.visitor_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID REFERENCES public.offices(id),
    visitor_name TEXT NOT NULL, -- Placeholder: "e.g. Mr. Mahbubur Rahman"
    visitor_contact TEXT,
    purpose TEXT NOT NULL,       -- Placeholder: "e.g. Interview for Study Visa"
    host_staff_id UUID REFERENCES public.users(id),
    check_in TIMESTAMPTZ DEFAULT now(),
    check_out TIMESTAMPTZ,
    notes TEXT,
    recorded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. EXPENSES & EXPENDITURE
CREATE TABLE IF NOT EXISTS public.expense_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID REFERENCES public.offices(id),
    report_month DATE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id), -- Super Admin approval
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    item_date DATE NOT NULL,
    details TEXT NOT NULL,       -- Placeholder: "e.g. New Office Stationery"
    specification TEXT,          -- Placeholder: "e.g. Pens, Paper, Staplers"
    income_amount NUMERIC DEFAULT 0,
    expense_amount NUMERIC DEFAULT 0,
    fund_user UUID REFERENCES public.users(id), -- The person who actually handled the money
    purpose TEXT NOT NULL,       -- Placeholder: "e.g. Office maintenance"
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. PERMISSIONS FOR NEW TABLES
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- 9. SUPER ADMIN FULL ACCESS POLICIES
-- Example for Visitor Log:
DROP POLICY IF EXISTS "Super Admins can do everything on visitors" ON public.visitor_log;
CREATE POLICY "Super Admins can do everything on visitors" 
ON public.visitor_log 
FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
);

-- Staff can add/view own office visitors
DROP POLICY IF EXISTS "Staff can view own office visitors" ON public.visitor_log;
CREATE POLICY "Staff can view own office visitors" 
ON public.visitor_log 
FOR SELECT 
TO authenticated 
USING (
  office_id = (SELECT office_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can add visitors" ON public.visitor_log;
CREATE POLICY "Staff can add visitors" 
ON public.visitor_log 
FOR INSERT 
TO authenticated 
WITH CHECK (
  office_id = (SELECT office_id FROM users WHERE id = auth.uid())
);

-- 10. AUTO-GENERATE 8-DIGIT EMPLOYEE ID
-- This function generates a random 8-digit number and checks for uniqueness
CREATE OR REPLACE FUNCTION generate_unique_employee_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
    exists_id BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 random digits (starts from 10,000,000 to ensure 8 digits)
        new_id := (floor(random() * 90000000) + 10000000)::TEXT;
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM public.users WHERE employee_id = new_id) INTO exists_id;
        
        -- Exit loop if unique
        IF NOT exists_id THEN
            NEW.employee_id := new_id;
            EXIT;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before any new user is inserted
DROP TRIGGER IF EXISTS tr_generate_employee_id ON public.users;
CREATE TRIGGER tr_generate_employee_id
BEFORE INSERT ON public.users
FOR EACH ROW
WHEN (NEW.employee_id IS NULL)
EXECUTE FUNCTION generate_unique_employee_id();
