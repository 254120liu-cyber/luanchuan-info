import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.startsWith('your-')) {
    // Return a stub during build / missing config
    return createBrowserClient('http://localhost:54321', 'stub-key');
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
