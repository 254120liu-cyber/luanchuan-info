import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LOCAL_DOMAIN } from './constants';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const FALLBACK_URL = 'http://localhost:54321';
const FALLBACK_KEY = 'stub-key';

export function isAdminUser(email: string | undefined): boolean {
  if (!email) return false;
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE || '';
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
  if (email.endsWith(LOCAL_DOMAIN)) {
    return adminPhone !== '' && email.replace(LOCAL_DOMAIN, '') === adminPhone;
  }
  return adminEmail !== '' && email === adminEmail;
}

export async function ensureAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.email)) {
    return { error: NextResponse.json({ error: '无管理员权限' }, { status: 403 }) };
  }
  return { user };
}

export async function batchFetchProfiles(supabase: any, userIds: string[]) {
  const map: Record<string, any> = {};
  if (userIds.length === 0) return map;
  const { data } = await supabase.from('profiles').select('id, nickname, avatar_url').in('id', userIds);
  (data || []).forEach((p: any) => { map[p.id] = p; });
  return map;
}

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const url = (!SUPABASE_URL || SUPABASE_URL.startsWith('your-')) ? FALLBACK_URL : SUPABASE_URL;
  const key = (!SUPABASE_KEY || SUPABASE_KEY.startsWith('your-')) ? FALLBACK_KEY : SUPABASE_KEY;

  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}
