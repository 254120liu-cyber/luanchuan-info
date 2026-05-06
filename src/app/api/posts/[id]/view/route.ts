import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

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

  // Atomic unique view insert, returns new count
  const { data: newCount, error } = await supabase.rpc('record_post_view', {
    post_id: id,
    viewer_id: user.id,
  });

  if (!error && newCount !== null) {
    // Sync view_count on posts table
    await supabase.from('posts').update({ view_count: newCount }).eq('id', id);
  }

  return NextResponse.json({ success: true });
}
