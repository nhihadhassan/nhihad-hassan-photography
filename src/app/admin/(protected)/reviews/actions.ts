"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  createClientReview,
  createReviewRequest,
  deleteClientReview,
  revokeReviewRequest,
  setClientReviewApproved,
} from "@/lib/reviews";
import { getAdminGallery } from "@/lib/admin-data";
import { siteUrl } from "@/lib/seo";

export type ReviewActionState = {
  status: "idle" | "success" | "error";
  message: string;
  reviewUrl?: string;
};

const reviewSchema = z.object({
  reviewer_name: z.string().trim().min(2, "Reviewer name is required."),
  rating: z.coerce.number().int().min(1).max(5),
  review_text: z.string().trim().min(10, "Review text is required."),
  review_date: z.string().trim().min(1, "Review date is required."),
  source_url: z.string().trim().url("Enter a valid Google review URL.").optional().or(z.literal("")),
  gallery_id: z.string().optional(),
  review_request_id: z.string().optional(),
  google_review_id: z.string().optional(),
  google_create_time: z.string().optional(),
  google_update_time: z.string().optional(),
});

const clean = (value: FormDataEntryValue | null) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

function publicReviewUrl(token: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  return `${origin}/review/${token}`;
}

export async function createReviewRequestAction(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  await requireAdmin();

  const galleryId = clean(formData.get("gallery_id"));
  const clientName = clean(formData.get("client_name"));
  const clientEmail = clean(formData.get("client_email"));
  const message = clean(formData.get("message"));

  try {
    const { token } = await createReviewRequest({
      galleryId,
      clientName,
      clientEmail,
      message,
      markSent: formData.get("mark_sent") === "on",
    });

    revalidatePath("/admin/reviews");
    if (galleryId) revalidatePath("/admin/galleries");

    return {
      status: "success",
      message: "Review request link created.",
      reviewUrl: publicReviewUrl(token),
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create review request.",
    };
  }
}

export async function createGalleryReviewRequestAction(
  galleryId: string,
): Promise<{ ok: boolean; message: string; reviewUrl?: string }> {
  await requireAdmin();

  const gallery = await getAdminGallery(galleryId);
  if (!gallery) {
    return { ok: false, message: "Gallery not found." };
  }

  try {
    const { token } = await createReviewRequest({
      galleryId,
      clientName: gallery.client_name,
      clientEmail: gallery.client_email,
      message: gallery.title,
      markSent: true,
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/admin/galleries");

    return {
      ok: true,
      message: "Review request link created.",
      reviewUrl: publicReviewUrl(token),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create review request.",
    };
  }
}

export async function importGoogleReviewAction(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  await requireAdmin();

  const parsed = reviewSchema.safeParse({
    reviewer_name: formData.get("reviewer_name"),
    rating: formData.get("rating"),
    review_text: formData.get("review_text"),
    review_date: formData.get("review_date"),
    source_url: formData.get("source_url") || undefined,
    gallery_id: formData.get("gallery_id") || undefined,
    review_request_id: formData.get("review_request_id") || undefined,
    google_review_id: formData.get("google_review_id") || undefined,
    google_create_time: formData.get("google_create_time") || undefined,
    google_update_time: formData.get("google_update_time") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the review fields.",
    };
  }

  try {
    await createClientReview({
      galleryId: clean(formData.get("gallery_id")),
      reviewRequestId: clean(formData.get("review_request_id")),
      reviewerName: parsed.data.reviewer_name,
      rating: parsed.data.rating,
      reviewText: parsed.data.review_text,
      reviewDate: parsed.data.review_date,
      sourceUrl: clean(formData.get("source_url")),
      approved: formData.get("approved") === "on",
      googleReviewId: clean(formData.get("google_review_id")),
      googleCreateTime: clean(formData.get("google_create_time")),
      googleUpdateTime: clean(formData.get("google_update_time")),
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/");

    return { status: "success", message: "Google review imported." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not import review.",
    };
  }
}

export async function toggleReviewApprovedAction(
  id: string,
  approved: boolean,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await setClientReviewApproved(id, approved);
    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { ok: true, message: approved ? "Review approved." : "Review hidden." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update review.",
    };
  }
}

export async function deleteReviewAction(id: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await deleteClientReview(id);
    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { ok: true, message: "Review deleted." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not delete review.",
    };
  }
}

export async function revokeReviewRequestAction(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await revokeReviewRequest(id);
    revalidatePath("/admin/reviews");
    return { ok: true, message: "Review request revoked." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not revoke request.",
    };
  }
}
