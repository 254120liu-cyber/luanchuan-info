import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { id } = await params;

  const { error } = await supabase.rpc('increment_view_count', { post_id: id });

  if (error) {
    // Fallback: raw update
    const { data: post } = await supabase.from('posts').select('view_count').eq('id', id).single();
    if (post) {
      await supabase.from('posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', id);
    }
  }

  return NextResponse.json({ success: true });
}
