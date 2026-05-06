import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, isAdminUser } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.email)) {
    return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const { id } = await params;

  const { data: report } = await adminClient.from('reports').select('post_id').eq('id', id).single();
  if (!report) return NextResponse.json({ error: '举报不存在' }, { status: 404 });

  await adminClient.from('reports').update({
    review_status: 'rejected',
    reviewed_at: new Date().toISOString(),
  }).eq('id', id);

  await adminClient.from('posts').update({
    status: 'normal',
    reported_by: null,
  }).eq('id', report.post_id);

  return NextResponse.json({ success: true });
}
