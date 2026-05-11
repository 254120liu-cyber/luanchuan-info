import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server-supabase-admin';
import { POST_EXPIRE_HOURS } from '@/lib/constants';

const PAGE_SIZE = 20;

let lastCleanup = 0;
const CLEANUP_INTERVAL = 3600000;

async function autoCleanup() {
  if (Date.now() - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = Date.now();
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    // 1. Soft-delete newly expired posts
    const { data: expired } = await admin.from('posts').select('id').eq('status', 'normal').lt('expire_at', now);
    if (expired && expired.length > 0) {
      await admin.from('posts').update({ status: 'deleted' }).in('id', expired.map(p => p.id));
    }

    // 2. Hard-delete posts soft-deleted >7 days ago (cascade removes favorites)
    const { data: staleDelete } = await admin.from('posts').select('id').eq('status', 'deleted').lt('expire_at', weekAgo);
    if (staleDelete && staleDelete.length > 0) {
      await admin.from('posts').delete().in('id', staleDelete.map(p => p.id));
    }

    // 3. Clean up orphaned favorites
    try { await admin.rpc('cleanup_favorites'); } catch {}
  } catch {}
}

export async function GET(req: NextRequest) {
  setTimeout(() => autoCleanup(), 0);
  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const town = searchParams.get('town');
  const q = searchParams.get('q');
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || String(PAGE_SIZE)), 50);

  try {
    let query = admin.from('posts').select('*', { count: 'exact' })
      .eq('status', 'normal').gt('expire_at', new Date().toISOString())
      .order('created_at', { ascending: false }).range(skip, skip + limit - 1);
    if (category && category !== 'all') query = query.eq('category', category);
    if (town) query = query.eq('town', town);
    if (q) query = query.ilike('content', `%${q}%`);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const userIds = [...new Set((data || []).map(p => p.user_id))];
    const profileMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, nickname, avatar_url').in('id', userIds);
      (profiles || []).forEach(p => { profileMap[p.id] = p; });
    }

    const posts = (data || []).map(p => ({ ...p, userNickName: (profileMap[p.user_id] || {}).nickname || '匿名用户', userAvatar: (profileMap[p.user_id] || {}).avatar_url || '' }));
    return NextResponse.json({ posts, total: count || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  const supabase = await (await import('@/lib/server-supabase')).createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { data: profile } = await admin.from('profiles').select('ban_status, ban_until').eq('id', user.id).single();
  if (profile) {
    if (profile.ban_status === 'perm_banned') return NextResponse.json({ error: '您的账号已被永久封禁' }, { status: 403 });
    if (profile.ban_status === 'temp_banned' && profile.ban_until && new Date(profile.ban_until) > new Date()) {
      return NextResponse.json({ error: `您的账号已被封禁，${Math.ceil((new Date(profile.ban_until).getTime() - Date.now()) / 86400000)}天后解封` }, { status: 403 });
    }
  }

  const body = await req.json();
  const { category, content, images, phone, wechat, town } = body;
  if (!category || !content || !town) return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });

  const { data, error } = await admin.from('posts').insert({
    user_id: user.id, category, content: content.trim(), images: images || [],
    phone: phone || '', wechat: wechat || '', town,
    expire_at: new Date(Date.now() + POST_EXPIRE_HOURS * 3600 * 1000).toISOString(),
    status: 'normal',
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}
