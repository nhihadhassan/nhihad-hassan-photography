# Nhihad Hassan Photography — Project Handoff

_Last updated at the end of a long build session. Paste this into a new chat to continue._

## Project
- **Live site:** https://www.nhihadhassan.ca (admin at `/admin`)
- **Repo:** `nhihadhassan/nhihad-hassan-photography`, branch `main` (fully synced; latest commit `5fc4287`)
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, framer-motion, Supabase (project `xgonlcjfbidrmdimulgh`), Cloudflare R2 (images), Resend (email), Vercel (auto-deploys on push to `main`).
- **DB migrations applied through `0031`.**

## Current state
Everything below is **built, merged to `main`, and live**. The site is a full self-managed studio platform: the owner edits all public content and runs the whole business from `/admin` (works on phone). Nothing is queued.

### Public site (all editable from admin)
- Home, Portfolio (DB + R2), **Journal** (visual block CMS: text, headings, quotes, photos, photo rows, **lists**, dividers; **bold + `[links](url)`**; per-post accent/font; **"From portfolio" photo picker**), **Pricing** (admin-editable), Contact, Galleries, SEO (DB sitemap, LocalBusiness schema, Search Console field).
- Tokenized client pages (noindex): `/booking/[token]` (hub + `.ics` calendar invite), `/invoice/[token]` (sequential `INV-0001`), `/agreement/[token]` (e-signature), `/questionnaire/[token]` (pre-shoot form), `/review/[token]` (Google review ask), `/booking-agreement` (blank contract).

### Admin sections (`/admin`)
Dashboard (action cockpit) · Clients (CRM, merged profiles) · Galleries · Bookings · Pipeline (stage board) · Finances (payments ledger, expenses, CSV) · Portfolio · Journal · Pricing · Sections · Inquiries · Reviews · Reminders · Contract template · Send to sign (agreements) · Questionnaires · Access logs · Download logs · Settings.

### Cross-cutting
- **Email automation** (Resend): inquiry auto-reply + admin alert; "Email booking link"; signed-agreement copy to client + admin; **daily reminders** (deposit/balance/gallery-expiring/review) via Vercel Cron `/api/cron/reminders`.
- **Image fix:** public images now use a permanent public URL if `R2_PUBLIC_BASE_URL` is set, else a 7-day signed URL (`getPublicImageUrl` in `src/lib/r2.ts`). Private gallery photos stay short-signed.

## Migrations (Supabase, all applied)
0016 portfolio · 0017 site_content · 0018 theme · 0019 page_blocks · 0020 journal · 0021 seo_verification · 0022 reviews · 0023 booking_agreement · 0024 signed_agreements · 0025 bookings · 0026 invoice_numbers · 0027 finance (payments+expenses) · 0028 booking_stage · 0029 reminders · 0030 pricing · 0031 questionnaires.

## Config / env state
- `CRON_SECRET`: **set in Vercel** (cron endpoint verified returning 401 without it). ✅
- Email (Resend): `RESEND_API_KEY` + `SELECTS_NOTIFICATION_FROM` (reused from gallery invites).
- **Vercel preview deploys can't log in** (env vars not scoped to Preview) → we **merge to test live** rather than using PR previews.
- `R2_PUBLIC_BASE_URL`: not set (images run on 7-day signed URLs, which is fine).

## Working conventions (IMPORTANT)
- **No em dashes (—) in any copy**, ever. En dashes (–) in price ranges are fine.
- **Workflow:** big features → feature branch + PR → merge to deploy; small tweaks → push straight to `main`. Day-to-day content edits happen in `/admin`, not code.
- **Commit trailer:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Never** commit `.claude/`. (`.gitignore` already excludes `.claude/`, `.agents/`, `skills-lock.json`, `Invoice_*.pdf`.)
- Toronto timezone (`America/Toronto`) for all date/time logic.
- Public reads use the cookie-less `getPublicSupabaseClient()` (keeps pages static/ISR); admin/private use service-role or cookie server client. Per-client tokenized tables (bookings, agreements, reviews, questionnaires, reminder_log) are deny-by-default RLS, service-role only.

## Open to-dos (owner-side, optional)
- Flip the **Reminders** toggle ON in `/admin/reminders` (and "Run now" to test).
- Set the **Google review link** in Settings + import/approve one review so testimonials show.
- Import starter **journal posts** if not done (button in `/admin/journal`).
- Delete the **Test Client** booking: booking token `0de9afd61c884f27824f4667c590c2d1`, agreement token `0797be6ed53347daadcab6d935619322`, plus a test questionnaire if created. (Ask Claude to "delete the test booking" to wipe via SQL.)

## Possible next features (none committed)
- Truly-permanent public image URLs via a separate public R2 bucket/CDN (+ image optimization).
- Journal-post social-share (OG) image hardening (social caches can outlast 7-day links).
- Two-way Google Calendar sync; client portal consolidation; newsletter/email capture; admin-editable questionnaire questions.

## How to continue
Open a new chat, paste this file, and say what you want. For a quick orientation, the data layers live in `src/lib/*.ts` (one per domain: `bookings`, `agreements`, `reviews`, `finance`, `clients`, `journal`, `pricing`, `questionnaires`, `reminders`, `notify-email`, `r2`), admin pages under `src/app/admin/(protected)/*`, and public tokenized pages under `src/app/{booking,invoice,agreement,questionnaire,review}/[token]`.
