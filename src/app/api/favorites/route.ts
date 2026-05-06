import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  // Get ALL favorite post IDs for accurate count
  const { data: allFavs } = await supabase
    .from('favorites')
    .select('post_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!allFavs || allFavs.length === 0) {
    return NextResponse.json({ favorites: [], total: 0 });
  }

  // Get active posts for ALL favorite IDs
  const allPostIds = allFavs.map(f => f.post_id);
  const { data: allPosts } = await supabase
    .from('posts')
    .select('id')
    .in('id', allPostIds)
    .eq('status', 'normal')
    .gt('expire_at', new Date().toISOString());

  const activePostIdSet = new Set((allPosts || []).map(p => p.id));

  // Filter favorites to only active posts
  const activeFavs = allFavs.filter(f => activePostIdSet.has(f.post_id));

  // Paginate
  const pageFavs = activeFavs.slice(skip, skip + limit);
  const pagePostIds = pageFavs.map(f => f.post_id);

  // Fetch full post data for this page
  let postMap: Record<string, any> = {};
  if (pagePostIds.length > 0) {
    const { data: pagePosts } = await supabase
      .from('posts')
      .select('*')
      .in('id', pagePostIds);

    const userIds = [...new Set((pagePosts || []).map(p => p.user_id))];
    let profileMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds);
      (profiles || []).forEach(p => { profileMap[p.id] = p; });
    }

    (pagePosts || []).forEach(p => {
      const profile = profileMap[p.user_id];
      postMap[p.id] = {
        ...p,
        userNickName: profile?.nickname || '匿名用户',
        userAvatar: profile?.avatar_url || '',
      };
    });
  }

  const favorites = pageFavs
    .map(f => ({ ...postMap[f.post_id], favorited_at: f.created_at, isFavorited: true }))
    .filter(p => p.id);

  return NextResponse.json({ favorites, total: activeFavs.length });
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
