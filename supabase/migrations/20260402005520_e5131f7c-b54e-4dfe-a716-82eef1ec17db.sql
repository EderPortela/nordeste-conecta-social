
-- Fix conversations INSERT: require authenticated user
DROP POLICY IF EXISTS "Autenticados criam conversas" ON public.conversations;
CREATE POLICY "Autenticados criam conversas"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
