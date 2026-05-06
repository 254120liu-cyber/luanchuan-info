import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  const { data, error, count } = await supabase
    .from('posts')
    .select('id, category, content, images, town, created_at, expire_at, status, view_count, contact_view_count', { count: 'exact' })
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: data, total: count || 0 });
}
