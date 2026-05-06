import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, isAdminUser } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.email)) {
    return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: '缺少userId' }, { status: 400 });

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('profiles').update({
    ban_status: 'normal',
    ban_until: null,
  }).eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
