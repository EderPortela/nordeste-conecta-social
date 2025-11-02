-- =======================
-- FASE 1: PERFIS DE USUÁRIO
-- =======================

-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profiles
CREATE POLICY "Perfis são visíveis para todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar perfil ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =======================
-- FASE 2: POSTS E FEED
-- =======================

-- Criar tabela de posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) > 0 AND char_length(content) <= 5000)
);

-- Índices para performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_hashtags ON public.posts USING GIN(hashtags);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies para posts
CREATE POLICY "Posts são visíveis para todos"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at em posts
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tabela de curtidas (likes)
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- Enable RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para likes
CREATE POLICY "Likes são visíveis para todos"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem curtir posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover suas próprias curtidas"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Tabela de comentários
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT comment_length CHECK (char_length(content) > 0 AND char_length(content) <= 1000)
);

-- Índices para performance
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para comentários
CREATE POLICY "Comentários são visíveis para todos"
  ON public.post_comments FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem comentar"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios comentários"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at em comentários
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- View para posts com contagem de likes e comentários
CREATE OR REPLACE VIEW public.posts_with_stats AS
SELECT 
  p.*,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  COALESCE(l.like_count, 0) AS like_count,
  COALESCE(c.comment_count, 0) AS comment_count
FROM public.posts p
LEFT JOIN public.profiles pr ON p.user_id = pr.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as like_count
  FROM public.post_likes
  GROUP BY post_id
) l ON p.id = l.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as comment_count
  FROM public.post_comments
  GROUP BY post_id
) c ON p.id = c.post_id
ORDER BY p.created_at DESC;