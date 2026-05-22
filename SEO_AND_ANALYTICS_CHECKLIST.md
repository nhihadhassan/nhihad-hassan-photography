# SEO & Analytics Checklist — Phase 5C

> Pre-launch and post-launch SEO verification. Work through each section once the site is live on `https://nhihadhassan.ca`.

---

## 1. Technical SEO — On-Site

### 1.1 Metadata

| Page | Title tag | Meta description | OG title | OG description | Status |
|------|-----------|-----------------|----------|----------------|--------|
| `/` | "Nhihad Hassan Photography" (from layout.tsx template) | From `layout.tsx` default | ✅ | ✅ | ☐ verify live |
| `/portfolio` | "Portfolio \| Nhihad Hassan Photography" | "A curated selection of wedding, couples, portrait…" | ✅ | ✅ | ☐ verify live |
| `/investment` | "Investment \| Nhihad Hassan Photography" | "Considered photography for weddings, couples…" | ☐ (no OG block) | ☐ | ⚠️ add OG |
| `/mini-sessions` | "Mini Sessions \| …" | Set in page metadata | ☐ check | ☐ check | ☐ verify live |
| `/contact` | "Contact \| …" | "Book a wedding, couples…" | ✅ | ✅ | ☐ verify live |
| `/journal` | "Journal \| …" | Set in page metadata | ☐ check | ☐ check | ☐ verify live |
| `/journal/[slug]` | Post title | Post excerpt | ☐ check | ☐ check | ☐ verify live |

**Action 1.1**: Add `openGraph` block to `/investment/page.tsx` metadata:
```ts
openGraph: {
  title: "Investment | Nhihad Hassan Photography",
  description:
    "Considered photography for weddings, couples, portraits, events, and nightlife in Toronto. Inquiry-based — no checkout on this site.",
},
```

**Action 1.2**: Add `openGraph` block to `/mini-sessions/page.tsx` and `/journal/page.tsx` if not already present.

### 1.2 Canonical & Robots

| Check | Status |
|-------|--------|
| `metadataBase` set to `https://nhihadhassan.ca` in `src/app/layout.tsx` | ☐ verify |
| `/robots.txt` disallows `/admin/`, `/api/`, `/share/`, `/galleries/` | ☐ verify live |
| `/share/[token]` pages have `robots: { index: false, follow: false }` | ✅ (set in generateMetadata) |
| Gallery pages (`/galleries/[slug]`) are not linked from any public sitemap | ✅ (not in sitemap.ts) |
| No canonical conflicts from duplicate content | ☐ review |

### 1.3 Sitemap

| Check | Status |
|-------|--------|
| `/sitemap.xml` accessible and returns valid XML | ☐ verify live |
| Homepage listed with `priority: 1` | ✅ |
| `/portfolio` listed with `priority: 0.9` | ✅ |
| `/investment` listed with `priority: 0.8` | ✅ |
| `/mini-sessions` listed with `priority: 0.8` | ✅ |
| All 5 portfolio category pages listed | ✅ |
| All published journal posts listed | ✅ |
| `/galleries/*`, `/share/*`, `/admin/*` NOT in sitemap | ✅ |
| Submitted to Google Search Console | ☐ do post-launch |

---

## 2. Core Web Vitals Targets

Run Lighthouse or PageSpeed Insights on these URLs after Vercel deploy:

| Page | LCP target | CLS target | FID/INP target | Priority |
|------|-----------|------------|----------------|----------|
| `/` | < 2.5 s | < 0.1 | < 200 ms | High (hero is LCP) |
| `/portfolio` | < 3 s | < 0.1 | < 200 ms | Medium |
| `/investment` | < 3 s | < 0.1 | < 200 ms | Medium |
| `/contact` | < 2 s | < 0.05 | < 200 ms | Low (no images) |

**Image optimization checks:**
- Hero on `/` — `priority` prop set, `sizes="100vw"` ✅
- Portfolio grid images — `sizes` prop set per column count ✅  
- All `next/image` components use `unoptimized` only where required (share page URLs) — gallery share thumbnails and lightbox use `unoptimized` since they are external R2 signed URLs ✅

---

## 3. Schema Markup (Structured Data)

None is currently implemented. Add for Phase 5C or beyond:

| Schema type | Page | Priority | Notes |
|---|---|---|---|
| `LocalBusiness` / `Photographer` | `/` | 🔴 High | Name, geo, url, image, description |
| `WebSite` with `SearchAction` | `/` | 🟡 Medium | Enables Google sitelinks search |
| `Article` | `/journal/[slug]` | 🟡 Medium | datePublished, author, headline |
| `FAQPage` | `/mini-sessions` (FAQ section) | 🟡 Medium | Eligibility for FAQ rich results |
| `BreadcrumbList` | `/portfolio/[category]` | 🟢 Low | Navigation clarity |

**Recommended action**: Add a `LocalBusiness` JSON-LD block to `src/app/layout.tsx` in the next iteration. Example:
```html
<script type="application/ld+json">{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Photographer",
  "name": "Nhihad Hassan Photography",
  "url": "https://nhihadhassan.ca",
  "image": "https://nhihadhassan.ca/portfolio/ceremony-family.webp",
  "address": { "@type": "PostalAddress", "addressLocality": "Toronto", "addressRegion": "ON", "addressCountry": "CA" },
  "description": "Wedding, couples, portrait, and event photography based in Toronto.",
  "sameAs": [
    "https://www.instagram.com/nhihad.h/",
    "https://www.instagram.com/nhihad_photography/"
  ]
})}</script>
```

---

## 4. Local SEO (Toronto Photography)

| Target keyword | Page | Title includes it | Body mentions it | Status |
|---|---|---|---|---|
| "Toronto wedding photographer" | `/`, `/investment` | ✅ | ✅ | ☐ monitor |
| "Toronto couples photographer" | `/`, `/investment` | ✅ | ✅ | ☐ monitor |
| "Toronto portrait photographer" | `/portfolio/portraits` | ⚠️ partial | ✅ | ⚠️ add to category meta |
| "Toronto event photographer" | `/`, `/investment` | ✅ | ✅ | ☐ monitor |
| "Toronto nightlife photographer" | `/portfolio/nightlife` | ⚠️ partial | ✅ | ⚠️ add to category meta |

**Action 4.1**: Add per-category metadata in `/portfolio/[category]/page.tsx` that includes the category name + "Toronto photographer" in the description. Example for portraits:  
> *"Toronto portrait photographer — soft, natural light portraits for individuals, couples, and families."*

---

## 5. Analytics Setup

### 5.1 Vercel Analytics (Recommended — zero config)

Vercel Web Analytics is built into the Vercel platform and requires no third-party scripts.

**To enable:**
1. Vercel Dashboard → your project → **Analytics** tab → Enable Web Analytics
2. Install the package: `npm install @vercel/analytics`
3. Add to `src/app/layout.tsx`:
   ```tsx
   import { Analytics } from "@vercel/analytics/react";
   // Inside the <body>:
   <Analytics />
   ```
4. Deploy — page views and referrers appear in the Vercel dashboard within minutes.

**What you get:** Page views, unique visitors, top pages, referrers, countries, devices — all without cookies or GDPR consent banners (privacy-preserving, aggregated only).

**What you don't get:** Conversion funnels, custom events, session recordings. That's fine for Phase 5.

### 5.2 Vercel Speed Insights (Optional)

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";
// Inside <body>:
<SpeedInsights />
```

Adds field CWV data from real visitors. Low overhead; zero config.

### 5.3 Google Search Console

1. Go to https://search.google.com/search-console
2. Add property: `https://nhihadhassan.ca`
3. Verify via DNS TXT record (Vercel supports this) or HTML file method
4. Submit sitemap: `https://nhihadhassan.ca/sitemap.xml`
5. Check Index Coverage report after 48–72 hours

**Target: all public pages indexed, no gallery/admin/share pages indexed.**

### 5.4 Analytics Checklist

| Task | Status |
|------|--------|
| Enable Vercel Web Analytics in Vercel dashboard | ☐ |
| Install `@vercel/analytics` package | ☐ |
| Add `<Analytics />` to layout.tsx | ☐ |
| Optionally add `<SpeedInsights />` | ☐ |
| Verify Google Search Console property | ☐ |
| Submit sitemap to GSC | ☐ |
| Check GSC index coverage 72 hours after launch | ☐ |
| Set up a monthly reminder to review top pages in Vercel Analytics | ☐ |

---

## 6. Social & Off-Site

| Check | Status |
|-------|--------|
| Instagram bio links to `https://nhihadhassan.ca` | ☐ verify |
| Both Instagram accounts (`@nhihad.h`, `@nhihad_photography`) link to the site | ☐ verify |
| OG image renders correctly when sharing homepage URL on Instagram DMs / iMessage | ☐ test |
| OG image on `/investment` renders (requires OG block — see Action 1.1) | ☐ after fix |

---

## 7. Immediate Actions Summary

| Priority | Action | File/Location |
|----------|--------|---------------|
| 🔴 Pre-launch | Add OG block to `/investment` page metadata | `src/app/investment/page.tsx` |
| 🔴 Pre-launch | Submit sitemap to Google Search Console | GSC dashboard |
| 🟡 Pre-launch | Add per-category meta descriptions with location keywords | `src/app/portfolio/[category]/page.tsx` |
| 🟡 Week 1 | Install `@vercel/analytics` and add `<Analytics />` | `src/app/layout.tsx` |
| 🟡 Week 1 | Verify Google Search Console property + check index coverage | GSC dashboard |
| 🟢 Phase 5D | Add `LocalBusiness` JSON-LD to layout.tsx | `src/app/layout.tsx` |
| 🟢 Phase 5D | Add `FAQPage` JSON-LD to mini-sessions page | `src/app/mini-sessions/page.tsx` |

---

*Generated for Phase 5C — SEO & Analytics. Last code state: commit `2076097`.*
