import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, isAdminUser } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = createAdminClient();
  const { id } = await params;

  const { data: post, error } = await admin
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: '信息不存在或已删除' }, { status: 404 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('nickname, avatar_url')
    .eq('id', post.user_id)
    .single();

  return NextResponse.json({
    ...post,
    userNickName: profile?.nickname || '匿名用户',
    userAvatar: profile?.avatar_url || '',
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;

  const { data: existing } = await supabase.from('posts').select('user_id').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: '信息不存在' }, { status: 404 });
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: '只能编辑自己的信息' }, { status: 403 });
  }

  const body = await req.json();
  const { category, content, images, phone, wechat, town } = body;

  const { error } = await supabase.from('posts').update({
    category,
    content: content.trim(),
    images: images || [],
    phone: phone || '',
    wechat: wechat || '',
    town,
  }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const isAdmin = isAdminUser(user.email);

  const { data: existing } = await supabase.from('posts').select('user_id').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: '信息不存在' }, { status: 404 });
  if (existing.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { error } = await supabase.from('posts').update({ status: 'deleted' }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
