
-- Restrict messages SELECT to owner
DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
CREATE POLICY "Users can read their own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Restrict profiles SELECT to self
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Restrict avatars SELECT to owner folder
DROP POLICY IF EXISTS "Avatars readable by authenticated" ON storage.objects;
CREATE POLICY "Users read own avatar"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- Restrict chat-recordings SELECT to owner folder
DROP POLICY IF EXISTS "Recordings readable by authenticated" ON storage.objects;
CREATE POLICY "Users read own recording"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-recordings' AND (storage.foldername(name))[1] = (auth.uid())::text);
