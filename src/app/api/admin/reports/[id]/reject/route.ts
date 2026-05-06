import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, ensureAdmin } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const adminCheck = await ensureAdmin(supabase);
  if (adminCheck.error) return adminCheck.error;

  const admin = createAdminClient();
  const { id } = await params;

  const { data: report } = await admin.from('reports').select('post_id').eq('id', id).single();
  if (!report) return NextResponse.json({ error: '举报不存在' }, { status: 404 });

  await admin.from('reports').update({ review_status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
  await admin.from('posts').update({ status: 'normal', reported_by: null }).eq('id', report.post_id);

  return NextResponse.json({ success: true });
}
