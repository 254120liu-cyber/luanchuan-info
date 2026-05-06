import { createClient } from '@supabase/supabase-js';

// Service role client — bypasses RLS, used only in admin API routes
// The admin check (email compare) happens BEFORE any operation using this client
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceKey || url.startsWith('your-')) {
    throw new Error('Supabase 未配置，请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceKey);
}
