import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, isAdminUser } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.email)) {
    return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let query = adminClient
    .from('reports')
    .select('*', { count: 'exact' })
    .order('reported_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (status) {
    query = query.eq('review_status', status);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reports: data, total: count || 0 });
}
