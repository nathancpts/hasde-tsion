CREATE TABLE public.parasha_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  nom text,
  nom_he text,
  intro text,
  blocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.parasha_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parasha_content TO authenticated;
GRANT ALL ON public.parasha_content TO service_role;

ALTER TABLE public.parasha_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read parasha content" ON public.parasha_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage parasha content" ON public.parasha_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER parasha_content_touch_updated_at
  BEFORE UPDATE ON public.parasha_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();