-- MIGRATION 025: EXPENDITURE PLANNING
CREATE TABLE IF NOT EXISTS public.expenditure_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID REFERENCES public.offices(id),
    plan_month DATE NOT NULL,
    total_requested_budget NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(office_id, plan_month)
);

CREATE TABLE IF NOT EXISTS public.expenditure_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.expenditure_plans(id) ON DELETE CASCADE,
    position_or_department TEXT, -- e.g. "Marketing", "Reception"
    purpose TEXT NOT NULL,       -- e.g. "Facebook Ad Run", "Water Filter Replacement"
    estimated_cost NUMERIC NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenditure_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenditure_plan_items ENABLE ROW LEVEL SECURITY;

-- Super Admin Full Access
CREATE POLICY "Super Admins access to any expenditure plan" ON public.expenditure_plans FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager'));
CREATE POLICY "Super Admins access to any expenditure item" ON public.expenditure_plan_items FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager'));

-- Office Managers access to own office plans
CREATE POLICY "Managers access own office expenditure" ON public.expenditure_plans FOR ALL TO authenticated USING (office_id = (SELECT office_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Managers access own office expenditure items" ON public.expenditure_plan_items FOR ALL TO authenticated 
USING (plan_id IN (SELECT id FROM public.expenditure_plans WHERE office_id = (SELECT office_id FROM users WHERE id = auth.uid())));
