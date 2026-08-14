import "server-only";
import { getAdminGalleries, getAdminInquiries, type GalleryRecord, type InquiryRecord } from "@/lib/admin-data";
import { getAdminBookings, type BookingWithLinks } from "@/lib/bookings";
import { getAdminAgreementRequests, type AgreementRequest } from "@/lib/agreements";
import { getAdminClientReviews, type ClientReview } from "@/lib/reviews";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { parseAmount } from "@/lib/utils";
import { normalizeClientEmail, titleCaseClientName } from "@/lib/client-names";
import { listPayments } from "@/lib/finance";

export type ClientProfile = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  inquiries: InquiryRecord[];
  bookings: BookingWithLinks[];
  galleries: GalleryRecord[];
  agreements: AgreementRequest[];
  reviews: ClientReview[];
  lastActivity: string | null;
  nextShootAt: string | null;
  outstandingBalance: number;
  hasUnsignedContract: boolean;
};

export type ClientSummary = {
  key: string;
  name: string;
  email: string | null;
  inquiryCount: number;
  bookingCount: number;
  galleryCount: number;
  agreementCount: number;
  lastActivity: string | null;
  nextShootAt: string | null;
  outstandingBalance: number;
  hasUnsignedContract: boolean;
};

function emailKey(email: string | null | undefined): string | null {
  return normalizeClientEmail(email);
}

function maxDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) >= new Date(b) ? a : b;
}

type Draft = {
  key: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  nameDate: string | null; // recency of the name source, to pick the freshest name
  inquiries: InquiryRecord[];
  bookings: BookingWithLinks[];
  galleries: GalleryRecord[];
  agreements: AgreementRequest[];
  reviews: ClientReview[];
};

type ProfileOverride = { name: string | null; email: string | null; phone: string | null; address: string | null; notes: string | null };

type CanonicalClient = ProfileOverride & {
  id: string;
  created_at: string;
  updated_at: string;
};

type ClientLink = {
  client_id: string;
  record_id: string;
};

async function getCanonicalClientData(): Promise<{
  clients: CanonicalClient[];
  agreementLinks: ClientLink[];
  bookingLinks: ClientLink[];
}> {
  const admin = getServiceRoleSupabaseClient();
  const [clientsResult, agreementResult, bookingResult] = await Promise.all([
    admin.from("clients").select("id,name,email,phone,address,notes,created_at,updated_at"),
    admin.from("agreement_clients").select("client_id,agreement_request_id"),
    admin.from("booking_clients").select("client_id,booking_id"),
  ]);
  if (clientsResult.error) throw new Error(clientsResult.error.message);
  if (agreementResult.error) throw new Error(agreementResult.error.message);
  if (bookingResult.error) throw new Error(bookingResult.error.message);
  return {
    clients: (clientsResult.data ?? []) as CanonicalClient[],
    agreementLinks: (agreementResult.data ?? []).map((row) => ({
      client_id: String(row.client_id),
      record_id: String(row.agreement_request_id),
    })),
    bookingLinks: (bookingResult.data ?? []).map((row) => ({
      client_id: String(row.client_id),
      record_id: String(row.booking_id),
    })),
  };
}

export async function createClient(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}): Promise<CanonicalClient> {
  const admin = getServiceRoleSupabaseClient();
  const email = normalizeClientEmail(input.email);
  if (email) {
    const { data: existing } = await admin.from("clients").select("id").ilike("email", email).maybeSingle();
    if (existing?.id) throw new Error("A client with this email already exists.");
  }
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("clients")
    .insert({
      name: titleCaseClientName(input.name),
      email,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: now,
    })
    .select("id,name,email,phone,address,notes,created_at,updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not add the client.");
  return data as CanonicalClient;
}

async function getProfileOverrides(): Promise<Map<string, ProfileOverride>> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("client_profile_overrides")
    .select("key,name,email,phone,address,notes");
  if (error) throw new Error(error.message);
  const map = new Map<string, ProfileOverride>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    map.set(String(row.key), {
      name: (row.name as string | null) ?? null,
      email: (row.email as string | null) ?? null,
      phone: (row.phone as string | null) ?? null,
      address: (row.address as string | null) ?? null,
      notes: (row.notes as string | null) ?? null,
    });
  }
  return map;
}

/**
 * Save the admin's corrections for a client profile. Only touches this
 * override table -- never rewrites the underlying gallery/booking/agreement
 * rows those fields were originally derived from, so historical records stay
 * exactly as they were when each was created or signed.
 */
export async function updateClientProfileOverride(
  key: string,
  input: { name?: string | null; email?: string | null; phone?: string | null; address?: string | null; notes?: string | null },
) {
  const admin = getServiceRoleSupabaseClient();
  const { data: canonical } = await admin.from("clients").select("id").eq("id", key).maybeSingle();
  if (canonical?.id) {
    const { error } = await admin
      .from("clients")
      .update({
        name: input.name?.trim() ?? "",
        email: normalizeClientEmail(input.email),
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", key);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await admin
    .from("client_profile_overrides")
    .upsert(
      {
        key,
        name: input.name?.trim() || null,
        email: normalizeClientEmail(input.email),
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  if (error) throw new Error(error.message);
}

/** Aggregate every client-linked record into one profile per person. */
async function buildProfiles(): Promise<Map<string, ClientProfile>> {
  const [galleries, inquiries, bookings, agreements, reviews, overrides, canonical, payments] = await Promise.all([
    getAdminGalleries(),
    getAdminInquiries(),
    getAdminBookings(),
    getAdminAgreementRequests(),
    getAdminClientReviews(),
    getProfileOverrides(),
    getCanonicalClientData(),
    listPayments(),
  ]);

  // Pass 1: map a known name to its email key, so name-only records (e.g. a
  // gallery without an email, or a review) merge into the right person.
  const nameToKey = new Map<string, string>();
  const emailToKey = new Map<string, string>();
  for (const client of canonical.clients) {
    const email = emailKey(client.email);
    const name = client.name?.trim().toLowerCase();
    if (email) emailToKey.set(email, client.id);
    if (name) nameToKey.set(name, client.id);
  }
  const remember = (name: string | null | undefined, email: string | null | undefined) => {
    const k = emailKey(email);
    const n = name?.trim().toLowerCase();
    const resolved = (k && emailToKey.get(k)) || k;
    if (resolved && n && !nameToKey.has(n)) nameToKey.set(n, resolved);
  };
  for (const g of galleries) remember(g.client_name, g.client_email);
  for (const i of inquiries) remember(i.name, i.email);
  for (const b of bookings) remember(b.client_name, b.client_email);
  for (const a of agreements) remember(a.client_name, a.client_email);

  const drafts = new Map<string, Draft>();
  const keyFor = (name: string | null | undefined, email: string | null | undefined): string | null => {
    const k = emailKey(email);
    if (k) return emailToKey.get(k) ?? k;
    const n = name?.trim().toLowerCase();
    if (!n) return null;
    return nameToKey.get(n) ?? `name:${n}`;
  };
  const draft = (key: string): Draft => {
    let d = drafts.get(key);
    if (!d) {
      d = { key, name: null, email: null, phone: null, address: null, notes: null, nameDate: null, inquiries: [], bookings: [], galleries: [], agreements: [], reviews: [] };
      drafts.set(key, d);
    }
    return d;
  };

  for (const client of canonical.clients) {
    const d = draft(client.id);
    d.name = client.name;
    d.email = client.email;
    d.phone = client.phone;
    d.address = client.address;
    d.notes = client.notes;
    d.nameDate = client.updated_at;
  }
  const setIdentity = (d: Draft, name: string | null | undefined, email: string | null | undefined, phone: string | null | undefined, date: string | null) => {
    if (!d.email && email?.trim()) d.email = email.trim();
    if (!d.phone && phone?.trim()) d.phone = phone.trim();
    // Keep the most recent non-empty name.
    if (name?.trim() && (!d.name || (date && (!d.nameDate || new Date(date) >= new Date(d.nameDate))))) {
      d.name = name.trim();
      d.nameDate = date;
    }
  };

  for (const i of inquiries) {
    const key = keyFor(i.name, i.email);
    if (!key) continue;
    const d = draft(key);
    setIdentity(d, i.name, i.email, i.phone, i.created_at);
    d.inquiries.push(i);
  }
  for (const g of galleries) {
    const key = keyFor(g.client_name, g.client_email);
    if (!key) continue;
    const d = draft(key);
    setIdentity(d, g.client_name, g.client_email, null, g.created_at);
    d.galleries.push(g);
  }
  for (const b of bookings) {
    const key = keyFor(b.client_name, b.client_email);
    if (!key) continue;
    const d = draft(key);
    setIdentity(d, b.client_name, b.client_email, null, b.created_at);
    d.bookings.push(b);
  }
  for (const a of agreements) {
    const key = keyFor(a.client_name, a.client_email);
    if (!key) continue;
    const d = draft(key);
    setIdentity(d, a.client_name, a.client_email, null, a.created_at);
    d.agreements.push(a);
  }

  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  for (const link of canonical.bookingLinks) {
    const linked = bookingById.get(link.record_id);
    const d = drafts.get(link.client_id);
    if (linked && d && !d.bookings.some((booking) => booking.id === linked.id)) d.bookings.push(linked);
  }
  const agreementById = new Map(agreements.map((agreement) => [agreement.id, agreement]));
  for (const link of canonical.agreementLinks) {
    const linked = agreementById.get(link.record_id);
    const d = drafts.get(link.client_id);
    if (linked && d && !d.agreements.some((agreement) => agreement.id === linked.id)) d.agreements.push(linked);
  }
  // Reviews carry no email; attribute by reviewer name.
  for (const r of reviews) {
    const key = keyFor(r.reviewer_name, null);
    if (!key) continue;
    const d = draft(key);
    setIdentity(d, r.reviewer_name, null, null, r.review_date);
    d.reviews.push(r);
  }

  const now = Date.now();
  const paidByBooking = new Map<string, number>();
  for (const payment of payments) {
    if (payment.booking_id) paidByBooking.set(payment.booking_id, (paidByBooking.get(payment.booking_id) ?? 0) + payment.amount);
  }
  const profiles = new Map<string, ClientProfile>();
  for (const d of drafts.values()) {
    let lastActivity: string | null = null;
    for (const i of d.inquiries) lastActivity = maxDate(lastActivity, i.created_at);
    for (const g of d.galleries) lastActivity = maxDate(lastActivity, g.created_at);
    for (const b of d.bookings) lastActivity = maxDate(lastActivity, b.created_at);
    for (const a of d.agreements) lastActivity = maxDate(lastActivity, a.created_at);
    for (const r of d.reviews) lastActivity = maxDate(lastActivity, r.review_date);

    let nextShootAt: string | null = null;
    for (const b of d.bookings) {
      if (b.start_at && new Date(b.start_at).getTime() >= now) {
        nextShootAt = nextShootAt && new Date(nextShootAt) <= new Date(b.start_at) ? nextShootAt : b.start_at;
      }
    }

    const outstandingBalance = d.bookings.reduce((sum, booking) => {
      const total = parseAmount(booking.total) ?? parseAmount(booking.balance) ?? 0;
      return sum + Math.max(0, total - (paidByBooking.get(booking.id) ?? 0));
    }, 0);
    const hasUnsignedContract = d.agreements.some((a) => !a.signed_at && !a.revoked_at);
    const override = overrides.get(d.key);

    profiles.set(d.key, {
      key: d.key,
      name: override?.name || d.name || override?.email || d.email || "Unknown",
      email: override?.email || d.email,
      phone: override?.phone || d.phone,
      address: override?.address || d.address || null,
      notes: override?.notes || d.notes || null,
      inquiries: d.inquiries,
      bookings: d.bookings,
      galleries: d.galleries,
      agreements: d.agreements,
      reviews: d.reviews,
      lastActivity,
      nextShootAt,
      outstandingBalance,
      hasUnsignedContract,
    });
  }
  return profiles;
}

export async function getClientList(): Promise<ClientSummary[]> {
  const profiles = await buildProfiles();
  return Array.from(profiles.values())
    .map((p) => ({
      key: p.key,
      name: p.name,
      email: p.email,
      inquiryCount: p.inquiries.length,
      bookingCount: p.bookings.length,
      galleryCount: p.galleries.length,
      agreementCount: p.agreements.length,
      lastActivity: p.lastActivity,
      nextShootAt: p.nextShootAt,
      outstandingBalance: p.outstandingBalance,
      hasUnsignedContract: p.hasUnsignedContract,
    }))
    .sort((a, b) => {
      const da = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const db = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return db - da;
    });
}

export async function getClientByKey(key: string): Promise<ClientProfile | null> {
  const profiles = await buildProfiles();
  return profiles.get(key) ?? null;
}
