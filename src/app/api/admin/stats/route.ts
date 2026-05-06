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
    { count: totalContactReveals },
    { count: newUsersThisWeek },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('posts').select('*', { count: 'exact', head: true }),
    admin.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'normal').gt('expire_at', now.toISOString()),
    admin.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    admin.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    admin.from('posts').select('contact_view_count', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
  ]);

  // Sum contact views
  const { data: contactData } = await admin.from('posts').select('contact_view_count');
  const totalContactViews = (contactData || []).reduce((sum, p) => sum + (p.contact_view_count || 0), 0);

  // Recent users (last 5)
  const { data: recentUsers } = await admin
    .from('profiles')
    .select('id, nickname, phone, created_at')
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
    recentUsers: recentUsers || [],
  });
}
