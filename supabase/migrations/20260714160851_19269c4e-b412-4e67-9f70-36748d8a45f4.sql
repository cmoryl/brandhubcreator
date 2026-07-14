
-- 1. Tighten realtime.messages: remove permissive broadcast/presence access.
DROP POLICY IF EXISTS "Authenticated users can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send realtime messages" ON realtime.messages;
-- No replacement: app uses postgres_changes (replication-based), not Broadcast/Presence.
-- Without policies, RLS fails closed for realtime.messages. postgres_changes subscriptions
-- continue to work because they rely on table-level RLS, not realtime.messages.

-- 2. Restrict backup_jobs SELECT to org admins only (was: any org member).
DROP POLICY IF EXISTS "Organization members can view their backup jobs" ON public.backup_jobs;
CREATE POLICY "Organization admins can view backup jobs"
ON public.backup_jobs
FOR SELECT
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Add explicit admin-only policy for canva_oauth_tokens (currently zero policies; RLS fails closed but be explicit).
CREATE POLICY "Only super admins can access canva oauth tokens"
ON public.canva_oauth_tokens
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
