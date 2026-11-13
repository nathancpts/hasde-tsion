DROP POLICY IF EXISTS "Anyone can register a device for notifications" ON public.push_subscriptions;

CREATE POLICY "Anyone can register a valid device for notifications"
ON public.push_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND endpoint ~ '^https://'
  AND char_length(endpoint) <= 2048
  AND char_length(p256dh) BETWEEN 1 AND 255
  AND char_length(auth) BETWEEN 1 AND 255
  AND (user_agent IS NULL OR char_length(user_agent) <= 512)
);