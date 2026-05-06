import { NextResponse } from 'next/server';
import { createServerSupabase, isAdminUser } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.email)) {
    return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  // All queries in one parallel batch
  const [
    rpcResult,
    weekPostsRes,
    weekUsersRes,
    recentUsersRes,
    recentPostsRes,
  ] = await Promise.all([
    admin.rpc('get_admin_stats').single(),
    admin.from('posts').select('created_at').gte('created_at', weekAgo),
    admin.from('profiles').select('created_at').gte('created_at', weekAgo),
    admin.from('profiles').select('id, nickname, phone, created_at').order('created_at', { ascending: false }).limit(5),
    admin.from('posts').select('id, content, category, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const stats: any = (rpcResult.data || {}) as any;

  // Build daily stats chart data
  const days: { date: string; label: string; posts: number; users: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, label: `${d.getMonth() + 1}/${d.getDate()}`, posts: 0, users: 0 });
  }

  (weekPostsRes.data || []).forEach((p: any) => {
    const d = p.created_at.split('T')[0];
    const day = days.find(x => x.date === d);
    if (day) day.posts++;
  });

  (weekUsersRes.data || []).forEach((u: any) => {
    const d = u.created_at.split('T')[0];
    const day = days.find(x => x.date === d);
    if (day) day.users++;
  });

  return NextResponse.json({
    totalUsers: stats.totalUsers || 0,
    totalPosts: stats.totalPosts || 0,
    activePosts: stats.activePosts || 0,
    postsThisWeek: stats.postsThisWeek || 0,
    postsToday: stats.postsToday || 0,
    totalContactViews: stats.totalContactViews || 0,
    newUsersThisWeek: stats.newUsersThisWeek || 0,
    pendingReports: stats.pendingReports || 0,
    recentUsers: recentUsersRes.data || [],
    recentPosts: recentPostsRes.data || [],
    dailyStats: days,
  });
}
