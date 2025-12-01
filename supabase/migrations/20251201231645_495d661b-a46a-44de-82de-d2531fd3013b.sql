-- Fix function search path security issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;