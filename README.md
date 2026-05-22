This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cloudflare R2 photo storage (Phase 3B)

Photo originals live in a **private** Cloudflare R2 bucket. The app uploads from the
admin UI through a Next.js route handler (`POST /api/admin/photos/upload`) and serves
images on the public side with short-lived signed S3 URLs (1 hour TTL).

### One-time setup

1. **Create a Cloudflare account** at https://dash.cloudflare.com if you don't have one.
2. **Enable R2** — left sidebar → **R2 Object Storage** → follow the prompt (no card
   needed for the free tier).
3. **Create a bucket**:
   - Name: `nhp-photos` (or anything; this is your `R2_BUCKET_NAME`).
   - Location: pick the closest region (e.g. North America).
   - **Leave the bucket private** — do not enable public access.
4. **Create an R2 API token**:
   - R2 → **Manage R2 API Tokens** → **Create API Token**.
   - Permissions: **Object Read & Write**.
   - Specify bucket: select the one you just created (restricts the token's blast radius).
   - TTL: long-lived is fine for local dev.
   - Save the `Access Key ID` and `Secret Access Key` shown — they're only displayed once.
5. **Find your Account ID** — R2 dashboard, right sidebar shows "Account ID".
6. **Fill `.env.local`** (do not commit this file):

   ```
   R2_ACCOUNT_ID=<your account id>
   R2_ACCESS_KEY_ID=<from the token>
   R2_SECRET_ACCESS_KEY=<from the token>
   R2_BUCKET_NAME=nhp-photos
   ```

   `R2_PUBLIC_BASE_URL` and `R2_ENDPOINT` are optional. Leave them blank unless you set
   up a custom public domain in front of the bucket.

7. **Restart the dev server** (`npm run dev`) so the new env vars are picked up.

### What the app does

- **Upload** — admin selects/drops files in `/admin/galleries/[id]/photos`. The browser
  POSTs each file individually to `/api/admin/photos/upload`; that handler validates
  admin auth + file type/size, streams the file to R2 under
  `galleries/<gallery-id>/originals/<uuid>-<filename>`, and inserts a row into
  `public.photos` with the original key + EXIF-free dimensions read client-side.
- **Display** — public pages call `getPublicGalleryPhotosBySlug(slug)`, which generates
  a signed GET URL for each photo's `web_key` (fallback `original_key`) with a 1-hour
  TTL. Each page render gets fresh URLs.
- **Delete** — `deletePhoto` removes the row from Supabase, then deletes the underlying
  R2 objects (`original_key`, `web_key`, `thumbnail_key` if present).

### Known limitations / TODOs for later phases

- **Signed URLs in `next/image` are passed with `unoptimized`** so the URL signature
  survives. Once a public/CDN URL strategy is in place, drop `unoptimized` and let the
  Next Image Optimizer cache them.
- **No virus scan** — files are accepted as-is.
- **No drag-and-drop reorder.** Sort uses up/down arrow buttons against `sort_order`.

## Image processing pipeline (Phase 3C)

Phase 3C generates two derived variants per photo on upload so the public side
never serves the multi-MB original to render a grid tile.

### What gets generated

| Variant | Stored at | Max dimension (longest side) | Format | Quality | Notes |
|---|---|---|---|---|---|
| original | `galleries/<id>/originals/<uuid>-<safe>.<ext>` | unchanged | original | unchanged | private; used later for downloads |
| web | `galleries/<id>/web/<uuid>-<safe>.webp` | 2400 px | WebP | 85 | used by the display/lightbox |
| thumbnail | `galleries/<id>/thumbnails/<uuid>-<safe>.webp` | 600 px | WebP | 80 | used by the masonry grid |

- **All three variants live in the private R2 bucket** and are served via the same
  signed-URL mechanism. The bucket stays private. EXIF/GPS metadata is stripped by
  sharp's default (we call `.rotate()` first so portrait orientation is preserved).
- The variants are stored under separate prefixes; deleting a photo removes all
  three R2 objects.

### Library

[`sharp`](https://sharp.pixelplumbing.com/) is the runtime dependency. It's a native
binary that installs cleanly via npm on macOS and Vercel. `next.config.ts` lists
`sharp` in `serverExternalPackages` so Next leaves the binary alone when bundling.

### Backfilling existing photos

Photos uploaded before Phase 3C only have `original_key`. To generate their web +
thumbnail variants:

1. Open `/admin/galleries/<id>/photos`.
2. If any photos are missing variants, you'll see the "Original only" chip on
   their thumbnails and a "Generate missing variants (N)" button above the grid.
3. Click it. Each photo is processed one at a time; per-card chips switch from
   "Optimizing…" → "Optimized" (or "Failed", with the error tooltipped).
4. The button greys out when there's nothing left to backfill. Idempotent — safe
   to re-run.

The backfill route handler is `POST /api/admin/photos/[id]/backfill-variants`. It
downloads the original from R2, generates whatever variants are missing, uploads
them, and updates the row.

### Failure handling

- If sharp can't decode a file during upload, the route returns 422 and nothing
  is written.
- If any of the three R2 uploads fails after others succeed, the route deletes
  the partial uploads and returns 502 — no orphan files, no broken DB row.
- If the Supabase insert fails after R2 uploads, the R2 objects are also deleted.

## Public gallery viewing (Phase 3D)

The public gallery view (`/galleries/[slug]/view`) gets a polished, full-screen
lightbox.

### Components
- [`src/components/gallery-grid.tsx`](src/components/gallery-grid.tsx) — client
  wrapper around the masonry grid. Each tile is a button that opens the lightbox
  at that index. Grid renders **thumbnail** signed URLs (~45 KB tiles).
- [`src/components/gallery-lightbox.tsx`](src/components/gallery-lightbox.tsx) —
  full-screen modal. Renders **web** signed URLs (~440 KB images). Built on
  Framer Motion (already in deps — no new packages).
- [`src/components/copy-link-button.tsx`](src/components/copy-link-button.tsx) —
  small client component used by the toolbar's Share button.

### Lightbox capabilities
- **Open** by clicking/tapping a grid tile.
- **Close** via the top-right `X`, the `Escape` key, or the dialog backdrop.
- **Navigate** via the on-screen arrows, `ArrowLeft` / `ArrowRight`, or touch
  swipe (Framer Motion `drag="x"` with offset + velocity thresholds).
- **Counter** `01 / 12` top-left, tracked typography.
- **Loading state** — spinner over the image while it streams in.
- **Body scroll is locked** while open; restored on close.
- **Focus** returns to the previously focused element on close.
- **Reduced-motion** respected via `useReducedMotion` — transitions go to 0.
- **Accessibility** — `role="dialog"`, `aria-modal="true"`, descriptive
  `aria-label` per photo, ≥44 px tap targets.

### Image source rules (enforced by build-time grep in QA)
- Grid → `photo.thumbnailUrl` (signed URL to `thumbnail_key`)
- Lightbox → `photo.imageUrl` (signed URL to `web_key`)
- Original → never used for normal viewing. Reserved for future downloads.

### Toolbar
- **Share** copies the current page URL to clipboard and briefly shows
  "Link copied" feedback.
- **Slideshow** and **Downloads** are visually future-ready: muted styling,
  `aria-disabled="true"`, `tabIndex={-1}`, and a `title` tooltip explaining
  "coming in a future update". No accidental interaction.

### Known limitations
- **Signed URLs expire in 1 hour.** If a visitor leaves the lightbox open for
  longer than that, prev/next requests will 403. Acceptable for this phase;
  if it becomes a real concern, refresh the URL on focus or rotate keys.
- **Background click does not close the lightbox.** Decision: mobile-friendly
  fat-finger areas around the image shouldn't dismiss the modal. Users have
  the `X` button and Escape.
- **No deep-linking** to a specific photo in the URL hash. Candidate for a later
  phase if shareable per-photo links are wanted.
- **No autoplay slideshow** — the Slideshow toolbar button is a placeholder.

## Password-protected galleries (Phase 3E)

Galleries can require a password before visitors see any photos. Cover image,
title, and date are still visible on the gate page (premium teaser, like Pixieset).

### One-time setup

Two new env vars in `.env.local`:

```
GALLERY_ACCESS_SECRET=<openssl rand -hex 32>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
```

- `GALLERY_ACCESS_SECRET`: HMAC-signs the per-gallery access cookie. Must be
  ≥ 32 chars. Generate with `openssl rand -hex 32`. **Treat like a database
  password.** If it leaks, rotate it — every gallery's access cookies become
  invalid (visitors re-enter the password once).
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase dashboard → Project Settings → API →
  `service_role` key. Required to read photos for protected galleries
  (after the cookie is verified server-side). **Never exposed to the browser.**
  If this key leaks, rotate it in the Supabase dashboard immediately.

Then restart the dev server and apply
[`supabase/migrations/0004_phase_3e_password_protected_galleries.sql`](supabase/migrations/0004_phase_3e_password_protected_galleries.sql)
in the Supabase SQL Editor.

### Admin: setting/changing/removing a password
- Open `/admin/galleries/<id>`. Below the existing "Cover and access" section
  there's now a **Password protection** card.
- Type a password (≥ 4 chars) and save → the gallery becomes protected.
- To **change**: type a new password and save. (Field is blank by default so
  you don't accidentally overwrite.)
- To **remove**: tick the "Remove password" checkbox and save.
- A "Currently protected" pill appears in the form when a password is set.

### How visitors experience it
- `/galleries/[slug]` always renders the cover image, title, and date.
- If the gallery has a password, the right-side action card shows a
  **password gate** ("Private gallery — Enter the password to view…") with a
  password field and an **Enter gallery** button.
- On submit:
  - Correct password → a signed cookie `nhp_ga_<gallery-id>` is set
    (30-day TTL, httpOnly, sameSite=lax, secure in production), the page
    refreshes, and "View Gallery" appears.
  - Wrong password → "That password doesn't match. Try again." Generic message
    by design — no leak about whether the gallery exists or whether the
    password is "close".
- `/galleries/[slug]/view` checks the access cookie server-side. If missing or
  expired, it 307-redirects to the cover page (the gate).

### Security model
| Layer | Behavior for password-protected galleries |
|---|---|
| Postgres RLS on `photos` | Anon `SELECT` rejected — the existing policy requires `password_hash IS NULL`. |
| Public RPC `get_public_gallery_photos` | Returns 0 rows for password-protected galleries. |
| Public RPC `get_public_gallery_by_slug` | Returns gallery metadata (cover, title, date) regardless — needed for the teaser/gate. Also returns a `has_password` flag. |
| Cookie | Per-gallery, HMAC-SHA-256 signed, contains only `<expEpoch>.<sig>` — no password, no plaintext, no user identity. |
| Cookie scope | One gallery's cookie does not unlock another. Each gallery requires its own password entry. |
| Photo fetch when unlocked | Server uses the service-role client (private to the Node runtime) to read photos for the unlocked gallery. |
| Signed image URLs | Generated only after cookie verification. Never sent to the browser for locked galleries. |
| Stored password | Salted scrypt hash (`s1$<saltHex>$<keyHex>`). Plaintext is never persisted, logged, or echoed in responses. |
| Brute-force pacing | scrypt's cost (~60–100 ms per attempt) caps the attack rate. No rate-limit middleware yet — consider adding for production. |

### Known limitations
- **No per-IP rate limit** on the unlock endpoint. scrypt's cost limits brute
  force, but a determined attacker could still try password lists. Add edge
  rate limiting (Cloudflare WAF, Vercel Edge Middleware, or Upstash) when
  you go live.
- **No password reset email flow** — the admin must change it manually and
  share it with the client out-of-band.
- **No magic-link / one-time-link** alternative. Future option.
- **Cookies are domain-wide on `/`** so they persist across the whole site —
  fine because they're per-gallery-id-keyed.
- **No audit logging** of unlock attempts. The `gallery_access_logs` table
  exists from Phase 3A but isn't wired in yet.

## Access logging + rate limiting (Phase 3F)

Every password unlock attempt is recorded, and repeated failures from one
IP are blocked.

### Schema (migration 0005)
`public.gallery_access_logs` (from migration 0001) gains three columns:
- `user_agent text` — truncated to 256 chars
- `success boolean` — outcome
- `reason text` — one of `success` · `wrong_password` · `rate_limited` ·
  `unavailable_gallery` · `not_configured`

The previous "Public can create gallery access logs" anon-insert RLS policy is
**dropped** — all log writes now go through the server-only service-role
client inside the unlock action, so anon clients have no write access to the
log table at all.

Two indexes support common queries:
- `gallery_access_logs_rate_limit_idx` — partial index on
  `(gallery_id, ip_hash, accessed_at DESC) WHERE success = false`
- `gallery_access_logs_recent_idx`, `gallery_access_logs_gallery_recent_idx`
  — admin listing / per-gallery filtered listing

### What gets logged
| Field | Source | Notes |
|---|---|---|
| `gallery_id` | Lookup result | — |
| `ip_hash` | HMAC-SHA-256 of client IP using `GALLERY_ACCESS_SECRET`, first 16 hex chars | Raw IP is **never persisted** |
| `user_agent` | `User-Agent` header, truncated | — |
| `success` | `true` only after the password matched and the cookie was set | — |
| `reason` | One of the 5 enum values | Lets admin distinguish bad password vs. rate limit |
| `accessed_at` | Server clock | Auto via column default |
| `visitor_name` / `visitor_email` | `null` for now | Reserved for a later phase where visitors identify themselves |

**Never logged:** plaintext passwords, raw IPs, the `GALLERY_ACCESS_SECRET`,
the `SUPABASE_SERVICE_ROLE_KEY`, any password hash. Logging failures are
silently swallowed so a logging hiccup doesn't break the unlock UX.

### Rate limit
- **5 failed attempts per (gallery_id, ip_hash) in any rolling 10-minute window.**
- Enforced via Supabase (`select count(*) ... where success=false and accessed_at > now() - '10 minutes'`), so it works across serverless instances — no in-memory state.
- Checked **before** scrypt runs, so attackers can't burn server CPU.
- Rate-limited attempts are themselves logged (with reason `rate_limited`),
  so admins can see floods.
- Successes don't count against the limit.
- Public-facing message: *"Too many attempts. Please wait a few minutes and try again."*
  No detail leaked about whether the gallery exists or whether the password
  was close.

### IP extraction
Headers checked in order (first non-empty wins): `cf-connecting-ip` →
`x-vercel-forwarded-for` → `x-forwarded-for` (first IP in the chain) →
`x-real-ip`. In local dev where no proxy is present, the literal string
`"unknown"` is hashed, so rate limiting still works — coarser.

### Admin UI
**`/admin/access-logs`** (also linked from the admin sidebar).
- Top: 24-hour rollup (Attempts · Unlocked · Failed)
- Filter: dropdown to scope to one gallery (or "All galleries")
- Table: time · gallery (with link to edit page) · outcome pill · IP-hash
  (truncated, displayed as a fingerprint) · client (parsed browser + OS)
- Most recent 200 attempts shown; older rows stay in the DB.

### Known limitations
- **No purge / retention policy** — logs accumulate forever. Add a scheduled
  Supabase Edge function (or cron) to delete rows older than, say, 90 days.
- **`ip_hash` is deterministic per-secret** — rotating `GALLERY_ACCESS_SECRET`
  invalidates the link between hashes of the same IP before/after rotation
  (so rate-limit history effectively resets for everyone). That's acceptable
  because you'll only rotate on suspected secret leak.
- **No CAPTCHA or progressive challenge** — rate limit kicks in after 5
  failures and then sits silent. A determined attacker could rotate IPs to
  evade. For production, layer a CDN-level WAF (Cloudflare/Vercel) on top.
- **Rate-limit window is per (gallery, IP)**, not per visitor cookie/session.
  This is the right default but means a shared NAT might rate-limit one
  household after one user fat-fingers.

## Client selects (Phase 3G)

Visitors can heart photos in a gallery and submit their selections — the
photographer's workflow for proofs. No client accounts; just an email at
submission time.

### Schema (no new columns)
Reuses `public.favorite_sets` and `public.favorite_photos` from migration
0001. Migration 0006 only tightens RLS: drops the previous "Public can
create favorite sets" / "favorite photos" anon-insert policies so the only
writer is the server action (via service-role) which validates everything
first.

Adds indexes:
- `favorite_sets_gallery_recent_idx (gallery_id, created_at DESC)` for admin listing
- `favorite_photos_photo_idx (photo_id)` for future per-photo aggregates

### Visitor experience
- **Grid + lightbox**: each photo has a small heart button (top-right on
  desktop hover; always visible on mobile). Tapping toggles select state.
- **Persistence**: selections live in `localStorage` under
  `nhp_selects_<slug>`. They survive refresh, lightbox open/close, and tab
  navigation. No server round-trip until the visitor submits.
- **Toolbar**: a "My selects" pill in the gallery toolbar lights up with a
  count when one or more photos are selected. Tapping opens the review drawer.
- **Review drawer**: bottom sheet on mobile, side drawer on desktop. Shows
  selected thumbnails (X to remove individually), Name (optional), Email
  (required), Notes (optional), Send button. After submit: localStorage is
  cleared, drawer shows a calm "Your selects have been sent." confirmation.
- **Friendly language**: "Select", "Selected", "My selects" — not "Like" or
  "Favorite" — to keep it client-proofing, not social.

### Data flow
1. Visitor taps heart → React context adds id to set → localStorage write
2. Visitor opens drawer, reviews, fills email, clicks **Send**
3. Client calls server action `submitFavorites({slug, visitorName, visitorEmail, notes, photoIds})`
4. Server (via service-role):
   - Validates email shape, photo cap (≤ 500), notes cap (2000 chars)
   - Loads gallery: must be published, not archived, not expired
   - If `password_hash` is set: requires a valid `nhp_ga_<id>` access cookie
   - Loads the photo IDs and filters to only those that belong to the gallery AND `is_hidden = false`
   - Inserts one `favorite_sets` row, then bulk inserts `favorite_photos`
   - On any DB failure mid-flight, rolls back the partial set
5. Client clears localStorage and shows the confirmation screen

### Admin view
**`/admin/galleries/[id]/favorites`** (also linked from the gallery edit page
as "Client selects").
- Left rail: list of submissions, most recent first. Each row shows visitor
  name (or email if no name), email under it, time, and a photo count pill.
- Right pane: full detail for the active submission — visitor info, notes,
  thumbnails grid with filenames, **Copy filenames** button (newline-separated
  to clipboard), **CSV download** (`filename,photo_id` columns).

### Security checks (enforced server-side)
| Risk | Enforcement |
|---|---|
| Anon writes arbitrary favorite rows | Migration 0006 drops the open anon-insert policies. Only server (service-role) can write. |
| Submission for unpublished/archived/expired gallery | Action checks `is_published`, `is_archived`, `expires_at`. |
| Submission for password-protected gallery without unlock | Action calls `hasGalleryAccess(galleryId)` (HMAC cookie check). |
| Selecting hidden photos | Action filters submitted IDs against `photos` table with `is_hidden = false`. Hidden IDs are silently dropped. If nothing valid remains, the submission is rejected. |
| Selecting photos from a different gallery | Action filters by `gallery_id = <this gallery>`. Photos from other galleries are dropped. |
| Empty submission | Action rejects when no IDs remain after filtering. |
| Duplicate photo in one set | DB unique constraint `(favorite_set_id, photo_id)` plus client-side de-dupe. |
| Email leakage / spam | Email is the only PII collected and lives only in `favorite_sets`. Never logged or sent to the public. |
| RLS for reading | Admins only — preserved from migration 0001. |

### Known limitations
- **No rate limit on submission** — a script could spam favorite sets with valid emails. The 500-photo cap and email validation are the only built-in defenses. Add a CDN-level rate limit or extend the `gallery_access_logs` pattern to favorite submissions if abuse appears.
- **No spam/CAPTCHA** on the submit form.
- **No notification email** to the photographer when a new set is submitted (you have to check `/admin/galleries/[id]/favorites`).
- **Selections live only in `localStorage`** — visitor switching browsers/devices starts fresh.
- **No way for a visitor to revisit/edit a previously submitted set** — they'd just create a new one.
- **Photos deleted from the gallery vanish from the admin's submission view** — the join is left-only, so the visitor's selection still exists but with fewer thumbnails. Filename history isn't preserved separately.

## Selects email notification (Phase 3H-mini)

When a visitor submits a selects set, the photographer gets an email with the
visitor's name, email, count, filenames, notes, and a deep link into the
admin selects page.

### Provider
[Resend](https://resend.com) — free tier covers a single photographer's
volume (3k emails/month). Single dep: `resend`. No webhook handling required.

### Setup
1. Create a free Resend account → https://resend.com/signup
2. Generate an API key → https://resend.com/api-keys → copy the `re_...` string
3. (Optional but recommended for production) verify your sending domain in
   Resend so emails come from `you@nhihad.com` instead of `onboarding@resend.dev`
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   SELECTS_NOTIFICATION_TO=nhihadhassanphotography@gmail.com
   SELECTS_NOTIFICATION_FROM="Nhihad Hassan Photography <onboarding@resend.dev>"
   ```
   For a verified domain: replace the from address with `you@nhihad.com` (or
   similar) — the display name in `"Display <addr>"` format is supported.
5. Restart the dev server.

If **any** of the three env vars is missing, the submission flow still
succeeds — a console warning explains why no email was sent.

### What goes in the email
- Subject: `New selects from <visitor name or email> — <gallery title>`
- Visitor name, email (with `mailto:` link), submitted timestamp, photo count
- Notes (if provided), inside its own block
- Selected filenames (first 50, plus "and N more" if longer)
- A "Review in admin" button linking to
  `/admin/galleries/<id>/favorites?set=<setId>`
- `Reply-To: <visitor email>` so a direct reply lands in the visitor's inbox

### What never goes in the email
- Signed R2 image URLs (verified — only filenames; no R2 references)
- Visitor's IP address or IP hash
- Any password material, hashes, secrets, or API keys
- Gallery `password_hash` (only the title and slug)

### Failure behavior
- Missing config → log warning, return `{ sent: false, reason: "not_configured" }`, submission succeeds
- Provider returns an error → log warning, return `{ sent: false, reason: "send_failed" }`, submission succeeds
- Network exception → caught at two layers (`sendSelectsNotification` + the
  action's own try/catch), submission succeeds

The visitor never sees email errors. The photographer just doesn't get
notified that one time; the submission is still in the admin selects page.

### Known limitations
- **No queue / retry**: send is best-effort. If Resend is down at the moment
  of submission, that one email is lost (the data is still in Supabase).
- **No batching / digest**: every submission triggers a separate email.
- **No HTML email accessibility audit** beyond basic semantic structure.
- **`onboarding@resend.dev`** as a sender hits a daily rate cap in the free
  tier — verify your own domain for steady production use.

## Bulk downloads (Phase 3J)

Visitors can download all (or selected) photos from a gallery as a single ZIP
file. Streamed server-side, so memory stays bounded regardless of gallery size.

### Library
[`archiver`](https://www.npmjs.com/package/archiver) — standard Node ZIP
streaming. ZIP entries are written with `store: true` (no DEFLATE) because
JPEG/WebP are already compressed; this trades a tiny bit of size for
significantly higher throughput.

### Schema (migration 0007)
New table `public.gallery_download_logs` mirroring the access-logs design:
- `id`, `gallery_id` (FK, `on delete cascade`)
- `scope text check (scope in ('all', 'selects'))`
- `photo_count integer`
- `ip_hash text` — HMAC-SHA-256(IP, `GALLERY_ACCESS_SECRET`), 16 hex chars
- `user_agent text` — capped at 256 chars
- `success boolean`, `reason text`, `accessed_at timestamptz`
- RLS: admins read; no anon access (server writes via service-role).
- Indexes for recent / per-gallery listing.

### Route
**`POST /api/galleries/[slug]/download`**
- `runtime = "nodejs"`, `maxDuration = 300`
- Body (`multipart/form-data`):
  - `scope`: `all` | `selects` (required)
  - `photo_ids`: required when `scope=selects`, repeatable form field, max 500
- Behavior:
  1. Validates env (service-role + R2 configured) → 503 if not
  2. Loads the gallery; rejects unavailable (gone), `download_enabled=false`, or password-protected without unlock cookie
  3. Loads photos (filter to `is_hidden=false`; if scope=selects, also filter `id IN (...)`)
  4. Returns `Content-Type: application/zip` with `Content-Disposition: attachment` — the browser opens its native download dialog
  5. Logs the outcome (success or specific failure reason)
- File naming inside the ZIP: `001-IMG_1234.jpg`, prefixed by sort order to
  preserve grid order. Duplicate filenames get `IMG_1234 (2).jpg` suffixes.
  Quality (web vs full) follows the gallery's `download_quality` column.
- ZIP filename: `<slug>-<scope>-<YYYY-MM-DD>.zip`

### Security model
| Risk | Enforcement |
|---|---|
| Direct R2 URLs leaking to the visitor | All R2 reads happen server-side; the response is a single streamed ZIP. No signed URLs sent. |
| Download of password-protected gallery without unlock | Route checks `hasGalleryAccess(galleryId)` cookie. 401 + logged as `locked`. |
| Download of unavailable gallery (unpublished / archived / expired) | Rejected, logged as `unavailable_gallery`. |
| Download when admin has `download_enabled=false` | Rejected, logged as `not_enabled`. **UI also hides the button** in this case. |
| Hidden photos included in ZIP | Server filters `is_hidden=false`. UI doesn't expose them either. |
| Photos from other galleries via crafted `photo_ids` | Server filters `gallery_id = <this gallery>`. Foreign IDs silently dropped. |
| Anon writes to download log | Migration 0007 omits any anon insert policy. Only server (service-role) can write. |
| Raw IPs persisted | Never — same HMAC pattern as access logs. |
| Memory exhaustion from huge galleries | Photos are streamed one at a time into the archive; peak RAM is ~one photo (max ~50 MB). |

### Admin view
**`/admin/download-logs`** (linked from the sidebar) — same shape as access
logs: 24-hour rollup chips, gallery filter, table with timestamp · gallery ·
scope (all/selects) · photo count · outcome · IP-hash · client.

### Public UI
- **Toolbar "Download all (N)"** appears in `/galleries/[slug]/view` toolbar
  when `gallery.downloadEnabled && gallery.hasRealPhotos`. Disabled / hidden
  otherwise. Form-POSTs to the route; browser handles the download natively.
- **"Download" button in the selects drawer** appears when downloads are
  enabled and the visitor has selections. Independent of the "Send" form,
  so the visitor can download without sending the selects to the photographer.

### Known limitations
- **No rate limit on downloads** — a script could trigger many full
  downloads. Logging captures this; add a Cloudflare/Vercel rate-limit
  middleware before going to production.
- **Vercel function timeout** caps ZIP duration (10s hobby, 60s pro,
  300s pro+). Galleries with hundreds of full-resolution photos may exceed.
  For very large galleries, recommend the photographer use a presigned-URL
  manifest approach in a future phase.
- **No resumable downloads** — if the connection drops, the visitor restarts.
- **No on-the-fly compression of originals** — ZIP is store-only (assumes
  JPEG/WebP). Adding a non-photo file would inflate the archive.
- **`Content-Length` is unknown ahead of time** (streaming), so the browser
  shows an indeterminate progress bar.

## Rate limiting (Phase 3K)

Bulk downloads and favorites submissions now share the same Supabase-backed
rate-limit pattern as the password unlock action (Phase 3F). All limits are
storage-backed so they work correctly across serverless instances.

### Limits at a glance

| Endpoint | Limit | Window | What counts | Why this number |
|---|---|---|---|---|
| `POST /api/galleries/[slug]/download` | **10** | 10 min | All download attempts (success + failure) by (gallery_id, ip_hash) | A successful 5 GB download is the abuse case here, not failed ones; legit re-downloads happen, so we're a bit more lenient than unlock |
| `submitFavorites` server action | **5** | 10 min | All submission attempts (success + failure) by (gallery_id, ip_hash) | Matches the unlock limit; favorites are a deliberate action so 5 is plenty for a real visitor |
| Password unlock (Phase 3F) | 5 | 10 min | Failed attempts only | Brute-force = many fails; successes are fine |

### Schema (migration 0008)
- **`public.favorite_submission_logs`** — new table mirroring
  `gallery_access_logs` / `gallery_download_logs`. Columns: `gallery_id`
  (FK, `on delete cascade`), `ip_hash`, `user_agent`, `success`, `reason`,
  `accessed_at`. RLS: admin-read only; no anon access.
- Downloads reuse the existing `gallery_download_logs` table — no schema
  change needed there.

### Behavior on hit
- **Downloads**: route returns `429` + an `application/json` body with the
  cap message. A `rate_limited` row is logged.
- **Favorites**: server action returns `{ status: "error", message: "..." }`
  with the cap message. A `rate_limited` row is logged.
- Both errors are calm and informative: *"Too many … attempts. Please wait a
  few minutes (limit: N per M minutes)."* — no detail about whether the
  request would have otherwise succeeded.

### Reason vocabulary (extended in 3K)
| Endpoint | Reasons logged |
|---|---|
| Downloads | `success`, `not_enabled`, `locked`, `unavailable_gallery`, `empty`, `rate_limited`, `error`, `not_configured` |
| Favorites | `success`, `validation_error`, `invalid_email`, `empty_selection`, `too_many_photos`, `no_valid_photos`, `unavailable_gallery`, `locked`, `rate_limited`, `error`, `not_configured` |

### Where checks happen
Both checks run **after** the gallery lookup (so we have a stable
`gallery_id` for the log row) but **before** any expensive work (R2 reads,
ZIP streaming, scrypt-style hashing).

### Known limitations
- **No admin UI for `favorite_submission_logs`** in this phase. The data is
  in DB; surface a `/admin/favorite-submission-logs` page in a later
  iteration if you start seeing abuse patterns.
- **No log retention/purge job** — rows accumulate forever. Add a scheduled
  Supabase Edge function to delete rows > 90 days.
- **Shared NAT** can rate-limit a household after one over-eager user.
  Same trade-off as Phase 3F.
- **Rate limit operates per-process per-DB**, not per-edge-region — fine for
  Vercel/Supabase deployments where DB consistency is global.

## Payment workflow — Interac e-Transfer (Phase 3L)

Payments are handled **manually and offline** — no Stripe, no payment forms,
no card details ever touch this site. Stripe may be added as an optional future
phase if demand warrants it; for now the site stays cost-free to operate.

### How it works

| Step | Who | Action |
|---|---|---|
| 1 | Client | Submits inquiry via `/contact` |
| 2 | Photographer | Reviews in **Admin → Inquiries**, replies to confirm booking |
| 3 | Photographer | Sends Interac e-Transfer request to client's email for the deposit |
| 4 | Client | Completes e-Transfer through their bank |
| 5 | Photographer | Updates **Deposit status** on the gallery record |
| 6 | After event | Requests remaining balance via e-Transfer, marks **Paid in full** |

### Deposit status field

Added to the `public.galleries` table (migration 0009). Values and their
meaning:

| Value | Label | Meaning |
|---|---|---|
| `not_requested` | Not requested | Booking not yet confirmed |
| `requested` | Deposit requested | e-Transfer request sent to client |
| `received` | Deposit received | Deposit cleared |
| `balance_due` | Balance due | Gallery delivered; final payment outstanding |
| `paid` | Paid in full | All payments received |

The field is admin-only and never exposed publicly. The deposit status pill is
visible on the gallery list at **Admin → Galleries** for quick scanning.

### Payment notes field

A freeform text field (`payment_notes`) is also saved per gallery — useful for
scratchpad entries like *"sent $300 request May 20 · confirmed May 21"*. Also
admin-only; never exposed publicly.

### Inquiry confirmation copy

The public contact form success message now reads:

> *Your inquiry was sent. If we're a good fit, you'll hear back to confirm the
> booking — deposit payment instructions will be included in that reply via
> Interac e-Transfer.*

This sets the right expectation without mentioning any payment amount or
banking detail on the public site.

### Schema (migration 0009)
```sql
alter table public.galleries
  add column deposit_status text not null default 'not_requested'
    check (deposit_status in ('not_requested','requested','received','balance_due','paid')),
  add column payment_notes text;
```
Admin writes are still covered by the existing "Admins manage galleries"
policy. Migration `0010_harden_public_gallery_payment_fields.sql` also removes
the older broad public gallery table read policy so newly added admin-only
columns cannot be exposed by direct anonymous `galleries` selects. Public cover
pages continue to load through the curated `get_public_gallery_by_slug()` RPC,
which does not return payment fields.

### Future payment option (deferred)
Stripe Connect or a simple payment link can be wired in later without schema
changes — `deposit_status` values map naturally to Stripe webhook states.
No Stripe dependency is installed in this phase.

## Marketing + booking-conversion polish (Phase 4A)

Phase 4A turns the site from a *gallery delivery tool* into a *bookable
photography business*. No schema changes, no payment changes, no Stripe —
all updates are on the public marketing surface and stay inside the
existing premium dark/copper aesthetic.

### What changed

| Area | Change |
|---|---|
| **Hero copy** | Eyebrow updated from *"Toronto events, nightlife, portraits"* → *"Toronto weddings, couples, events, and nightlife"*; subtitle now leads with weddings/couples. |
| **Homepage** | The single nightlife-only spotlight was replaced with a five-card **Services grid** (Weddings → Couples & Engagements → Portraits → Events → Nightlife). A **Testimonials** section and a **bottom InquiryCallout** were added. |
| **/investment** (new route) | Single elegant page: hero, *How booking works* (5-step strip with explicit Interac e-Transfer line), services grid, per-service detail blocks, testimonials slot, bottom callout. **No dollar figures** — inquiry-based positioning. |
| **Header nav** | `Investment` added between `Portfolio` and `Client Gallery`. |
| **Mobile nav** | New full-screen drawer (`src/components/mobile-nav.tsx`) replaces the previous *"no mobile menu"* gap. Hamburger visible below `md`; closes on Escape, on item tap, and on the close button; body scroll locks while open. |
| **Footer** | Added `Investment` and `Contact` to secondary links. |
| **Portfolio + category pages** | Bottom `<InquiryCallout />` so visitors always have a way back to the inquiry form. |

### New files

- `src/data/services.ts` — five services with `id`, `label`, `shortBlurb`, `longBlurb`, `portfolioHref`, `imageId`. `imageId` references `portfolioItems` so cover photos are sourced without duplicating URLs.
- `src/data/testimonials.ts` — `Testimonial` type + **deliberately empty array**.
- `src/components/services-grid.tsx` — reusable 5-card grid (Reveal-wrapped) with `tone="dark" | "light"`.
- `src/components/testimonials.tsx` — server component. **Returns `null` when the array is empty** so the site never ships placeholder social proof.
- `src/components/inquiry-callout.tsx` — reusable bottom-of-page CTA banner with primary (Inquire) + secondary (See investment) actions.
- `src/components/mobile-nav.tsx` — client component, Framer Motion overlay, locks body scroll.
- `src/app/investment/page.tsx` — the new route.

### Testimonials — no fake reviews policy

`testimonials: Testimonial[]` ships as an empty array. The component returns
`null` until at least one real entry exists, so:

- The site **does not display placeholder reviews** on any page today.
- The moment the photographer drops a real testimonial into the array,
  every page that renders `<Testimonials />` (homepage + `/investment`)
  automatically picks it up — no code change required.

To add one, follow the shape commented in `src/data/testimonials.ts`:

```ts
{
  id: "miharmohian-2024-08",
  name: "Mihar & Mohian",
  shootType: "Wedding",
  quote: "...",
  location: "Toronto, ON",
  date: "August 2024",
}
```

### Pricing positioning

`/investment` is **inquiry-based** by design. There are no dollar figures
anywhere in the copy. The page explicitly states:

> *Bookings are confirmed manually. Deposit instructions are sent after
> booking confirmation via **Interac e-Transfer** — there is no checkout on
> this site.*

If exact pricing is added later, replace the **shortBlurb** / **longBlurb**
strings in `src/data/services.ts`; no component changes needed.

### What was deliberately NOT done

- **No new Supabase migration.** Phase 4A is public-side only.
- **No new portfolio categories.** The marketing surface maps the 5
  shoot types to the existing slugs (`weddings-couples`, `portraits`,
  `events`, `nightlife`, `lifestyle`) without renaming URLs or requiring
  new source images.
- **No Stripe / no checkout / no online payment.** Per the directive,
  payment remains manual Interac e-Transfer (Phase 3L).
- **No `/journal` blog scaffolding** — deferred to Phase 4H per the
  roadmap.
- **No admin-editable hero copy.** Hero / About copy still lives in source
  files for this phase; editing it requires a deploy.

## Brand assets

The "NH" monogram logo is the brand mark across the site.

| File | Purpose |
|---|---|
| `brand/nhp-logo-source.jpeg` | Master source (1563×1563, black-on-white, Canva export). Not web-served — kept in the repo so variants can be regenerated. |
| `public/logo-mark.png` | Monogram only, soft-white on transparent. Used in the site header badge. |
| `public/logo-lockup.png` | Full lockup (monogram + "NHIHAD HASSAN PHOTOGRAPHY"), soft-white on transparent. Used in the site footer. |
| `src/app/icon.png` | Favicon — monogram on an ink square. Auto-detected by Next.js App Router. |
| `src/app/apple-icon.png` | Apple touch icon — monogram on an ink square. Auto-detected. |

Notes:
- The web variants are tinted to the site's `--soft-white` (`#f7f3ed`),
  not pure white, so the logo matches body text exactly.
- Variants were generated from the source with `sharp`: trim the white
  border, isolate the monogram, convert white→transparent (inverted
  luminance as the alpha channel), and composite onto an ink square for
  the favicons. To regenerate after a logo change, re-run that transform
  against a replacement `brand/nhp-logo-source.jpeg`.
- The default Next.js `favicon.ico` was removed in favour of the branded
  `icon.png` (modern browsers fully support PNG icons).
