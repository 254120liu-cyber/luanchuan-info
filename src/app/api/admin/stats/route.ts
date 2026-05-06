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
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: activePosts },
    { count: postsThisWeek },
    { count: postsToday },
    { count: newUsersThisWeek },
    { count: pendingReports },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('posts').select('*', { count: 'exact', head: true }),
    admin.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'normal').gt('expire_at', now.toISOString()),
    admin.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    admin.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    admin.from('reports').select('*', { count: 'exact', head: true }).eq('review_status', 'pending'),
  ]);

  // Contact views sum
  const { data: contactData } = await admin.from('posts').select('contact_view_count');
  const totalContactViews = (contactData || []).reduce((sum, p) => sum + (p.contact_view_count || 0), 0);

  // Day-by-day stats for the last 7 days
  const days: { date: string; label: string; posts: number; users: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, label: `${d.getMonth() + 1}/${d.getDate()}`, posts: 0, users: 0 });
  }

  // Query posts in last 7 days
  const { data: weekPosts } = await admin
    .from('posts')
    .select('created_at')
    .gte('created_at', weekAgo.toISOString());

  (weekPosts || []).forEach(p => {
    const d = p.created_at.split('T')[0];
    const day = days.find(x => x.date === d);
    if (day) day.posts++;
  });

  // Query users in last 7 days
  const { data: weekUsers } = await admin
    .from('profiles')
    .select('created_at')
    .gte('created_at', weekAgo.toISOString());

  (weekUsers || []).forEach(u => {
    const d = u.created_at.split('T')[0];
    const day = days.find(x => x.date === d);
    if (day) day.users++;
  });

  // Recent users (last 5)
  const { data: recentUsers } = await admin
    .from('profiles')
    .select('id, nickname, phone, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent posts (last 5)
  const { data: recentPosts } = await admin
    .from('posts')
    .select('id, content, category, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    totalPosts: totalPosts || 0,
    activePosts: activePosts || 0,
    postsThisWeek: postsThisWeek || 0,
    postsToday: postsToday || 0,
    totalContactViews,
    newUsersThisWeek: newUsersThisWeek || 0,
    pendingReports: pendingReports || 0,
    recentUsers: recentUsers || [],
    recentPosts: recentPosts || [],
    dailyStats: days,
  });
}
