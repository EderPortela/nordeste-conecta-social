-- Stories table for StoriesBar
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories visíveis para todos" 
  ON public.stories FOR SELECT 
  USING (true);

CREATE POLICY "Usuário cria seus stories" 
  ON public.stories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário remove seus stories" 
  ON public.stories FOR DELETE 
  USING (auth.uid() = user_id);

-- Story views table used by StoryViewer
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visualizações de stories visíveis para criador e próprio viewer" 
  ON public.story_views FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s 
      WHERE s.id = story_views.story_id 
      AND (s.user_id = auth.uid() OR story_views.viewer_id = auth.uid())
    )
  );

CREATE POLICY "Usuário registra suas visualizações" 
  ON public.story_views FOR INSERT 
  WITH CHECK (auth.uid() = viewer_id);

-- View combining stories with profile data used by StoriesBar
CREATE OR REPLACE VIEW public.stories_with_user AS
SELECT 
  s.id,
  s.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  s.media_url,
  s.media_type,
  s.created_at,
  COUNT(DISTINCT sv.viewer_id) AS view_count
FROM public.stories s
JOIN public.profiles p ON p.id = s.user_id
LEFT JOIN public.story_views sv ON sv.story_id = s.id
GROUP BY s.id, s.user_id, p.username, p.display_name, p.avatar_url, s.media_url, s.media_type, s.created_at;

-- Post reactions table for ReactionPicker
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reações visíveis para todos" 
  ON public.post_reactions FOR SELECT 
  USING (true);

CREATE POLICY "Usuário cria/atualiza suas reações" 
  ON public.post_reactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário remove suas reações" 
  ON public.post_reactions FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza suas reações" 
  ON public.post_reactions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Storage bucket for stories media
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to stories bucket
CREATE POLICY "Stories públicos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'stories');

-- Allow authenticated users to upload to their own folder in stories bucket
CREATE POLICY "Usuário faz upload de stories" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'stories'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update/delete their own stories objects
CREATE POLICY "Usuário atualiza/remover stories" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'stories'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuário remove stories" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'stories'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );