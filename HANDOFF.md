# Nhihad Hassan Photography — Project Handoff

_Paste this into a new chat to pick the project up. Last refreshed 2026-07-27._

## Project
- **Live site:** https://www.nhihadhassan.ca (admin at `/admin`)
- **Repo:** `nhihadhassan/nhihad-hassan-photography`, branch `main` (synced; latest commit `5a6f458`)
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, framer-motion, Supabase (project `xgonlcjfbidrmdimulgh`), Cloudflare R2 (images), Resend (email), Vercel (auto-deploys on push to `main`).
- **DB migrations applied through `0038`.**

## Current state
Everything below is built, merged to `main`, and live. The owner runs the whole business from `/admin` (works on phone). Nothing is queued.

### Public site (all editable from admin)
Home, Portfolio (DB + R2), Journal (visual block CMS: text, headings, quotes, photos, photo rows, lists, dividers; bold + `[links](url)`; per-post accent/font; "From portfolio" picker), Pricing, Contact, Galleries, SEO (DB sitemap, LocalBusiness schema, Search Console field).

Tokenized client pages (noindex): `/booking/[token]` (hub + `.ics`), `/invoice/[token]` (sequential `INV-0001`), `/agreement/[token]` (e-signature), `/questionnaire/[token]`, `/review/[token]`, `/booking-agreement` (blank contract), `/share/[token]` (curated photo share).

### Admin IA (rebuilt in PR #14, HoneyBook-style)
- **Primary rail:** Today · Pipeline · Calendar · Bookings · Clients · Invoices · Contracts · Settings
- **Content group:** Galleries · Portfolio · Journal · Sections · Pricing · Reviews · Inquiries
- **Automations group:** Reminders · Contract template · Questionnaires · Access logs · Download logs
- **Cmd+K command palette** jumps to any booking or client by name.
- Sidebar shows full labels at `lg`, collapses to an icon rail `md`–`lg`, horizontal scroll row below `md`.

Key screens: **Today** (money row, "Needs attention" queue, quick-create), **booking workspace** with an activity timeline spine, **8-stage pipeline** with auto-advance, shared data tables, side sheets, and toasts.

### Galleries (rebuilt in PR #12)
Card grid with cover, status dot, and item count. Minimal "New collection" create (title, client, date, preset) that drops you straight on the upload screen; the rest lives in collapsible Settings sections. A **Share hub** per gallery: compose the invite email with live preview, copy link, and curated share links.

### Email
All client email builds through one shared shell (`src/lib/emails/shell.ts`), with the full logo lockup on a dark band. Gallery invite is `src/lib/emails/gallery-invite.ts`, composed and sent from the gallery Share tab; supports **multiple recipients** (comma/semicolon/newline, max 20) and reports partial failures. Daily reminders (deposit / balance / gallery-expiring / review) run via Vercel Cron `/api/cron/reminders`, with per-kind timing now editable in `reminder_rules` and per-booking mutes.

## Migrations (Supabase, all applied)
0016 portfolio · 0017 site_content · 0018 theme · 0019 page_blocks · 0020 journal · 0021 seo_verification · 0022 reviews · 0023 booking_agreement · 0024 signed_agreements · 0025 bookings · 0026 invoice_numbers · 0027 finance · 0028 booking_stage · 0029 reminders · 0030 pricing · 0031 questionnaires · 0032 gallery_invite_draft · 0033 restrict_invoice_rpc · 0034 gallery_cover_font · 0035 download_rate_limit_scopes · 0036 booking_events · 0037 booking_stages_v2 · 0038 reminder_rules.

**Booking stages are now 8** (since 0037): `inquiry, proposal_sent, contract_out, booked, shot, editing, delivered, archived`. The old `reviewed` stage is gone (mapped to `delivered`). A DB check constraint enforces the list, and `advanceBookingStage` swallows errors, so a stage write outside the list fails **silently** rather than throwing.

## Config / env state
- `CRON_SECRET`: set in Vercel (endpoint returns 401 without it).
- Email (Resend): `RESEND_API_KEY` + `SELECTS_NOTIFICATION_FROM`.
- `R2_PUBLIC_BASE_URL`: not set, so public images run on 7-day signed URLs (fine). Email cover images use the same helper so they survive being opened later.
- Vercel preview deploys historically could not log in (env not scoped to Preview); previews still build and are useful for public pages.

## Working conventions (IMPORTANT)
- **No em dashes (—) in any copy**, ever. En dashes (–) in price ranges are fine.
- **Admin contrast floor:** secondary text `text-admin-ink/65`, placeholders `/60`, and the `--admin-muted` token is `rgba(23,19,15,0.65)`. Anything lighter fails WCAG AA on the cream surface. Decorative glyphs may be lighter.
- Touch targets grow to 44px via `[@media(pointer:coarse)]`; desktop stays denser at 40px.
- **Workflow:** big features → branch + PR → `gh pr merge --squash --delete-branch`; small tweaks → straight to `main`.
- **Commit trailer:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Never** commit `.claude/`.
- Toronto timezone (`America/Toronto`) for all date/time logic.
- Public reads use cookie-less `getPublicSupabaseClient()` (keeps pages static/ISR); admin/private use service-role or cookie server client. Tokenized tables are deny-by-default RLS, service-role only.
- **Multiple sessions work this repo in parallel** (local plus cloud `claude/*` branches). Before adding a migration, check other open PR branches for the same number: 0034/0035 already collided once and had to be renumbered.
- Three lint errors are known and intentional: the dashboard was fixed, the two remaining are deep-link `setState`-in-effect patterns in `gallery-grid.tsx` / `gallery-lightbox.tsx`. Builds do not run ESLint.

## Open to-dos (owner-side)
- **Set the Google review link** in Settings (`google_review_url` is unset and there are 0 reviews, so testimonials stay hidden and the review reminder has nowhere to point).
- **Delete the Test Client booking** (still present alongside the real "Rachel" booking). Ask Claude to "delete the test booking" to wipe it via SQL.
- Click through the new admin and say what feels wrong; the redesign is verified working but has not been used in anger.

_Done since the last handoff: reminders toggle is ON, 3 journal posts are imported, and auth hardening (see below)._

### Supabase security advisor: leaked-password protection
The advisor flags "leaked password protection disabled" and it **cannot be fixed on this project**: the feature is Pro-plan only and the org (`pgcmnobhwziicfahksqh`) is on **free**. Ignore the warning rather than chasing it. The practical risk is near zero: there is exactly one auth user, one profile, one admin, and `is_admin()` gates admin access on a `profiles.role = 'admin'` row, so a stray signup gets nothing. Free hardening was applied instead: "Require current password when updating" is ON and the minimum password length was raised from 6.

## Known issue, not urgent
The Cmd+K command index is built in `AdminShell`, so **every** admin page load does six full-table reads (bookings, plus `getClientList` which pulls galleries, inquiries, bookings, agreements, reviews) just to populate a palette that may never open. Invisible at current scale, grows with every record. Fix options: lazy-load it from a route handler when the palette first opens (best), cache it with `unstable_cache`, or narrow the queries to id + name.

## Possible next features (none committed)
- **Auto-quote**: draft a quote from the pricing tiers when an inquiry lands, for the owner to approve and send from the Inquiries inbox (keeps pricing off the public form).
- Permanent public image URLs via a public R2 bucket/CDN (+ image optimization).
- Journal OG-image hardening (social caches can outlast 7-day signed links).
- Two-way Google Calendar sync; newsletter capture; admin-editable questionnaire questions.

## How to continue
Open a new chat, paste this file, say what you want. Data layers live in `src/lib/*.ts` (one per domain: `bookings`, `agreements`, `reviews`, `finance`, `clients`, `journal`, `pricing`, `questionnaires`, `reminders`, `attention`, `events`, `command-index`, `emails/*`, `r2`), admin pages under `src/app/admin/(protected)/*`, shared admin primitives under `src/components/ui/*`, and public tokenized pages under `src/app/{booking,invoice,agreement,questionnaire,review,share}/[token]`.
