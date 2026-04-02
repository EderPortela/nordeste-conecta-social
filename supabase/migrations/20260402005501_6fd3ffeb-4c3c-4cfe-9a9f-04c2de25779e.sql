
-- 1. Fix conversation_participants INSERT: only add yourself
DROP POLICY IF EXISTS "Autenticados adicionam participantes" ON public.conversation_participants;
CREATE POLICY "Autenticados adicionam participantes"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Fix notifications INSERT: only create notifications where actor is yourself
DROP POLICY IF EXISTS "Sistema cria notificações" ON public.notifications;
CREATE POLICY "Sistema cria notificações"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- 3. Fix user_badges INSERT: restrict to service role only (security definer functions handle this)
DROP POLICY IF EXISTS "Sistema pode criar badges" ON public.user_badges;
CREATE POLICY "Sistema pode criar badges"
ON public.user_badges
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 4. Fix user_xp INSERT: restrict to service role only (add_user_xp function handles this)
DROP POLICY IF EXISTS "Sistema pode criar XP" ON public.user_xp;
CREATE POLICY "Sistema pode criar XP"
ON public.user_xp
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 5. Fix user_xp UPDATE: restrict to service role only (add_user_xp function handles this)
DROP POLICY IF EXISTS "Sistema pode atualizar XP" ON public.user_xp;
CREATE POLICY "Sistema pode atualizar XP"
ON public.user_xp
FOR UPDATE
TO authenticated
USING (false);
