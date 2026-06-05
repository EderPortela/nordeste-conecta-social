
-- Fix 1: Restrict friendships UPDATE so only the addressee can change status; requester can only cancel pending
DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships" ON public.friendships;
DROP POLICY IF EXISTS "friendships_update" ON public.friendships;

CREATE POLICY "Addressee can update friendship status"
ON public.friendships
FOR UPDATE
TO authenticated
USING (auth.uid() = addressee_id)
WITH CHECK (auth.uid() = addressee_id);

CREATE POLICY "Requester can cancel pending friendship"
ON public.friendships
FOR UPDATE
TO authenticated
USING (auth.uid() = requester_id AND status = 'pending')
WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- Fix 2: Owner-scoped SELECT policies on storage.objects for public buckets
-- Files remain accessible via public CDN URLs, but listing/enumeration is restricted to owner
DROP POLICY IF EXISTS "Owners can list their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owners can list their covers" ON storage.objects;
DROP POLICY IF EXISTS "Owners can list their stories" ON storage.objects;
DROP POLICY IF EXISTS "Owners can list their posts" ON storage.objects;

CREATE POLICY "Owners can list their avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can list their covers"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can list their stories"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can list their posts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
