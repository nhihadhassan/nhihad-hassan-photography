# Nhihad Hassan Photography Platform

## Product Purpose

A custom photography portfolio and private client gallery platform that replaces Pixieset for Nhihad Hassan Photography. It sells the studio as a premium Toronto photography brand and delivers private client galleries directly, with self-service content management so the owner can run the whole site without a developer.

Live at https://nhihadhassan.ca (Next.js on Vercel, Supabase, Cloudflare R2).

## Register

Public pages are brand register: the design is part of the product. They should feel cinematic, confident, image-led, and custom.

Admin pages are product register: the design serves the task. They should feel quiet, fast, legible, and practical.

## Audience

- Potential clients looking for event, nightlife, lifestyle, portrait, wedding, and couples photography in Toronto.
- Private gallery visitors receiving event or client delivery links.
- The photographer/admin managing galleries, the portfolio, inquiries, site content, and uploads.

## Brand Voice

Cinematic, nightlife/event-forward, polished, modern, Toronto-based, confident, minimal. Copy is warm and human, first person, no em dashes.

## Anti-References

- Generic SaaS landing pages.
- Feature-card grids explaining the platform.
- Stock-looking portfolio sites where the photography feels secondary.
- Overly decorative motion, gradients, or novelty UI.
- Admin screens that look like marketing pages.

## Current Scope (built)

Public site: image-first homepage, portfolio (database-backed, by category, featured grid on home), pricing with hover/tap reveal tiers and a deposit policy, contact with an inquiry form and a live Toronto-time availability calendar, journal, and a public galleries index.

Client galleries: cover-first route with focal point + four cover layouts, password protection, selects/favourites, single and bulk (ZIP) downloads, full-screen slideshow, optional watermarking, share links, access/download logging.

Storage + media: Cloudflare R2 with presigned uploads and Sharp web/thumbnail variants; portfolio and gallery photos both served from R2 via signed URLs.

Self-service CMS (admin, role-gated): portfolio manager (upload, edit metadata, feature, hide, reorder, delete), editable site copy + brand/contact + SEO (site_settings + site_content with safe fallbacks), curated theme presets (serif font + accent colour), a limited homepage section builder, plus a live-site "Edit" mode with deep links. Inquiries inbox; gallery deposit-status tracking (manual Interac e-Transfer, no online payments).

SEO/analytics: per-page metadata, Open Graph image, JSON-LD, sitemap, robots, Vercel Analytics. Public pages render static/ISR.

## Not Built / Future

Online payments and a print store, client accounts/logins, multi-photographer support, and a per-photo alt-text field for gallery images.
