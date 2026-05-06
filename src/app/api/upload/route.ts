import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: '没有文件' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `images/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error, data } = await supabase.storage
    .from('images')
    .upload(fileName, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
