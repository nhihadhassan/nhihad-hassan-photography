import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Load NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this backfill.");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const RACHEL_BOOKING_ID = "342d218f-bff1-4b20-92a6-aa45330cee24";

const jobs = [
  {
    agreementId: "d9607a04-fc4e-4329-8bc7-b2c8e2ea1a7e",
    clientName: "Kawish Lakhani",
    secondName: "Farkhunda Alef",
    shootType: "Wedding",
    startAt: "2026-08-09T21:30:00.000Z",
    endAt: "2026-08-10T02:30:00.000Z",
    location: "Elite Banquet Hall and Convention Centre, 1850 Albion Road, Etobicoke, ON M9W 5S8",
    total: 350,
    invoiceDueDate: "2026-08-09",
    deliveryDueDate: "2026-09-04",
    paymentDate: "2026-08-07",
  },
  {
    agreementId: "8639345e-ff06-4336-b9b2-674155d2e48c",
    clientName: "Arjun Khare",
    secondName: null,
    shootType: "Surprise proposal and engagement session",
    startAt: "2026-08-11T23:30:00.000Z",
    endAt: "2026-08-12T00:30:00.000Z",
    location: "Milne Park",
    total: 150,
    invoiceDueDate: "2026-08-11",
    deliveryDueDate: "2026-09-01",
    paymentDate: "2026-08-12",
  },
];

function check(result, fallback) {
  if (result.error) throw new Error(`${fallback}: ${result.error.message}`);
  return result.data;
}

async function findOrCreateClient({ name, email, phone = null, address = null }) {
  let existing = null;
  if (email) {
    existing = check(await db.from("clients").select("*").ilike("email", email).maybeSingle(), "Could not find client by email");
  }
  if (!existing) {
    existing = check(await db.from("clients").select("*").eq("name", name).maybeSingle(), "Could not find client by name");
  }
  if (existing) {
    return check(await db.from("clients").update({ name, email, phone, address, updated_at: new Date().toISOString() }).eq("id", existing.id).select("*").single(), "Could not update client");
  }
  return check(await db.from("clients").insert({ name, email, phone, address }).select("*").single(), "Could not create client");
}

async function linkClient(table, column, recordId, clientId, role) {
  check(await db.from(table).delete().eq(column, recordId).eq("role", role).neq("client_id", clientId), "Could not clear stale client link");
  check(await db.from(table).upsert({ [column]: recordId, client_id: clientId, role }, { onConflict: `${column},client_id` }), "Could not link client");
}

async function materialize(job) {
  const agreement = check(await db.from("agreement_requests").select("*").eq("id", job.agreementId).single(), "Could not load signed agreement");
  if (!agreement.signed_at || !agreement.sent_at) throw new Error(`Agreement ${job.agreementId} is not both sent and signed.`);

  const details = agreement.details ?? {};
  const primary = await findOrCreateClient({
    name: job.clientName,
    email: agreement.client_email,
    phone: details.phone ?? null,
    address: details.clientAddress ?? null,
  });
  const secondary = job.secondName ? await findOrCreateClient({
    name: job.secondName,
    email: details.secondSignerEmail ?? null,
    phone: details.secondSignerPhone ?? null,
  }) : null;

  await linkClient("agreement_clients", "agreement_request_id", agreement.id, primary.id, "primary");
  if (secondary) await linkClient("agreement_clients", "agreement_request_id", agreement.id, secondary.id, "secondary");

  const bookingValues = {
    token: randomBytes(24).toString("hex"),
    agreement_request_id: agreement.id,
    client_name: secondary ? `${primary.name} & ${secondary.name}` : primary.name,
    client_email: primary.email,
    shoot_type: job.shootType,
    start_at: job.startAt,
    end_at: job.endAt,
    location: job.location,
    total: String(job.total),
    deposit: details.deposit ?? "0",
    balance: String(job.total),
    stage: "editing",
    stage_override: false,
    delivery_due_date: job.deliveryDueDate,
    invoice_due_date: job.invoiceDueDate,
    invoice_discount: null,
    invoice_tax_rate: 0,
    updated_at: new Date().toISOString(),
  };
  const existingBooking = check(await db.from("bookings").select("*").eq("agreement_request_id", agreement.id).maybeSingle(), "Could not find linked booking");
  const booking = existingBooking
    ? check(await db.from("bookings").update({ ...bookingValues, token: existingBooking.token }).eq("id", existingBooking.id).select("*").single(), "Could not update booking")
    : check(await db.from("bookings").insert(bookingValues).select("*").single(), "Could not create booking");

  await linkClient("booking_clients", "booking_id", booking.id, primary.id, "primary");
  if (secondary) await linkClient("booking_clients", "booking_id", booking.id, secondary.id, "secondary");

  if (!booking.invoice_sent_at) {
    check(await db.from("invoice_line_items").delete().eq("booking_id", booking.id), "Could not replace invoice lines");
    check(await db.from("invoice_line_items").insert({ booking_id: booking.id, description: job.shootType, quantity: 1, unit_price: job.total, sort_order: 0 }), "Could not prepare invoice line");
  }

  const automationKey = `contract-backfill:${agreement.id}:full-payment`;
  const existingPayment = check(await db.from("payments").select("*").eq("automation_key", automationKey).maybeSingle(), "Could not find payment");
  const paymentValues = {
    booking_id: booking.id,
    client_name: booking.client_name,
    client_email: booking.client_email,
    amount: job.total,
    kind: "balance",
    paid_on: job.paymentDate,
    method: "interac",
    note: "Interac e-Transfer confirmed during contract-led admin backfill.",
    automation_key: automationKey,
  };
  const payment = existingPayment
    ? check(await db.from("payments").update(paymentValues).eq("id", existingPayment.id).select("*").single(), "Could not update payment")
    : check(await db.from("payments").insert(paymentValues).select("*").single(), "Could not create payment");

  const activeReceipt = check(await db.from("receipts").select("*").eq("payment_id", payment.id).is("voided_at", null).maybeSingle(), "Could not find receipt");
  if (!activeReceipt) {
    check(await db.from("receipts").insert({
      token: randomBytes(24).toString("hex"),
      booking_id: booking.id,
      payment_id: payment.id,
      amount: job.total,
      paid_on: job.paymentDate,
      method: "Interac e-Transfer",
    }), "Could not prepare receipt");
  }

  return { bookingId: booking.id, agreementId: agreement.id };
}

async function removeRachelTester() {
  const booking = check(await db.from("bookings").select("id,client_name,agreement_request_id").eq("id", RACHEL_BOOKING_ID).maybeSingle(), "Could not recheck Rachel booking");
  if (!booking) return "already absent";
  if (booking.client_name !== "Rachel" || booking.agreement_request_id) throw new Error("Rachel target no longer matches the isolated tester; refusing to delete it.");
  for (const table of ["payments", "booking_events", "invoice_line_items", "invoice_deliveries", "booking_clients", "receipts"]) {
    const result = await db.from(table).select("*", { count: "exact", head: true }).eq("booking_id", RACHEL_BOOKING_ID);
    if (result.error) throw new Error(`Could not recheck ${table}: ${result.error.message}`);
    if ((result.count ?? 0) > 0) throw new Error(`Rachel tester has dependent ${table}; refusing to delete it.`);
  }
  check(await db.from("bookings").delete().eq("id", RACHEL_BOOKING_ID), "Could not delete Rachel tester");
  return "deleted";
}

const created = [];
for (const job of jobs) created.push(await materialize(job));
const rachel = await removeRachelTester();
console.log(JSON.stringify({ jobs: created, rachel, emailsSent: 0 }, null, 2));
