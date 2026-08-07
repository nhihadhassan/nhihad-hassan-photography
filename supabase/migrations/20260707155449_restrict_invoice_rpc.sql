-- Restrict assign_invoice_no to the service role
--
-- The function is SECURITY DEFINER and was executable by anon/authenticated via
-- PostgREST (/rest/v1/rpc/assign_invoice_no), flagged by the Supabase security
-- advisor. Its only caller is server-side code using the service-role client
-- (src/lib/bookings.ts), so public execute is revoked. The other public RPCs
-- (get_public_gallery_by_slug, get_public_gallery_photos, is_admin) stay open
-- on purpose: the public gallery pages depend on them.

revoke execute on function public.assign_invoice_no(uuid) from public;
revoke execute on function public.assign_invoice_no(uuid) from anon;
revoke execute on function public.assign_invoice_no(uuid) from authenticated;
grant execute on function public.assign_invoice_no(uuid) to service_role;
