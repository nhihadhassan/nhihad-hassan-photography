-- Restrict set_photo_order to admins
--
-- Supabase default privileges grant EXECUTE on every new function in the
-- public schema to anon, so set_photo_order landed reachable via PostgREST
-- (/rest/v1/rpc/set_photo_order) despite the previous migration only naming
-- authenticated and service_role.
--
-- The function is SECURITY INVOKER and RLS on public.photos allows writes
-- only through the "Admins manage photos" policy, so an anon call already
-- updated zero rows. Reordering is an admin operation, though, and should not
-- depend on RLS as its only defence. Mirrors the assign_invoice_no treatment
-- in 20260707155449_restrict_invoice_rpc.sql.

revoke execute on function public.set_photo_order(uuid, uuid[]) from public;
revoke execute on function public.set_photo_order(uuid, uuid[]) from anon;
grant execute on function public.set_photo_order(uuid, uuid[]) to authenticated, service_role;
