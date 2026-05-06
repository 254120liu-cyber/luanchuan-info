-- ============================================
-- 栾川便民信息 - Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 1. 用户资料表（关联 auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50) DEFAULT '',
  phone VARCHAR(20) DEFAULT '',
  avatar_url TEXT DEFAULT '',
  ban_status VARCHAR(20) DEFAULT 'normal',
  ban_until TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', '用户' || substring(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 信息表
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  phone VARCHAR(20) DEFAULT '',
  wechat VARCHAR(50) DEFAULT '',
  town VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expire_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'normal',
  view_count INT DEFAULT 0,
  contact_view_count INT DEFAULT 0,
  reported_by UUID REFERENCES auth.users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_status_expire ON posts(status, expire_at);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_town ON posts(town);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 3. 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- 3.5 浏览记录表（用于去重统计唯一访客）
CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_views_post ON post_views(post_id);

-- 原子记录唯一访客：重复自动忽略，返回该帖子的总访客数
CREATE OR REPLACE FUNCTION record_post_view(post_id UUID, viewer_id UUID)
RETURNS INT AS $$
BEGIN
  INSERT INTO post_views (post_id, user_id) VALUES (post_id, viewer_id) ON CONFLICT DO NOTHING;
  RETURN (SELECT COUNT(*) FROM post_views WHERE post_id = record_post_view.post_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 举报记录表
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_content TEXT DEFAULT '',
  post_owner_id UUID REFERENCES auth.users(id),
  reporter_nickname VARCHAR(50) DEFAULT '',
  review_status VARCHAR(20) DEFAULT 'pending',
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(review_status);

-- 5. 清理无效收藏（帖子已过期或删除的收藏记录）
CREATE OR REPLACE FUNCTION cleanup_favorites()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM favorites
  WHERE post_id IN (
    SELECT id FROM posts WHERE status = 'deleted' OR expire_at < NOW()
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 管理后台统计函数（一次查询返回所有统计数据）
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  week_ago TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  today_start TIMESTAMPTZ := DATE_TRUNC('day', NOW());
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'totalUsers', (SELECT COUNT(*) FROM profiles),
      'totalPosts', (SELECT COUNT(*) FROM posts),
      'activePosts', (SELECT COUNT(*) FROM posts WHERE status = 'normal' AND expire_at > NOW()),
      'postsThisWeek', (SELECT COUNT(*) FROM posts WHERE created_at >= week_ago),
      'postsToday', (SELECT COUNT(*) FROM posts WHERE created_at >= today_start),
      'newUsersThisWeek', (SELECT COUNT(*) FROM profiles WHERE created_at >= week_ago),
      'pendingReports', (SELECT COUNT(*) FROM reports WHERE review_status = 'pending'),
      'totalContactViews', (SELECT COALESCE(SUM(contact_view_count), 0) FROM posts)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 浏览量自增函数（原子操作，避免并发问题）
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 6. 启用 RLS（行级安全）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- profiles: 用户可读所有，只能修改自己的
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- posts: 所有人可读正常信息，登录用户可创建，作者和管理员可修改
CREATE POLICY "posts_read_normal" ON posts FOR SELECT USING (status != 'deleted' OR auth.uid() = user_id);
CREATE POLICY "posts_insert_auth" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = user_id);

-- favorites: 只能操作自己的
CREATE POLICY "favorites_read_own" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- reports: 登录用户可创建，所有人可读
CREATE POLICY "reports_insert_auth" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_read_auth" ON reports FOR SELECT USING (true);
