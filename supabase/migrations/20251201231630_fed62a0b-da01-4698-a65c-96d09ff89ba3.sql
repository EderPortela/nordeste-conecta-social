-- Create badge_type enum
CREATE TYPE badge_type AS ENUM (
  'primeiro_post',
  'contador_historias',
  'mestre_cordel',
  'anfitriao',
  'explorador',
  'influenciador'
);

-- Create communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  rules TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comunidades são visíveis para todos"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar comunidades"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Criadores podem atualizar suas comunidades"
  ON communities FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Criadores podem deletar suas comunidades"
  ON communities FOR DELETE
  USING (auth.uid() = creator_id);

-- Create community_members table
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS on community_members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros são visíveis para todos"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem entrar em comunidades"
  ON community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem sair de comunidades"
  ON community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  location TEXT,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos são visíveis para todos"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Vendedores podem criar produtos"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Vendedores podem atualizar seus produtos"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Vendedores podem deletar seus produtos"
  ON products FOR DELETE
  USING (auth.uid() = seller_id);

-- Create cart_items table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS on cart_items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seu próprio carrinho"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem adicionar ao carrinho"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu carrinho"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover de seu carrinho"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus próprios pedidos"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar pedidos"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem itens de seus pedidos"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create user_xp table
CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_xp
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "XP é visível para todos"
  ON user_xp FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode criar XP"
  ON user_xp FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar XP"
  ON user_xp FOR UPDATE
  USING (true);

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_type badge_type NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conquistas são visíveis para todos"
  ON achievements FOR SELECT
  USING (true);

-- Insert default achievements
INSERT INTO achievements (badge_type, name, description, icon, xp_reward) VALUES
  ('primeiro_post', 'Primeiro Post', 'Criou seu primeiro post', '🎉', 10),
  ('contador_historias', 'Contador de Histórias', 'Compartilhou 10 posts', '📖', 50),
  ('mestre_cordel', 'Mestre do Cordel', 'Recebeu 100 curtidas', '🎭', 100),
  ('anfitriao', 'Anfitrião', 'Criou uma comunidade', '🏠', 75),
  ('explorador', 'Explorador', 'Entrou em 5 comunidades', '🧭', 50),
  ('influenciador', 'Influenciador', 'Conquistou 100 seguidores', '⭐', 150);

-- Create user_badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  badge_type badge_type NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Enable RLS on user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges são visíveis para todos"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode criar badges"
  ON user_badges FOR INSERT
  WITH CHECK (true);

-- Create function to add XP
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp INTEGER)
RETURNS void AS $$
DECLARE
  v_current_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  INSERT INTO user_xp (user_id, total_xp, level)
  VALUES (p_user_id, p_xp, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_xp = user_xp.total_xp + p_xp,
    updated_at = now();
  
  SELECT total_xp INTO v_current_xp 
  FROM user_xp 
  WHERE user_id = p_user_id;
  
  v_new_level := FLOOR(v_current_xp / 100) + 1;
  
  UPDATE user_xp 
  SET level = v_new_level 
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create products_with_seller view
CREATE OR REPLACE VIEW products_with_seller AS
SELECT 
  p.*,
  pr.username as seller_username,
  pr.display_name as seller_name,
  pr.avatar_url as seller_avatar
FROM products p
LEFT JOIN profiles pr ON p.seller_id = pr.id;

-- Create communities_with_stats view
CREATE OR REPLACE VIEW communities_with_stats AS
SELECT 
  c.*,
  COUNT(DISTINCT cm.user_id) as member_count,
  pr.username as creator_username,
  pr.display_name as creator_name,
  pr.avatar_url as creator_avatar
FROM communities c
LEFT JOIN community_members cm ON c.id = cm.community_id
LEFT JOIN profiles pr ON c.creator_id = pr.id
GROUP BY c.id, pr.username, pr.display_name, pr.avatar_url;

-- Create triggers for updated_at
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_user_xp_updated_at
  BEFORE UPDATE ON user_xp
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();