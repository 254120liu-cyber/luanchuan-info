import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;

  // Get post info for report snapshot
  const { data: post } = await supabase
    .from('posts')
    .select('content, user_id, status')
    .eq('id', id)
    .single();

  if (!post) return NextResponse.json({ error: '信息不存在' }, { status: 404 });
  if (post.status !== 'normal') return NextResponse.json({ error: '该信息已被处理' }, { status: 400 });

  // Get reporter nickname
  const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();

  // Mark post as reported + create report record
  const { error: updateError } = await supabase.from('posts').update({
    status: 'reported',
    reported_by: user.id,
  }).eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: reportError } = await supabase.from('reports').insert({
    post_id: id,
    reporter_id: user.id,
    post_content: post.content,
    post_owner_id: post.user_id,
    reporter_nickname: (profile?.nickname) || '匿名用户',
  });

  if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
