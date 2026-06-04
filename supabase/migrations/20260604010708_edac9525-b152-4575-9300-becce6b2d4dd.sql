
-- 1. Drop overly broad SELECT policies on storage.objects (public buckets still serve files via CDN URL)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Stories públicos" ON storage.objects;
DROP POLICY IF EXISTS "Public read posts" ON storage.objects;

-- 2. Revoke EXECUTE on internal trigger functions from anon/authenticated/public
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

-- 3. Restrict helper SECURITY DEFINER functions to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_user_xp(uuid, integer) FROM PUBLIC, anon;
