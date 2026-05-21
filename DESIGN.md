# Design Direction

## Visual Strategy

Nhihad Hassan Photography should feel like a premium photography brand with a strong event and nightlife point of view. The public site should be composed around large images, restrained copy, editorial spacing, and confident near-black surfaces.

Reference points are the existing Pixieset site and Pixieset-style gallery flow, but the new site should feel more custom, more cinematic, and less template-like.

## Palette

- Ink: `#080808`
- Charcoal: `#141210`
- Deep umber: `#211B17`
- Soft white: `#F7F3ED`
- Warm beige: `#D8C8B2`
- Muted taupe: `#9C8F80`
- Copper accent: `#B98257`

Use warm neutrals as atmosphere, not beige decoration. Avoid pure black and pure white.

## Typography

- Public headings: refined serif through `Cormorant Garamond` for an editorial photographic voice.
- UI/body: `Geist` for clear navigation, forms, and admin interfaces.
- Admin: use sans-serif only.

## Layout

- Public pages use large photo moments, asymmetric editorial grids, and generous spacing.
- Do not use repeated feature cards to explain the app.
- Use cards only for repeated portfolio/gallery items and admin empty states.
- Mobile should collapse into simple, high-confidence image stacks with no horizontal scroll.

## Image Rules

- Use hosted Pixieset URLs only as temporary remote references.
- Do not download or commit client images.
- Do not store photos in `public/`, GitHub, or the Vercel filesystem.
- Configure `next/image` remote patterns.
- Reserve dimensions with aspect ratios, responsive sizes, skeleton backgrounds, and object-fit crops.
- Later, originals, web images, and thumbnails move to Cloudflare R2.

## Motion

- Use subtle fades, small upward reveals, and restrained transitions.
- Motion must support image reveal, page hierarchy, or interactive feedback.
- Respect reduced-motion preferences.

## Gallery Direction

Gallery cover pages should echo Pixieset's event flow: full image, brand mark, event title, date, View Gallery CTA, and password-ready structure. The result should feel more premium and custom than the current Pixieset template.

## Admin Direction

Admin screens should be task-first: compact sidebar/top navigation, useful empty states, predictable forms, and clear future paths for galleries, inquiries, and settings.

