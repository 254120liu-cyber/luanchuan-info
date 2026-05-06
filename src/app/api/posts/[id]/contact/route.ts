import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { id } = await params;

  const { data: post } = await supabase.from('posts').select('contact_view_count').eq('id', id).single();
  if (post) {
    await supabase.from('posts').update({ contact_view_count: (post.contact_view_count || 0) + 1 }).eq('id', id);
  }

  return NextResponse.json({ success: true });
}
