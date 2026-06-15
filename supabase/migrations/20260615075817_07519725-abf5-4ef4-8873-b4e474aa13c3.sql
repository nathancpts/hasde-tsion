
-- Fix linter: search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Lock SECURITY DEFINER trigger functions: only triggers (postgres) should call them
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage policies: avatars bucket
CREATE POLICY "Avatars readable by authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies: chat-recordings bucket
CREATE POLICY "Recordings readable by authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-recordings');

CREATE POLICY "Users upload own recording"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own recording"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
