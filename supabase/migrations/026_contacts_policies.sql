-- MIGRATION 026: CONTACT NETWORK POLICIES
-- Add RLS policies for contact_network table

-- Enable RLS (just in case it wasn't enabled)
ALTER TABLE public.contact_network ENABLE ROW LEVEL SECURITY;

-- Super Admin Full Access
DROP POLICY IF EXISTS "Super Admins access to any contact" ON public.contact_network;
CREATE POLICY "Super Admins access to any contact" 
ON public.contact_network 
FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
);

-- Staff can view contacts in their office or global (office_id IS NULL)
DROP POLICY IF EXISTS "Staff can view own office and global contacts" ON public.contact_network;
CREATE POLICY "Staff can view own office and global contacts" 
ON public.contact_network 
FOR SELECT 
TO authenticated 
USING (
  office_id = (SELECT office_id FROM users WHERE id = auth.uid()) 
  OR 
  office_id IS NULL
);

-- Staff can add contacts to their own office or global
DROP POLICY IF EXISTS "Staff can add contacts" ON public.contact_network;
CREATE POLICY "Staff can add contacts" 
ON public.contact_network 
FOR INSERT 
TO authenticated 
WITH CHECK (
  office_id = (SELECT office_id FROM users WHERE id = auth.uid())
  OR
  office_id IS NULL
);

-- Staff can update contacts in their own office or global
DROP POLICY IF EXISTS "Staff can update contacts" ON public.contact_network;
CREATE POLICY "Staff can update contacts" 
ON public.contact_network 
FOR UPDATE
TO authenticated 
USING (
  office_id = (SELECT office_id FROM users WHERE id = auth.uid())
  OR
  office_id IS NULL
);
