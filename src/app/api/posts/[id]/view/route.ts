import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';
import { createAdminClient } from '@/lib/server-supabase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { id } = await params;

  if (!user) return NextResponse.json({ success: true });

  // Don't count self-views
  const { data: post } = await supabase.from('posts').select('user_id').eq('id', id).single();
  if (post && post.user_id === user.id) {
    return NextResponse.json({ success: true, skipped: true });
  }

  const admin = createAdminClient();

  // Try unique viewer tracking via RPC
  const { data: newCount, error: rpcError } = await supabase.rpc('record_post_view', {
    post_id: id,
    viewer_id: user.id,
  });

  if (rpcError) {
    // Fallback: simple increment (uses admin client to bypass RLS)
    console.warn('[view] RPC failed, using fallback:', rpcError.message);
    const { data: current } = await admin.from('posts').select('view_count').eq('id', id).single();
    await admin.from('posts').update({
      view_count: (current?.view_count || 0) + 1,
    }).eq('id', id);
  } else if (newCount !== null && newCount !== undefined) {
    await admin.from('posts').update({ view_count: newCount }).eq('id', id);
  }

  return NextResponse.json({ success: true });
}
