-- Update notification visibility for Super Admins to see global broadcasts
DROP POLICY IF EXISTS "notifications_select" ON notifications;

CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    (is_super_admin() AND (metadata->>'is_broadcast')::boolean = true)
  );

-- Ensure Super Admins can insert records for any user (already exists in 007, but re-asserting)
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR user_id = auth.uid());
