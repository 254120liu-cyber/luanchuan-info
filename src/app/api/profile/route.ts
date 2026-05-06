import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return NextResponse.json(data || { nickname: '', phone: '', avatar_url: '' });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { nickname, phone, avatar_url } = await req.json();

  const updateData: Record<string, string> = {};
  if (nickname !== undefined) updateData.nickname = nickname || '';
  if (phone !== undefined) updateData.phone = phone || '';
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url || '';

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    ...updateData,
  }, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
