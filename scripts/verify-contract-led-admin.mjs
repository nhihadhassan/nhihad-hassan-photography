import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const expected = [
  { agreementId: "d9607a04-fc4e-4329-8bc7-b2c8e2ea1a7e", total: 350, paidOn: "2026-08-07", due: "2026-08-09", delivery: "2026-09-04", clients: 2 },
  { agreementId: "8639345e-ff06-4336-b9b2-674155d2e48c", total: 150, paidOn: "2026-08-12", due: "2026-08-11", delivery: "2026-09-01", clients: 1 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function data(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const report = [];
for (const job of expected) {
  const booking = data(await db.from("bookings").select("*").eq("agreement_request_id", job.agreementId).single(), "booking");
  assert(booking.stage === "editing", `${job.agreementId}: stage is not Editing`);
  assert(booking.delivery_due_date === job.delivery, `${job.agreementId}: wrong delivery deadline`);
  assert(booking.invoice_due_date === job.due, `${job.agreementId}: wrong invoice due date`);
  assert(Number(booking.invoice_tax_rate) === 0, `${job.agreementId}: tax is not zero`);
  assert(!booking.invoice_sent_at, `${job.agreementId}: invoice was sent`);

  const lines = data(await db.from("invoice_line_items").select("*").eq("booking_id", booking.id), "invoice lines");
  assert(lines.length === 1 && Number(lines[0].quantity) === 1 && Number(lines[0].unit_price) === job.total, `${job.agreementId}: invoice draft is not exact`);
  const payments = data(await db.from("payments").select("*").eq("booking_id", booking.id), "payments");
  assert(payments.length === 1 && Number(payments[0].amount) === job.total && payments[0].paid_on === job.paidOn, `${job.agreementId}: payment is not exact`);
  const receipts = data(await db.from("receipts").select("*").eq("booking_id", booking.id).is("voided_at", null), "receipts");
  assert(receipts.length === 1 && !receipts[0].sent_at && !receipts[0].snapshot, `${job.agreementId}: receipt is not an unsent draft`);
  const links = data(await db.from("booking_clients").select("client_id,role").eq("booking_id", booking.id), "booking clients");
  assert(links.length === job.clients, `${job.agreementId}: wrong number of linked clients`);
  const agreementLinks = data(await db.from("agreement_clients").select("client_id,role").eq("agreement_request_id", job.agreementId), "agreement clients");
  assert(agreementLinks.length === job.clients, `${job.agreementId}: wrong number of agreement clients`);
  const receiptDeliveries = data(await db.from("receipt_deliveries").select("id").eq("receipt_id", receipts[0].id), "receipt deliveries");
  assert(receiptDeliveries.length === 0, `${job.agreementId}: receipt email was sent or attempted`);
  report.push({ agreementId: job.agreementId, bookingId: booking.id, stage: booking.stage, invoice: job.total, paid: job.total, deliveryDue: booking.delivery_due_date, invoiceSent: false, receiptSent: false, clientLinks: links.length });
}

const rachel = data(await db.from("bookings").select("id").eq("id", "342d218f-bff1-4b20-92a6-aa45330cee24").maybeSingle(), "Rachel tester");
assert(!rachel, "Rachel test booking still exists");
const agreementCount = await db.from("agreement_requests").select("id", { count: "exact", head: true });
assert(!agreementCount.error && agreementCount.count === 3, "Existing agreement records changed unexpectedly");

console.log(JSON.stringify({ jobs: report, rachelDeleted: true, agreementRecordsPreserved: agreementCount.count, emailsSent: 0 }, null, 2));
