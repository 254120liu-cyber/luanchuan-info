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
  const body = await req.json();
  const { banType, banDays } = body;

  const { data: report } = await adminClient.from('reports').select('post_id, post_owner_id').eq('id', id).single();
  if (!report) return NextResponse.json({ error: '举报不存在' }, { status: 404 });

  await adminClient.from('reports').update({
    review_status: 'approved',
    reviewed_at: new Date().toISOString(),
  }).eq('id', id);

  await adminClient.from('posts').update({ status: 'deleted' }).eq('id', report.post_id);

  if (banType && report.post_owner_id) {
    const banData: Record<string, any> = { ban_status: banType };
    if (banType === 'temp_banned' && banDays) {
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + banDays);
      banData.ban_until = banUntil.toISOString();
    } else {
      banData.ban_until = null;
    }
    await adminClient.from('profiles').upsert({ id: report.post_owner_id, ...banData }, { onConflict: 'id' });
  }

  return NextResponse.json({ success: true });
}
