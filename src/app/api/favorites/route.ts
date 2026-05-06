import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const checkPostId = searchParams.get('check');
  const countOnly = searchParams.get('count_only') === '1';
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  // Single post check: is this post favorited?
  if (checkPostId) {
    const { count } = await supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('post_id', checkPostId);
    return NextResponse.json({ favorited: (count || 0) > 0 });
  }

  if (countOnly) {
    // Count only active favorites (JOIN posts to exclude expired/deleted)
    const { data: activeCount, error } = await supabase
      .rpc('count_active_favorites', { uid: user.id });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ total: activeCount || 0, favorites: [] });
  }

  // Full list: paginated favorites with post data
  const { data: favs } = await supabase
    .from('favorites')
    .select('post_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (!favs || favs.length === 0) {
    return NextResponse.json({ favorites: [], total: 0 });
  }

  const postIds = favs.map(f => f.post_id);
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .in('id', postIds)
    .eq('status', 'normal')
    .gt('expire_at', new Date().toISOString());

  // Batch fetch profiles
  const userIds = [...new Set((posts || []).map(p => p.user_id))];
  const profileMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', userIds);
    (profiles || []).forEach(p => { profileMap[p.id] = p; });
  }

  const postMap: Record<string, any> = {};
  (posts || []).forEach(p => {
    const profile = profileMap[p.user_id];
    postMap[p.id] = {
      ...p,
      userNickName: profile?.nickname || '匿名用户',
      userAvatar: profile?.avatar_url || '',
    };
  });

  const favorites = favs
    .map(f => ({ ...postMap[f.post_id], favorited_at: f.created_at, isFavorited: true }))
    .filter(p => p.id);

  return NextResponse.json({ favorites, total: favorites.length });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { post_id } = await req.json();
  if (!post_id) return NextResponse.json({ error: '缺少post_id' }, { status: 400 });

  const { error } = await supabase.from('favorites').upsert({
    user_id: user.id,
    post_id,
  }, { onConflict: 'user_id, post_id' });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { post_id } = await req.json();
  if (!post_id) return NextResponse.json({ error: '缺少post_id' }, { status: 400 });

  const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('post_id', post_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
