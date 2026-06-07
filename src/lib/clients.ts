import "server-only";
import { getAdminGalleries, getAdminInquiries, type GalleryRecord, type InquiryRecord } from "@/lib/admin-data";
import { getAdminBookings, type BookingWithLinks } from "@/lib/bookings";
import { getAdminAgreementRequests, type AgreementRequest } from "@/lib/agreements";
import { getAdminClientReviews, type ClientReview } from "@/lib/reviews";
import { parseAmount } from "@/lib/utils";

export type ClientProfile = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
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
  lastActivity: string | null;
  nextShootAt: string | null;
  outstandingBalance: number;
  hasUnsignedContract: boolean;
};

function emailKey(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase();
  return e || null;
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
  nameDate: string | null; // recency of the name source, to pick the freshest name
  inquiries: InquiryRecord[];
  bookings: BookingWithLinks[];
  galleries: GalleryRecord[];
  agreements: AgreementRequest[];
  reviews: ClientReview[];
};

/** Aggregate every client-linked record into one profile per person. */
async function buildProfiles(): Promise<Map<string, ClientProfile>> {
  const [galleries, inquiries, bookings, agreements, reviews] = await Promise.all([
    getAdminGalleries(),
    getAdminInquiries(),
    getAdminBookings(),
    getAdminAgreementRequests(),
    getAdminClientReviews(),
  ]);

  // Pass 1: map a known name to its email key, so name-only records (e.g. a
  // gallery without an email, or a review) merge into the right person.
  const nameToKey = new Map<string, string>();
  const remember = (name: string | null | undefined, email: string | null | undefined) => {
    const k = emailKey(email);
    const n = name?.trim().toLowerCase();
    if (k && n && !nameToKey.has(n)) nameToKey.set(n, k);
  };
  for (const g of galleries) remember(g.client_name, g.client_email);
  for (const i of inquiries) remember(i.name, i.email);
  for (const b of bookings) remember(b.client_name, b.client_email);
  for (const a of agreements) remember(a.client_name, a.client_email);

  const drafts = new Map<string, Draft>();
  const keyFor = (name: string | null | undefined, email: string | null | undefined): string | null => {
    const k = emailKey(email);
    if (k) return k;
    const n = name?.trim().toLowerCase();
    if (!n) return null;
    return nameToKey.get(n) ?? `name:${n}`;
  };
  const draft = (key: string): Draft => {
    let d = drafts.get(key);
    if (!d) {
      d = { key, name: null, email: null, phone: null, nameDate: null, inquiries: [], bookings: [], galleries: [], agreements: [], reviews: [] };
      drafts.set(key, d);
    }
    return d;
  };
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
  // Reviews carry no email; attribute by reviewer name.
  for (const r of reviews) {
    const key = keyFor(r.reviewer_name, null);
    if (!key) continue;
    const d = draft(key);
    setIdentity(d, r.reviewer_name, null, null, r.review_date);
    d.reviews.push(r);
  }

  const now = Date.now();
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

    const outstandingBalance = d.bookings.reduce((sum, b) => sum + (parseAmount(b.balance) ?? 0), 0);
    const hasUnsignedContract = d.agreements.some((a) => !a.signed_at && !a.revoked_at);

    profiles.set(d.key, {
      key: d.key,
      name: d.name ?? d.email ?? "Unknown",
      email: d.email,
      phone: d.phone,
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
