import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DepositStatus } from "@/lib/payment-constants";

export type { DepositStatus } from "@/lib/payment-constants";
export { DEPOSIT_STATUS_LABELS } from "@/lib/payment-constants";

export type GalleryRecord = {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  client_email: string | null;
  event_date: string | null;
  description: string | null;
  location: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_photo_id: string | null;
  is_public: boolean;
  is_published: boolean;
  is_archived: boolean;
  download_enabled: boolean;
  download_quality: "web" | "full";
  deposit_status: DepositStatus;
  payment_notes: string | null;
  expires_at: string | null;
  /** True when a password_hash is set. password_hash itself is never returned. */
  has_password: boolean;
  /** Stored for use in gallery invite emails only. Admin-only — never exposed publicly. */
  password_plain: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryInviteLogEntry = {
  id: string;
  gallery_id: string;
  sent_to: string;
  sent_at: string;
  resend_message_id: string | null;
};

type GalleryRow = Omit<GalleryRecord, "has_password"> & { password_hash: string | null };

function withHasPassword(row: GalleryRow): GalleryRecord {
  const { password_hash, ...rest } = row;
  return { ...rest, has_password: Boolean(password_hash) };
}

export type InquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  budget: string | null;
  referral_source: string | null;
  message: string;
  created_at: string;
};

const GALLERY_COLUMNS =
  "id,title,slug,client_name,client_email,event_date,description,location,cover_image_url,cover_image_alt,cover_photo_id,is_public,is_published,is_archived,download_enabled,download_quality,deposit_status,payment_notes,expires_at,password_hash,password_plain,created_at,updated_at";

export async function getAdminGalleries() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("galleries")
    .select(GALLERY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as GalleryRow[]).map(withHasPassword);
}

export async function getAdminGallery(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("galleries")
    .select(GALLERY_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? withHasPassword(data as GalleryRow) : null;
}

export async function getAdminInquiries() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("id,name,email,phone,event_type,event_date,location,budget,referral_source,message,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InquiryRecord[];
}

export async function getGalleryLastInvite(galleryId: string): Promise<GalleryInviteLogEntry | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("gallery_invite_log")
    .select("id,gallery_id,sent_to,sent_at,resend_message_id")
    .eq("gallery_id", galleryId)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Non-fatal — page still renders without invite history
    console.warn("[gallery-invite-log] query failed:", error.message);
    return null;
  }

  return data as GalleryInviteLogEntry | null;
}

export async function getAdminDashboardCounts() {
  const supabase = await createSupabaseServerClient();
  const [galleries, published, drafts, archived, inquiries] = await Promise.all([
    supabase.from("galleries").select("id", { count: "exact", head: true }),
    supabase
      .from("galleries")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("is_archived", false),
    supabase
      .from("galleries")
      .select("id", { count: "exact", head: true })
      .eq("is_published", false)
      .eq("is_archived", false),
    supabase.from("galleries").select("id", { count: "exact", head: true }).eq("is_archived", true),
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
  ]);

  return {
    galleries: galleries.count ?? 0,
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    archived: archived.count ?? 0,
    inquiries: inquiries.count ?? 0,
  };
}

