-- 1) Fix friendships privilege escalation: drop overly broad UPDATE policy
DROP POLICY IF EXISTS "Envolvidos podem atualizar amizade" ON public.friendships;

-- 2) Add INSERT policy on order_items restricted to owner of the referenced order
DROP POLICY IF EXISTS "Users can insert items into their own orders" ON public.order_items;
CREATE POLICY "Users can insert items into their own orders"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.user_id = auth.uid()
  )
);

-- 3) Allow users to update and delete their own orders
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
CREATE POLICY "Users can delete their own orders"
ON public.orders
FOR DELETE
TO authenticated
USING (user_id = auth.uid());