# Design Direction

## Visual Strategy

Nhihad Hassan Photography feels like a premium photography brand with a strong event and nightlife point of view. Public pages are composed around large images, restrained copy, editorial spacing, and confident near-black surfaces. The result is custom and cinematic, not template-like.

## Palette

Defined as CSS variables in `src/app/globals.css` (`:root` + Tailwind v4 `@theme`).

- Ink (primary bg): `#080808`
- Charcoal: `#141210`
- Deep umber: `#211B17`
- Soft white (primary text): `#F7F3ED`
- Warm beige: `#D8C8B2`
- Muted taupe: `#9C8F80`
- Copper accent: `#B98257`

Use warm neutrals as atmosphere, not beige decoration. Avoid pure black and pure white. The serif font and the accent (`--copper`) are admin-overridable site-wide via theme settings, so treat them as tokens, never hardcode.

## Typography

Three families, weight contrast over decoration.

- Display (gallery cover titles, View Gallery buttons, eyebrows): `Montserrat`, ExtraBold, uppercase, tight tracking. Token `--font-display`.
- Headings (editorial serif voice): `Cormorant Garamond` (admin-switchable to `Bodoni Moda`). Token `--font-serif`.
- UI / body: `Geist` sans. Admin uses sans-serif only.

Uppercase is reserved for short labels, eyebrows, and the brand wordmark, never body copy. The homepage wordmark uses a fluid `clamp()` so the long studio name never crowds small screens.

## Layout

- Public pages use large photo moments, asymmetric editorial grids, and generous, varied spacing.
- Portfolio is a masonry/column grid; meta (category, title, date, location) is hidden until hover or tap so the image leads.
- Do not use repeated feature cards to explain the app. Use cards only for repeated portfolio/gallery items and admin empty states. No nested cards.
- Mobile collapses into simple, high-confidence image stacks with no horizontal scroll.

## Image Rules

- All portfolio and gallery photos live in Cloudflare R2 and are served via short-lived signed URLs; never store client photos in `public/`, GitHub, or the Vercel filesystem.
- Three variants per photo: original, web (max 2400px webp), thumbnail (max 600px webp), generated with Sharp on upload.
- Signed R2 URLs render through `next/image` with the `unoptimized` prop; pages that show them use ISR (`revalidate`) under the URL TTL.
- Reserve dimensions with aspect ratios and responsive `sizes`; use object-fit crops.
- Alt text must be human (cover alt or gallery/photo title), never the raw uploaded filename.
- Optional text watermark can be composited onto the web variant per gallery.

## Motion

- Subtle fades, small upward reveals (the `Reveal` component), restrained transitions.
- Motion supports image reveal, hierarchy, or interactive feedback, never decoration.
- Respect `prefers-reduced-motion`.

## Gallery Direction

Cover-first, echoing a premium event flow: full-bleed cover image with an adjustable focal point and four layout templates (center, left, bottom bar, split), brand mark, event title, date, and a View Gallery CTA, with a password gate when set. Inside: masonry grid, full-screen lightbox with slideshow, favourites, and single/bulk downloads.

## Admin Direction

Task-first and quiet: compact sidebar/top navigation, useful empty states, predictable forms. Sections cover galleries, portfolio, custom homepage sections, inquiries, settings (brand/contact/SEO/theme/page text), and access/download logs. A live-site Edit mode adds inline pencils that deep-link into the matching editor.
