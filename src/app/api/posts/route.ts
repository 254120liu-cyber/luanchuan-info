import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, batchFetchProfiles } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';
import { POST_EXPIRE_HOURS } from '@/lib/constants';

// Auto-cleanup: run at most once per hour
let lastCleanup = 0;
const CLEANUP_INTERVAL = 3600000; // 1 hour in ms

async function autoCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  try {
    const admin = createAdminClient();
    // Mark expired posts as deleted
    const { data: expired } = await admin
      .from('posts')
      .select('id')
      .eq('status', 'normal')
      .lt('expire_at', new Date().toISOString());

    if (expired && expired.length > 0) {
      const ids = expired.map(p => p.id);
      await admin.from('posts').update({ status: 'deleted' }).in('id', ids);
      console.log(`[auto-cleanup] 已清理 ${ids.length} 条过期信息`);
    }

    // Clean up orphaned favorites
    try { await admin.rpc('cleanup_favorites'); } catch {}
  } catch {}
}

export async function GET(req: NextRequest) {
  autoCleanup(); // fire-and-forget, doesn't block response
  try {
  const supabase = await createServerSupabase();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const town = searchParams.get('town');
  const q = searchParams.get('q');
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('status', 'normal')
    .gt('expire_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (town) {
    query = query.eq('town', town);
  }
  if (q) {
    query = query.ilike('content', `%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('posts list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set((data || []).map(p => p.user_id))];
  const profileMap = await batchFetchProfiles(supabase, userIds);

  const posts = (data || []).map(p => {
    const profile = profileMap[p.user_id];
    return {
      ...p,
      userNickName: profile?.nickname || '匿名用户',
      userAvatar: profile?.avatar_url || '',
      profiles: undefined,
    };
  });

  return NextResponse.json({ posts, total: count || 0 });
  } catch (e: any) {
    console.error('[posts list error]', e?.message || e);
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  // Check ban status
  const { data: profile } = await supabase.from('profiles').select('ban_status, ban_until').eq('id', user.id).single();
  if (profile) {
    if (profile.ban_status === 'perm_banned') {
      return NextResponse.json({ error: '您的账号已被永久封禁，无法发布信息' }, { status: 403 });
    }
    if (profile.ban_status === 'temp_banned' && profile.ban_until && new Date(profile.ban_until) > new Date()) {
      const days = Math.ceil((new Date(profile.ban_until).getTime() - Date.now()) / 86400000);
      return NextResponse.json({ error: `您的账号已被封禁，${days}天后解封` }, { status: 403 });
    }
  }

  const body = await req.json();
  const { category, content, images, phone, wechat, town } = body;

  if (!category || !content || !town) {
    return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
  }

  const expireAt = new Date(Date.now() + POST_EXPIRE_HOURS * 3600 * 1000).toISOString();

  const { data, error } = await supabase.from('posts').insert({
    user_id: user.id,
    category,
    content: content.trim(),
    images: images || [],
    phone: phone || '',
    wechat: wechat || '',
    town,
    expire_at: expireAt,
    status: 'normal',
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id: data.id });
}
