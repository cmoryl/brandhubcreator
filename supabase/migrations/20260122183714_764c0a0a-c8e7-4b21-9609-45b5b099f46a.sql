-- Fix audit_logs IP exposure: restrict access so users can only view their own audit logs
-- Admins retain access to all logs via the existing policy

-- Drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

-- Create policy: Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));