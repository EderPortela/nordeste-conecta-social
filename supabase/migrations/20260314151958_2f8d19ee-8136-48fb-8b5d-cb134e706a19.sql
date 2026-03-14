-- Add video_url to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url text;

-- Drop and recreate posts_with_stats view to include video_url
DROP VIEW IF EXISTS public.posts_with_stats;

CREATE VIEW public.posts_with_stats AS
SELECT 
  p.id,
  p.user_id,
  p.content,
  p.image_url,
  p.video_url,
  p.hashtags,
  p.created_at,
  p.updated_at,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  COALESCE(l.like_count, 0::bigint) AS like_count,
  COALESCE(c.comment_count, 0::bigint) AS comment_count
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS like_count FROM post_likes GROUP BY post_id
) l ON p.id = l.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count FROM post_comments GROUP BY post_id
) c ON p.id = c.post_id;

-- Create posts storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can read posts media
CREATE POLICY "Public read posts" ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- Storage policy: authenticated users can upload to their own folder
CREATE POLICY "Auth users upload posts" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policy: users can delete their own uploads
CREATE POLICY "Users delete own posts media" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);