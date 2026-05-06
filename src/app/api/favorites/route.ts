import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  // Get favorite post IDs
  const { data: favs, error: favError, count } = await supabase
    .from('favorites')
    .select('post_id, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (favError) return NextResponse.json({ error: favError.message }, { status: 500 });
  if (!favs || favs.length === 0) return NextResponse.json({ favorites: [], total: 0 });

  // Get posts — only active, unexpired ones
  const postIds = favs.map(f => f.post_id);
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .in('id', postIds)
    .eq('status', 'normal')
    .gt('expire_at', new Date().toISOString());

  // Get profiles for post owners
  const userIds = [...new Set((posts || []).map(p => p.user_id))];
  let profileMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', userIds);
    (profiles || []).forEach(p => { profileMap[p.id] = p; });
  }

  // Merge
  const postMap: Record<string, any> = {};
  (posts || []).forEach(p => {
    const profile = profileMap[p.user_id];
    postMap[p.id] = {
      ...p,
      userNickName: profile?.nickname || '匿名用户',
      userAvatar: profile?.avatar_url || '',
    };
  });

  const favorites = favs.map(f => ({
    ...postMap[f.post_id],
    favorited_at: f.created_at,
    isFavorited: true,
  })).filter(p => p.id); // filter out null results (deleted posts)

  return NextResponse.json({ favorites, total: count || 0 });
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
