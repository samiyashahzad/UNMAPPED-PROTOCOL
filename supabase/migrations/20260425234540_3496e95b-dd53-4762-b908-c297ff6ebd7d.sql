DROP POLICY IF EXISTS "Anyone authenticated can view admin jobs" ON public.admin_jobs;
CREATE POLICY "Anyone can view admin jobs"
ON public.admin_jobs
FOR SELECT
TO anon, authenticated
USING (true);