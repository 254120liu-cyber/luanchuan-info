import { NextResponse } from 'next/server';
import { createServerSupabase, ensureAdmin } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';

export async function POST() {
  const supabase = await createServerSupabase();
  const adminCheck = await ensureAdmin(supabase);
  if (adminCheck.error) return adminCheck.error;

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Soft-delete expired posts
  const { data: expired, error: countErr } = await admin
    .from('posts')
    .select('id', { count: 'exact' })
    .eq('status', 'normal')
    .lt('expire_at', now);

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  if (expired && expired.length > 0) {
    const ids = expired.map(p => p.id);
    await admin.from('posts').update({ status: 'deleted' }).in('id', ids);
  }

  // Clean up favorites for deleted/expired posts (in case any slipped through)
  const { error: favError } = await admin.rpc('cleanup_favorites');
  // Ignore favError if RPC doesn't exist yet — this is a bonus cleanup

  return NextResponse.json({
    success: true,
    cleaned: expired?.length || 0,
    message: expired?.length ? `已清理 ${expired.length} 条过期信息` : '没有需要清理的信息',
  });
}
