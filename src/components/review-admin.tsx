"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Reply,
  Star,
  Trash2,
  Unplug,
  X,
} from "lucide-react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { ClientReview, ReviewRequest } from "@/lib/reviews";
import type { GoogleBusinessConnection } from "@/lib/google-business";
import {
  createReviewRequestAction,
  deleteReviewAction,
  disconnectGoogleBusinessAction,
  importGoogleReviewAction,
  replyToGoogleReviewAction,
  revokeReviewRequestAction,
  syncGoogleReviewsAction,
  toggleReviewApprovedAction,
  type ReviewActionState,
} from "@/app/admin/(protected)/reviews/actions";
import { formatCompactDate } from "@/lib/utils";

const initialState: ReviewActionState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";
const textareaClass =
  "min-h-28 rounded-md border border-admin-ink/12 bg-white/70 px-3 py-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";

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

/** Compact overview: connection status, last sync, and the sync/connect actions. */
function GoogleStatusCard({
  connection,
  isGoogleConfigured,
  connectedNotice,
  errorNotice,
  syncedCount,
}: {
  connection: GoogleBusinessConnection | null;
  isGoogleConfigured: boolean;
  connectedNotice?: string;
  errorNotice?: string;
  syncedCount: number;
}) {
  const [syncing, startSync] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const connected = Boolean(connection?.location_name);

  return (
    <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">Google Business Profile</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                connected ? "bg-admin-success/10 text-admin-success" : "bg-admin-ink/8 text-admin-ink/65"
              }`}
            >
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
          {connected ? (
            <div className="mt-1.5 text-sm leading-6 text-admin-ink/65">
              <p className="font-medium text-admin-ink">{connection?.location_title ?? "Business location"}</p>
              {connection?.connected_email ? <p>Signed in as {connection.connected_email}</p> : null}
              <p>
                {syncedCount} synced review{syncedCount === 1 ? "" : "s"} ·{" "}
                {connection?.last_synced_at
                  ? `Last synced ${formatCompactDate(connection.last_synced_at)}`
                  : "Not synced yet"}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 max-w-lg text-sm leading-6 text-admin-ink/65">
              {isGoogleConfigured
                ? "Connect your Google Business Profile to pull in real reviews automatically."
                : "Requires a one-time setup before it can connect. See below."}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {connected ? (
            <>
              <button
                type="button"
                disabled={syncing}
                onClick={() => {
                  startSync(async () => {
                    const result = await syncGoogleReviewsAction();
                    setSyncResult(result);
                  });
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface disabled:opacity-50"
              >
                {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Sync now
              </button>
              <button
                type="button"
                disabled={disconnecting}
                onClick={() => {
                  if (!confirm("Disconnect Google Business Profile? Synced reviews already on the site stay put.")) return;
                  startDisconnect(async () => {
                    await disconnectGoogleBusinessAction();
                  });
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-sm font-medium text-admin-ink/70 hover:bg-admin-ink/6 disabled:opacity-50"
              >
                {disconnecting ? <Loader2 className="size-3.5 animate-spin" /> : <Unplug className="size-3.5" />}
                Disconnect
              </button>
            </>
          ) : isGoogleConfigured ? (
            <a
              href="/api/admin/google-reviews/connect"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface"
            >
              Connect Google
            </a>
          ) : null}
        </div>
      </div>

      {connectedNotice ? (
        <p className="mt-4 rounded-md bg-admin-success/10 px-3 py-2 text-sm text-admin-success">
          {connectedNotice === "1"
            ? "Google Business Profile connected."
            : "Connected, but no location was found on this account. Reviews can't sync until a location exists."}
        </p>
      ) : null}
      {errorNotice ? (
        <p className="mt-4 rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger">
          {errorNotice === "not_configured"
            ? "Google isn't set up yet. See the setup steps below."
            : errorNotice === "invalid_state"
              ? "That connection attempt expired. Try connecting again."
              : `Google connection error: ${errorNotice}`}
        </p>
      ) : null}
      {syncResult ? (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            syncResult.ok ? "bg-admin-success/10 text-admin-success" : "bg-admin-danger/10 text-admin-danger"
          }`}
        >
          {syncResult.message}
        </p>
      ) : null}
      {connection?.last_sync_error && !syncResult ? (
        <p className="mt-4 rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger">
          Last sync failed: {connection.last_sync_error}
        </p>
      ) : null}

      <div className="mt-4 border-t border-admin-ink/10 pt-4">
        <button
          type="button"
          onClick={() => setSetupOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-admin-ink/60 hover:text-admin-ink"
        >
          <ChevronDown className={`size-3.5 transition-transform ${setupOpen ? "rotate-180" : ""}`} />
          {isGoogleConfigured ? "Connection details" : "Setup instructions"}
        </button>
        {setupOpen ? (
          <div className="mt-3 space-y-2 text-xs leading-5 text-admin-ink/65">
            {!isGoogleConfigured ? (
              <>
                <p>To enable this, you (or your developer) need to, once:</p>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>Create a Google Cloud project and enable the &quot;My Business API&quot; (reviews) plus the Account Management and Business Information APIs.</li>
                  <li>Request Business Profile API access at developers.google.com/my-business/content/prereqs. Google reviews this manually and it can take a few days.</li>
                  <li>Configure an OAuth consent screen and OAuth client (type: Web application).</li>
                  <li>Add this redirect URI to the OAuth client: your site origin + <code className="rounded bg-admin-ink/6 px-1">/api/admin/google-reviews/callback</code>.</li>
                  <li>Set <code className="rounded bg-admin-ink/6 px-1">GOOGLE_BUSINESS_CLIENT_ID</code> and <code className="rounded bg-admin-ink/6 px-1">GOOGLE_BUSINESS_CLIENT_SECRET</code> in the deployment environment.</li>
                </ol>
                <p>Once set, reload this page and a &quot;Connect Google&quot; button appears.</p>
              </>
            ) : (
              <>
                <p>Scope requested: business.manage.</p>
                <p>Reviews sync uses the legacy My Business API v4, which Google gates behind manual approval. If sync errors mention permission or access, that approval is still pending on Google&apos;s side.</p>
                {connection?.account_name ? <p>Account: {connection.account_name}</p> : null}
                {connection?.location_name ? <p>Location: {connection.location_name}</p> : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReviewRequestForm({ galleries }: { galleries: GalleryRecord[] }) {
  const [state, formAction] = useActionState(createReviewRequestAction, initialState);
  return (
    <form action={formAction} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">Request a review</h2>
      <p className="mt-1 text-sm leading-6 text-admin-ink/65">
        Creates a personal, trackable link. It thanks the client, then sends them to leave a Google review.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Linked gallery <span className="font-normal text-admin-ink/65">(optional)</span>
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
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Client email <span className="font-normal text-admin-ink/65">(optional)</span>
          <input className={inputClass} name="client_email" type="email" placeholder="client@example.com" />
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
          <p className="font-mono text-xs text-admin-ink/65 break-all">{state.reviewUrl}</p>
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
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
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
        Review date
        <input className={inputClass} name="review_date" type="date" required />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Source URL <span className="font-normal text-admin-ink/65">(optional)</span>
        <input className={inputClass} name="source_url" type="url" placeholder="Google review URL" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Linked request <span className="font-normal text-admin-ink/65">(optional)</span>
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
        Linked gallery <span className="font-normal text-admin-ink/65">(optional)</span>
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
        Google review ID <span className="font-normal text-admin-ink/65">(optional)</span>
        <input className={inputClass} name="google_review_id" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
        Review text
        <textarea className={textareaClass} name="review_text" required />
      </label>
      <label className="inline-flex items-center gap-2 text-sm text-admin-ink/65 sm:col-span-2">
        <input type="checkbox" name="approved" className="size-4 accent-admin-accent" />
        Approve for public site immediately
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button className="inline-flex min-h-11 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">
          Add review
        </button>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}

function ManualImportDisclosure({
  galleries,
  requests,
}: {
  galleries: GalleryRecord[];
  requests: ReviewRequest[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="text-base font-semibold tracking-tight">Add a review manually</span>
          <span className="mt-1 block text-sm leading-6 text-admin-ink/65">
            For a review Google hasn&apos;t synced yet, or from before you connected.
          </span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-admin-ink/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="mt-5 border-t border-admin-ink/10 pt-5">
          <GoogleReviewImportForm galleries={galleries} requests={requests} />
        </div>
      ) : null}
    </div>
  );
}

function ReplyBox({ review }: { review: ClientReview }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.owner_reply_text ?? "");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (review.owner_reply_text && !open) {
    return (
      <div className="mt-3 rounded-md bg-admin-ink/4 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-admin-ink/50">Your reply</p>
        <p className="mt-1 text-sm leading-6 text-admin-ink/75">{review.owner_reply_text}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-admin-ink/60 hover:text-admin-ink"
        >
          <Reply className="size-3.5" />
          Edit reply
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
      >
        <Reply className="size-3.5" />
        Reply
      </button>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Public reply, visible to anyone viewing this review on Google"
        className={textareaClass}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const res = await replyToGoogleReviewAction(review.id, review.google_review_id ?? "", text);
              setResult(res);
              if (res.ok) setOpen(false);
            });
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-admin-ink px-3 text-xs font-medium text-admin-surface disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Post reply
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-9 items-center rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
        >
          Cancel
        </button>
        {result && !result.ok ? <span className="text-xs text-admin-danger">{result.message}</span> : null}
      </div>
    </div>
  );
}

function ReviewRow({ review, canReply }: { review: ClientReview; canReply: boolean }) {
  const [pending, startTransition] = useTransition();
  const [approved, setApproved] = useState(review.approved);
  const [deleted, setDeleted] = useState(false);
  if (deleted) return null;

  const isSynced = Boolean(review.google_review_id?.includes("/reviews/"));

  return (
    <article className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{review.reviewer_name}</p>
            <RatingStars rating={review.rating} />
            <span className={`rounded-full px-2 py-0.5 text-xs ${approved ? "bg-admin-success/10 text-admin-success" : "bg-admin-ink/8 text-admin-ink/65"}`}>
              {approved ? "Public" : "Hidden"}
            </span>
            {isSynced ? (
              <span className="rounded-full bg-admin-info/10 px-2 py-0.5 text-xs text-admin-info">Synced</span>
            ) : null}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-admin-ink/70">&ldquo;{review.review_text}&rdquo;</p>
          <p className="mt-2 text-xs text-admin-ink/65">
            Google · {formatCompactDate(review.review_date)}{review.gallery_title ? ` · ${review.gallery_title}` : ""}
          </p>
          {canReply && isSynced ? <ReplyBox review={review} /> : null}
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
              if (!confirm("Delete this review from the site? This does not affect the review on Google.")) return;
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

function RequestRow({ request, siteOrigin }: { request: ReviewRequest; siteOrigin: string }) {
  const [pending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(Boolean(request.revoked_at));
  const [showLink, setShowLink] = useState(false);
  const url = `${siteOrigin}/review/${request.token}`;

  return (
    <article className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{request.client_name ?? request.gallery_title ?? "Review request"}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs ${revoked ? "bg-admin-status-danger-tint text-admin-status-danger" : "bg-admin-status-positive-tint text-admin-status-positive"}`}>
              {revoked ? "Revoked" : "Active"}
            </span>
            {request.viewed_at ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-admin-status-info-tint px-2 py-0.5 text-xs text-admin-info">
                <Eye className="size-3" aria-hidden="true" />
                Viewed
              </span>
            ) : null}
            {request.google_clicked_at ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-admin-status-info-tint px-2 py-0.5 text-xs text-admin-info">
                <MousePointerClick className="size-3" aria-hidden="true" />
                Google clicked
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-admin-ink/65">
            {request.gallery_title ?? "No gallery"} · Created {formatCompactDate(request.created_at)}
          </p>
          {showLink ? (
            <p className="mt-1 break-all font-mono text-xs text-admin-ink/35">{url}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowLink((v) => !v)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
          >
            <Link2 className="size-3.5" />
            {showLink ? "Hide link" : "Show link"}
          </button>
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

export function ReviewAdmin({
  galleries,
  requests,
  reviews,
  siteOrigin,
  googleReviewUrl,
  connection,
  isGoogleConfigured,
  connectedNotice,
  errorNotice,
}: {
  galleries: GalleryRecord[];
  requests: ReviewRequest[];
  reviews: ClientReview[];
  siteOrigin: string;
  googleReviewUrl: string | null;
  connection: GoogleBusinessConnection | null;
  isGoogleConfigured: boolean;
  connectedNotice?: string;
  errorNotice?: string;
}) {
  const canReply = Boolean(connection?.location_name);

  return (
    <div className="grid gap-8">
      {!googleReviewUrl ? (
        <div className="rounded-md border border-admin-copper/35 bg-admin-copper/10 p-4 text-sm leading-6 text-admin-ink">
          Add your Google review link in Settings before sending request links. The request page will
          still render, but its Google button will be disabled until that URL is saved.
        </div>
      ) : null}

      <GoogleStatusCard
        connection={connection}
        isGoogleConfigured={isGoogleConfigured}
        connectedNotice={connectedNotice}
        errorNotice={errorNotice}
        syncedCount={reviews.filter((r) => r.google_review_id?.includes("/reviews/")).length}
      />

      <ReviewRequestForm galleries={galleries} />

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
        <div className="mt-4 grid gap-3">
          {reviews.length ? reviews.map((review) => (
            <ReviewRow key={review.id} review={review} canReply={canReply} />
          )) : (
            <p className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 text-sm text-admin-ink/65">
              No reviews yet. Connect Google above to sync them in, or add one manually below.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Review requests</h2>
        <div className="mt-4 grid gap-3">
          {requests.length ? requests.map((request) => (
            <RequestRow key={request.id} request={request} siteOrigin={siteOrigin} />
          )) : (
            <p className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 text-sm text-admin-ink/65">
              No review requests yet.
            </p>
          )}
        </div>
      </section>

      <ManualImportDisclosure galleries={galleries} requests={requests} />
    </div>
  );
}
