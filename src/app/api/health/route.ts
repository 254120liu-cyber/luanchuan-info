import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('posts').select('id').limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: error.message,
        code: error.code,
        details: error.details,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '(set)' : '(not set)',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '(set)' : '(not set)',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '(set)' : '(not set)',
      adminPhone: process.env.NEXT_PUBLIC_ADMIN_PHONE || '(not set)',
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err?.message || String(err),
    }, { status: 500 });
  }
}
