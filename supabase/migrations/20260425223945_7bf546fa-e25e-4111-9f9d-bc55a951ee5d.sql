-- Countries
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  region TEXT,
  iso_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view countries"
  ON public.countries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert countries"
  ON public.countries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update countries"
  ON public.countries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete countries"
  ON public.countries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Jobs added by admins
CREATE TABLE IF NOT EXISTS public.admin_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  wage_range TEXT NOT NULL,
  employer_contact TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.admin_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view admin jobs"
  ON public.admin_jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert admin jobs"
  ON public.admin_jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin jobs"
  ON public.admin_jobs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin jobs"
  ON public.admin_jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_admin_jobs_country ON public.admin_jobs(country);
CREATE INDEX IF NOT EXISTS idx_admin_jobs_category ON public.admin_jobs(category);