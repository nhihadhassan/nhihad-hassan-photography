# Private Launch Checklist — Phase 5A

> **Status**: Pre-launch QA audit. Work through each section before sending the first real gallery link.  
> Mark items ✅ as you verify them. Items flagged 🚨 are blockers; items flagged ⚠️ are strong recommendations.

---

## 1. Environment & Secrets

| # | Check | Status |
|---|-------|--------|
| 1.1 | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) set in Vercel | ☐ |
| 1.2 | `SUPABASE_SERVICE_ROLE_KEY` set in Vercel — required for admin, gallery access, share links | ☐ |
| 1.3 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` set — required for photo uploads and downloads | ☐ |
| 1.4 | `GALLERY_ACCESS_SECRET` set and ≥ 32 chars (generate: `openssl rand -hex 32`) — required for password-protected gallery cookies | ☐ |
| 1.5 | `RESEND_API_KEY`, `SELECTS_NOTIFICATION_TO`, `SELECTS_NOTIFICATION_FROM` set — required for selects notifications and gallery invite emails | ☐ |
| 1.6 | `NEXT_PUBLIC_SITE_URL=https://nhihadhassan.ca` set in Vercel — used for share link URL generation | ☐ |
| 1.7 | `.env.local` is listed in `.gitignore` — verified no secrets have been committed | ☐ |
| 1.8 | `Website pics/` is listed in `.gitignore` — source originals not committed | ☐ |
| 1.9 | No `STRIPE_*`, `STRIPE_WEBHOOK_SECRET`, or payment-processor secrets present anywhere — Stripe is not installed | ☐ |

---

## 2. Supabase Database Migrations

All 14 migrations must be applied to the **production** Supabase project before launch.

| Migration | Description | Applied |
|-----------|-------------|---------|
| 0001_initial_schema | Core tables: profiles, galleries, photos, inquiries | ☐ |
| 0002_phase_3a_admin_gallery_crud | Gallery CRUD, RLS, admin policies | ☐ |
| 0003_phase_3b_photo_storage | Photos table, RLS | ☐ |
| 0004_phase_3e_password_protected_galleries | `password_hash` column, gallery access | ☐ |
| 0005_phase_3f_access_logging | `gallery_access_logs` table + RLS | ☐ |
| 0006_phase_3g_favorites | `photo_favorites`, `favorite_submissions` tables + RLS | ☐ |
| 0007_phase_3j_download_logs | `download_logs` table + RLS | ☐ |
| 0008_phase_3k_rate_limits | Rate-limit support columns | ☐ |
| 0009_payment_deposit_status | `deposit_status`, `payment_notes` columns | ☐ |
| 0010_harden_public_gallery_payment_fields | RLS hardening for payment fields | ☐ |
| 0011_gallery_invite_email | `client_email` nullable relaxation | ☐ |
| 0012_share_links | 🚨 `gallery_share_links` + `gallery_share_link_photos` tables | ☐ |
| 0013_download_pin | 🚨 `download_pin_hash`, `download_limit`, `download_count` columns | ☐ |
| 0014_watermark | 🚨 `watermark_enabled` column | ☐ |

> **Note**: Migrations 0012–0014 were added in Phase 4D–4I. If the production DB was last updated for Phase 4C, apply these three via the Supabase SQL editor.

---

## 3. Admin Account

| # | Check | Status |
|---|-------|--------|
| 3.1 | Admin user created in Supabase Auth (email + password) | ☐ |
| 3.2 | `profiles` row exists for that user with `role = 'admin'` | ☐ |
| 3.3 | Login at `/admin/login` works with those credentials | ☐ |
| 3.4 | Admin session persists correctly — refresh does not log you out | ☐ |
| 3.5 | Visiting `/admin` without a session redirects to `/admin/login` | ☐ |

---

## 4. Security & Access Controls

| # | Check | Status |
|---|-------|--------|
| 4.1 | `/admin/*` routes all redirect to login when unauthenticated — no data leaked | ☐ |
| 4.2 | `/api/admin/*` returns 4xx when `SUPABASE_SERVICE_ROLE_KEY` is absent | ☐ |
| 4.3 | Gallery password protection works end-to-end: wrong password blocked, correct password grants cookie-based access | ☐ |
| 4.4 | Password hash is never returned in any public API response — only `has_password: boolean` is surfaced | ☐ |
| 4.5 | Download PIN (if set) blocks download without the correct PIN | ☐ |
| 4.6 | Download PIN hash is not visible in any client-facing response | ☐ |
| 4.7 | Gallery access cookie uses HMAC (`GALLERY_ACCESS_SECRET`) — verify in DevTools → Application → Cookies | ☐ |
| 4.8 | Share links: revoked/expired tokens show "Link unavailable" — no photo data returned | ☐ |
| 4.9 | RLS is enabled on all custom tables (verified in Supabase dashboard → Table Editor → each table → RLS) | ☐ |
| 4.10 | `gallery_invite_email` route does NOT log the plain-text gallery password to console | ☐ |
| 4.11 | IP addresses are hashed before storage in access/download logs — no raw IPs committed | ☐ |
| 4.12 | R2 bucket is **not** public (no `R2_PUBLIC_BASE_URL` pointed at the raw bucket) — all photo reads use signed URLs expiring in 1 hour | ☐ |

---

## 5. Core User Flows

### 5.1 Public Portfolio & Marketing

| # | Check | Status |
|---|-------|--------|
| 5.1.1 | Homepage loads at `/` — hero image shows, eyebrow reads "Toronto weddings, couples, events, and nightlife" | ☐ |
| 5.1.2 | Services grid shows 5 cards in order: Weddings, Couples & Engagements, Portraits, Events, Nightlife | ☐ |
| 5.1.3 | Testimonials section renders nothing (empty array) — no placeholder text visible | ☐ |
| 5.1.4 | `/portfolio` loads with all 5 category cards and InquiryCallout at bottom | ☐ |
| 5.1.5 | `/portfolio/weddings-couples` loads with correct images and InquiryCallout | ☐ |
| 5.1.6 | `/investment` loads — no `$` or price figures visible anywhere on the page | ☐ |
| 5.1.7 | `/investment` mentions "Interac e-Transfer" in the How Booking Works section | ☐ |
| 5.1.8 | `/mini-sessions` loads with 3 session cards and FAQ section | ☐ |
| 5.1.9 | `/contact` loads — form visible, email/Instagram links correct | ☐ |
| 5.1.10 | Contact form submits successfully — confirmation message mentions Interac e-Transfer | ☐ |
| 5.1.11 | `/journal` lists 3 published posts with dates | ☐ |
| 5.1.12 | Each journal post (`/journal/[slug]`) loads with full article body | ☐ |

### 5.2 Mobile Navigation

| # | Check | Status |
|---|-------|--------|
| 5.2.1 | At 375 px width: hamburger icon visible, desktop nav hidden | ☐ |
| 5.2.2 | Hamburger opens drawer with all nav items + "Inquire" CTA | ☐ |
| 5.2.3 | Drawer closes on Escape key | ☐ |
| 5.2.4 | Drawer closes on nav item click (navigates correctly) | ☐ |
| 5.2.5 | Body scroll is locked while drawer is open | ☐ |

### 5.3 Gallery Client Flow

| # | Check | Status |
|---|-------|--------|
| 5.3.1 | Create a test gallery in admin with a password | ☐ |
| 5.3.2 | Upload 2–3 test photos to the gallery | ☐ |
| 5.3.3 | Publish the gallery | ☐ |
| 5.3.4 | Visit `/galleries/[slug]` — password gate appears | ☐ |
| 5.3.5 | Enter correct password — gallery grid loads with thumbnails | ☐ |
| 5.3.6 | Lightbox opens on photo click — arrow keys navigate, Escape closes | ☐ |
| 5.3.7 | Heart a photo — it appears in the selects drawer | ☐ |
| 5.3.8 | Submit selects with name + email + optional note | ☐ |
| 5.3.9 | Selects notification email arrives in `SELECTS_NOTIFICATION_TO` inbox | ☐ |
| 5.3.10 | Admin receives the selects notification with correct filenames and admin link | ☐ |

### 5.4 Download Flow

| # | Check | Status |
|---|-------|--------|
| 5.4.1 | Enable downloads on the test gallery (web quality) | ☐ |
| 5.4.2 | "Download all" button appears in the gallery view | ☐ |
| 5.4.3 | Download triggers a ZIP — files inside are WebP, not originals | ☐ |
| 5.4.4 | "Download selects" — only hearted photos appear in ZIP | ☐ |
| 5.4.5 | Rate limit: submitting 4+ rapid downloads returns 429 | ☐ |
| 5.4.6 | Download log entry appears in `/admin/download-logs` | ☐ |

### 5.5 Gallery Invite Email

| # | Check | Status |
|---|-------|--------|
| 5.5.1 | In admin gallery detail → send invite email to a test address | ☐ |
| 5.5.2 | Email arrives with correct gallery title, gallery URL, and (if set) password block | ☐ |
| 5.5.3 | "Open your gallery →" CTA links to the correct `/galleries/[slug]` URL, not `/admin` | ☐ |
| 5.5.4 | Email does NOT expose the password hash — only the plain-text password passed from admin | ☐ |

### 5.6 Share Links

| # | Check | Status |
|---|-------|--------|
| 5.6.1 | Navigate to gallery → "Share links" in admin | ☐ |
| 5.6.2 | Select photos and create a share link with a title | ☐ |
| 5.6.3 | Visit the generated `/share/[token]` URL in an incognito window | ☐ |
| 5.6.4 | Share page shows brand header, photo grid, and footer — no admin chrome | ☐ |
| 5.6.5 | Lightbox works on the share page — arrows, Escape, counter visible | ☐ |
| 5.6.6 | Revoke the link in admin — revisiting the URL shows "Link unavailable" | ☐ |
| 5.6.7 | Set an expiry in the past — visiting shows "Link unavailable" | ☐ |

### 5.7 Watermark

| # | Check | Status |
|---|-------|--------|
| 5.7.1 | Enable "Watermark previews" on a gallery | ☐ |
| 5.7.2 | Upload a photo — web variant in R2 has the "Nhihad Hassan Photography" watermark visible bottom-right | ☐ |
| 5.7.3 | Original (non-watermarked) is stored but not accessible via any public URL | ☐ |

---

## 6. Admin Pages

| # | Check | Status |
|---|-------|--------|
| 6.1 | `/admin/galleries` lists all galleries with correct status chips | ☐ |
| 6.2 | Create gallery form works — preset selection populates fields correctly | ☐ |
| 6.3 | Edit gallery — password, download PIN, download limit, watermark fields all save correctly | ☐ |
| 6.4 | `/admin/galleries/[id]/photos` — upload, reorder, hide/show photos | ☐ |
| 6.5 | `/admin/galleries/[id]/favorites` — shows submitted selects with CSV export | ☐ |
| 6.6 | `/admin/access-logs` — shows unlocked gallery attempts with IP hash and user-agent | ☐ |
| 6.7 | `/admin/download-logs` — shows download events correctly | ☐ |
| 6.8 | `/admin/inquiries` — shows contact form submissions | ☐ |
| 6.9 | `/admin/settings` — brand settings save and reload | ☐ |
| 6.10 | Deposit status dropdown on gallery detail page updates correctly | ☐ |

---

## 7. Error States & Edge Cases

| # | Check | Status |
|---|-------|--------|
| 7.1 | Visiting a non-existent URL shows the custom 404 page (dark background, serif heading) | ☐ |
| 7.2 | Visiting `/share/invalid-token` shows "Link unavailable" (not a 404 crash) | ☐ |
| 7.3 | Visiting a gallery slug that doesn't exist returns 404 gracefully | ☐ |
| 7.4 | Visiting `/admin` without `SUPABASE_SERVICE_ROLE_KEY` set redirects to login (doesn't crash) | ☐ |
| 7.5 | Spinner (loading.tsx) shows briefly on slow navigations | ☐ |

---

## 8. Performance & Core Web Vitals

| # | Check | Status |
|---|-------|--------|
| 8.1 | Run Lighthouse on `/` — LCP < 2.5 s on a desktop fast connection | ☐ |
| 8.2 | Run Lighthouse on `/portfolio` — no layout shift from image grids | ☐ |
| 8.3 | `next/image` `priority` is set on hero images (LCP candidates) — no "image is not lazy-loaded but is priority" warning | ☐ |
| 8.4 | Portfolio images use `sizes` prop correctly — no oversized downloads on mobile | ☐ |
| 8.5 | No console errors on any public route | ☐ |

---

## 9. SEO & Crawlability

| # | Check | Status |
|---|-------|--------|
| 9.1 | `https://nhihadhassan.ca/sitemap.xml` is accessible and lists correct URLs | ☐ |
| 9.2 | `https://nhihadhassan.ca/robots.txt` disallows `/admin/`, `/api/`, `/share/`, `/galleries/` | ☐ |
| 9.3 | Homepage `<title>` and `<meta description>` are correct (view source or DevTools → Elements) | ☐ |
| 9.4 | `/investment` page has no `noindex` — it should be indexed | ☐ |
| 9.5 | `/share/[token]` pages have `robots: { index: false }` — should NOT be indexed | ☐ |
| 9.6 | OpenGraph tags on `/`, `/portfolio`, `/contact` are present and correct | ☐ |
| 9.7 | Submit sitemap to Google Search Console after DNS is live | ☐ |

---

## 10. Content Audit

| # | Check | Status |
|---|-------|--------|
| 10.1 | No `$`, price figures, or package names appear anywhere on public pages | ☐ |
| 10.2 | No placeholder/Lorem text in any component or data file | ☐ |
| 10.3 | No fake testimonial text is rendered publicly (empty array = hidden section) | ☐ |
| 10.4 | "Interac e-Transfer" mentioned only on `/investment`, `/contact` (success message), and admin pages | ☐ |
| 10.5 | No mention of Stripe, checkout, PayPal, or online card payment anywhere | ☐ |
| 10.6 | Instagram handles (`@nhihad.h`, `@nhihad_photography`) and email (`nhihadhassanphotography@gmail.com`) are correct | ☐ |
| 10.7 | Copyright year is 2026 in the footer | ☐ |

---

## 11. Pre-Launch Sign-Off

- [ ] All 🚨 blockers resolved
- [ ] All ⚠️ items reviewed (accept or defer in writing)
- [ ] DNS pointing to Vercel production deployment
- [ ] Custom domain verified in Vercel (HTTPS, no mixed-content warnings)
- [ ] First real gallery created and test invite sent to yourself
- [ ] Photographer has confirmed they can log in and navigate admin confidently

---

*Generated for Phase 5A — Private Launch QA. Last code state: commit `2076097`.*
