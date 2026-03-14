-- Fix security definer views by adding security_invoker
ALTER VIEW public.posts_with_stats SET (security_invoker = on);
ALTER VIEW public.profile_stats SET (security_invoker = on);
ALTER VIEW public.communities_with_stats SET (security_invoker = on);
ALTER VIEW public.products_with_seller SET (security_invoker = on);
ALTER VIEW public.stories_with_user SET (security_invoker = on);