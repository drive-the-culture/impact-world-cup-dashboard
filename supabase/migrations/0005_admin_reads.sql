-- Fix: submissions had RLS enabled with an INSERT-only policy, so even
-- signed-in admins couldn't SELECT the queue. /admin showed "All caught
-- up" regardless of how many submissions were actually pending.
--
-- Strategy: let any authenticated user whose email is on the admins
-- allowlist SELECT all submissions. Non-admin authenticated users + anon
-- still get nothing (the public-insert policy is unaffected).
--
-- UPDATE / DELETE on submissions still goes through service_role from
-- server actions (which bypasses RLS), so no policy needed there.

create policy "submissions_admin_read"
  on public.submissions for select to authenticated
  using (
    exists (
      select 1
      from public.admins
      where admins.email = (auth.jwt() ->> 'email')
    )
  );
