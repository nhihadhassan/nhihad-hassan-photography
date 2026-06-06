"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, Star, Trash2, X } from "lucide-react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { ClientReview, ReviewRequest } from "@/lib/reviews";
import {
  createReviewRequestAction,
  deleteReviewAction,
  importGoogleReviewAction,
  revokeReviewRequestAction,
  toggleReviewApprovedAction,
  type ReviewActionState,
} from "@/app/admin/(protected)/reviews/actions";
import { formatCompactDate } from "@/lib/utils";

const initialState: ReviewActionState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";
const textareaClass =
  "min-h-28 rounded-md border border-admin-ink/12 bg-white/70 px-3 py-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";

function StatusMessage({ state }: { state: ReviewActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={
        state.status === "success"
          ? "rounded-md bg-admin-success/10 px-3 py-2 text-sm text-admin-success"
          : "rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger"
      }
    >
      {state.message}
    </p>
  );
}

function CopyLink({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // No clipboard permission; the visible URL can still be selected.
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
    >
      {copied ? <Check className="size-3.5 text-admin-success" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-admin-accent" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${index < rating ? "fill-current" : "opacity-25"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function ReviewRequestForm({ galleries }: { galleries: GalleryRecord[] }) {
  const [state, formAction] = useActionState(createReviewRequestAction, initialState);
  return (
    <form action={formAction} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">Create review request</h2>
      <p className="mt-1 text-sm leading-6 text-admin-ink/55">
        Send every client to the same neutral Google-first request. No rating gate, no incentives.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Linked gallery
          <select className={inputClass} name="gallery_id">
            <option value="">No gallery</option>
            {galleries.map((gallery) => (
              <option key={gallery.id} value={gallery.id}>
                {gallery.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client name
          <input className={inputClass} name="client_name" placeholder="Jane & Mark" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client email <span className="font-normal text-admin-ink/40">(optional)</span>
          <input className={inputClass} name="client_email" type="email" placeholder="client@example.com" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Internal note
          <input className={inputClass} name="message" placeholder="Wedding gallery delivered" />
        </label>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-admin-ink/65">
        <input type="checkbox" name="mark_sent" defaultChecked className="size-4 accent-admin-accent" />
        Mark as sent/copied now
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-11 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">
          Create request link
        </button>
        <StatusMessage state={state} />
      </div>
      {state.reviewUrl ? (
        <div className="mt-4 rounded-md border border-admin-ink/10 bg-white/60 p-3">
          <p className="font-mono text-xs text-admin-ink/50">{state.reviewUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyLink value={state.reviewUrl} />
            <a
              href={state.reviewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
            >
              <ExternalLink className="size-3.5" />
              Open
            </a>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function GoogleReviewImportForm({
  galleries,
  requests,
}: {
  galleries: GalleryRecord[];
  requests: ReviewRequest[];
}) {
  const [state, formAction] = useActionState(importGoogleReviewAction, initialState);
  return (
    <form action={formAction} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">Import Google review</h2>
      <p className="mt-1 text-sm leading-6 text-admin-ink/55">
        Paste only real Google reviews. Imported reviews stay hidden unless approved.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Reviewer name
          <input className={inputClass} name="reviewer_name" required placeholder="Client name from Google" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Rating
          <select className={inputClass} name="rating" defaultValue="5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} star{rating === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Google review date
          <input className={inputClass} name="review_date" type="date" required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Source URL
          <input className={inputClass} name="source_url" type="url" placeholder="Google review URL" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Linked request
          <select className={inputClass} name="review_request_id">
            <option value="">No request</option>
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                {request.client_name ?? request.gallery_title ?? "Review request"} · {formatCompactDate(request.created_at)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Linked gallery
          <select className={inputClass} name="gallery_id">
            <option value="">No gallery</option>
            {galleries.map((gallery) => (
              <option key={gallery.id} value={gallery.id}>
                {gallery.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Google review ID <span className="font-normal text-admin-ink/40">(future API sync)</span>
          <input className={inputClass} name="google_review_id" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Google create time <span className="font-normal text-admin-ink/40">(future API sync)</span>
          <input className={inputClass} name="google_create_time" type="datetime-local" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Review text
          <textarea className={textareaClass} name="review_text" required />
        </label>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-admin-ink/65">
        <input type="checkbox" name="approved" className="size-4 accent-admin-accent" />
        Approve for public site immediately
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-11 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">
          Import review
        </button>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}

function RequestRow({ request, siteOrigin }: { request: ReviewRequest; siteOrigin: string }) {
  const [pending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(Boolean(request.revoked_at));
  const url = `${siteOrigin}/review/${request.token}`;
  return (
    <article className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{request.client_name ?? request.gallery_title ?? "Review request"}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs ${revoked ? "bg-admin-danger/10 text-admin-danger" : "bg-admin-success/10 text-admin-success"}`}>
              {revoked ? "Revoked" : "Active"}
            </span>
          </div>
          <p className="mt-1 text-sm text-admin-ink/55">
            {request.gallery_title ?? "No gallery"} · Created {formatCompactDate(request.created_at)}
          </p>
          <p className="mt-1 font-mono text-xs text-admin-ink/35">{url}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-admin-ink/45">
            <span>Viewed: {request.viewed_at ? formatCompactDate(request.viewed_at) : "No"}</span>
            <span>Google clicked: {request.google_clicked_at ? formatCompactDate(request.google_clicked_at) : "No"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyLink value={url} />
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6">
            <ExternalLink className="size-3.5" />
            Open
          </a>
          {!revoked ? (
            <button
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await revokeReviewRequestAction(request.id);
                  if (result.ok) setRevoked(true);
                });
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-danger/20 px-3 text-xs font-medium text-admin-danger hover:bg-admin-danger/8 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              Revoke
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ReviewRow({ review }: { review: ClientReview }) {
  const [pending, startTransition] = useTransition();
  const [approved, setApproved] = useState(review.approved);
  const [deleted, setDeleted] = useState(false);
  if (deleted) return null;
  return (
    <article className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{review.reviewer_name}</p>
            <RatingStars rating={review.rating} />
            <span className={`rounded-full px-2 py-0.5 text-xs ${approved ? "bg-admin-success/10 text-admin-success" : "bg-admin-ink/8 text-admin-ink/50"}`}>
              {approved ? "Public" : "Hidden"}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-admin-ink/70">“{review.review_text}”</p>
          <p className="mt-2 text-xs text-admin-ink/45">
            Google · {formatCompactDate(review.review_date)}{review.gallery_title ? ` · ${review.gallery_title}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {review.source_url ? (
            <a href={review.source_url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6">
              <ExternalLink className="size-3.5" />
              Google
            </a>
          ) : null}
          <button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await toggleReviewApprovedAction(review.id, !approved);
                if (result.ok) setApproved(!approved);
              });
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6 disabled:opacity-50"
          >
            {approved ? "Hide" : "Approve"}
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete this imported review?")) return;
              startTransition(async () => {
                const result = await deleteReviewAction(review.id);
                if (result.ok) setDeleted(true);
              });
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-danger/20 px-3 text-xs font-medium text-admin-danger hover:bg-admin-danger/8 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export function ReviewAdmin({
  galleries,
  requests,
  reviews,
  siteOrigin,
  googleReviewUrl,
}: {
  galleries: GalleryRecord[];
  requests: ReviewRequest[];
  reviews: ClientReview[];
  siteOrigin: string;
  googleReviewUrl: string | null;
}) {
  return (
    <div className="grid gap-8">
      {!googleReviewUrl ? (
        <div className="rounded-md border border-admin-copper/35 bg-admin-copper/10 p-4 text-sm leading-6 text-admin-ink">
          Add your Google review link in Settings before sending request links. The request page will
          still render, but its Google button will be disabled until that URL is saved.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ReviewRequestForm galleries={galleries} />
        <GoogleReviewImportForm galleries={galleries} requests={requests} />
      </div>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Imported reviews</h2>
        <div className="mt-4 grid gap-3">
          {reviews.length ? reviews.map((review) => <ReviewRow key={review.id} review={review} />) : (
            <p className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 text-sm text-admin-ink/55">
              No Google reviews imported yet.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Review request links</h2>
        <div className="mt-4 grid gap-3">
          {requests.length ? requests.map((request) => (
            <RequestRow key={request.id} request={request} siteOrigin={siteOrigin} />
          )) : (
            <p className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 text-sm text-admin-ink/55">
              No review requests yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
