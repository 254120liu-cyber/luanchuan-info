import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback URL for build time (won't actually connect during SSG)
const FALLBACK_URL = 'http://localhost:54321';
const FALLBACK_KEY = 'stub-key';

export function isAdminUser(email: string | undefined): boolean {
  if (!email) return false;
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE || '';
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
  if (email.endsWith('@lc.local')) {
    return adminPhone !== '' && email.replace('@lc.local', '') === adminPhone;
  }
  return adminEmail !== '' && email === adminEmail;
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
