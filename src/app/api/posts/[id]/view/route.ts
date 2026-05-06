import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { id } = await params;

  if (user) {
    // Don't count self-views
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', id).single();
    if (post && post.user_id === user.id) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Use RPC for atomic unique viewer tracking
    const { error } = await supabase.rpc('record_post_view', {
      post_id: id,
      viewer_id: user.id,
    });

    if (error) {
      // Fallback: update view_count via the old function
      try { await supabase.rpc('increment_view_count', { post_id: id }); } catch {}
    }
  }

  return NextResponse.json({ success: true });
}
