-- Fix: admins table had RLS enabled but no SELECT policy, so the proxy
-- middleware (which uses the anon key) couldn't verify admin status even
-- for authenticated admin users. Let each authenticated user read their
-- own admin row only — doesn't leak the rest of the allowlist.

create policy "admins_self_read"
  on public.admins for select to authenticated
  using (email = (auth.jwt() ->> 'email'));
