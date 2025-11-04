-- Create followers table
CREATE TABLE public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followers
CREATE POLICY "Seguidores são visíveis para todos"
  ON public.followers
  FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem seguir outros"
  ON public.followers
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Usuários podem parar de seguir"
  ON public.followers
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Create index for better performance
CREATE INDEX idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX idx_followers_following_id ON public.followers(following_id);

-- Create view for follower stats
CREATE OR REPLACE VIEW public.profile_stats AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.location,
  p.created_at,
  p.updated_at,
  COALESCE(followers.count, 0) as followers_count,
  COALESCE(following.count, 0) as following_count,
  COALESCE(posts.count, 0) as posts_count
FROM public.profiles p
LEFT JOIN (
  SELECT following_id, COUNT(*) as count
  FROM public.followers
  GROUP BY following_id
) followers ON p.id = followers.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count
  FROM public.followers
  GROUP BY follower_id
) following ON p.id = following.follower_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM public.posts
  GROUP BY user_id
) posts ON p.id = posts.user_id;