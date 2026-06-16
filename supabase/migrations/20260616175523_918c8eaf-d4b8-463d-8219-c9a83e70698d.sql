CREATE POLICY "Users can update their own chat recordings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-recordings' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'chat-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);