import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client. BYPASSES RLS. Server-only — never import from a
// "use client" file. Used by route handlers + server actions that perform
// privileged operations (approving submissions, editing scoring rules,
// soft-deleting impact events).
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
