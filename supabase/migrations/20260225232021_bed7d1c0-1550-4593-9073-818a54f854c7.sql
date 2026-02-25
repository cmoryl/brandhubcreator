
-- Create a function to update the scheduled-intelligence cron cadence
-- Supports: 'daily', 'weekly', 'biweekly', 'monthly'
CREATE OR REPLACE FUNCTION public.update_intelligence_cadence(p_cadence text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_schedule text;
  v_job_exists boolean;
BEGIN
  -- Only admins/super_admins can change cadence
  IF NOT (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Map cadence to cron expression
  CASE p_cadence
    WHEN 'daily' THEN v_schedule := '0 9 * * *';        -- Every day at 9 AM
    WHEN 'weekly' THEN v_schedule := '0 9 * * 1';       -- Every Monday at 9 AM
    WHEN 'biweekly' THEN v_schedule := '0 9 1,15 * *';  -- 1st and 15th at 9 AM
    WHEN 'monthly' THEN v_schedule := '0 9 1 * *';      -- 1st of month at 9 AM
    ELSE RAISE EXCEPTION 'Invalid cadence: %. Use daily, weekly, biweekly, or monthly', p_cadence;
  END CASE;

  -- Check if the job exists
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'monthly-intelligence-automation'
  ) INTO v_job_exists;

  IF v_job_exists THEN
    -- Update existing job schedule
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 'monthly-intelligence-automation'),
      schedule := v_schedule
    );
  END IF;

  RETURN true;
END;
$$;

-- Create a function to get current cadence
CREATE OR REPLACE FUNCTION public.get_intelligence_cadence()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_schedule text;
BEGIN
  SELECT schedule INTO v_schedule
  FROM cron.job
  WHERE jobname = 'monthly-intelligence-automation'
  LIMIT 1;

  IF v_schedule IS NULL THEN
    RETURN 'monthly';
  END IF;

  -- Map cron expression back to cadence label
  CASE v_schedule
    WHEN '0 9 * * *' THEN RETURN 'daily';
    WHEN '0 9 * * 1' THEN RETURN 'weekly';
    WHEN '0 9 1,15 * *' THEN RETURN 'biweekly';
    WHEN '0 9 1 * *' THEN RETURN 'monthly';
    ELSE RETURN 'custom';
  END CASE;
END;
$$;
