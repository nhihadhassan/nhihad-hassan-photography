# Content Audit — Phase 5B

> Audit of every piece of user-visible copy across the site as of Phase 4I.  
> Purpose: identify gaps, tone inconsistencies, placeholders, and copy-ready improvements before real clients visit.

---

## 1. Brand Voice Baseline

**Brand:** Nhihad Hassan Photography  
**Tone:** Premium, cinematic, direct. Minimal adjective stacking. Emphasis on atmosphere, movement, light.  
**Palette rules (copy):**
- No dollar figures. Inquiry-based positioning only.
- No cheesy superlatives ("best photographer in Toronto", "unforgettable memories").
- No fake urgency ("book now before slots fill up!").
- Interac e-Transfer mentioned only on `/investment`, `/contact` (success), and admin.
- No Stripe, PayPal, checkout, or card payment language anywhere.

---

## 2. Homepage (`/`)

| Section | Current copy | Assessment | Action |
|---------|-------------|------------|--------|
| Hero eyebrow | "Toronto weddings, couples, events, and nightlife" | ✅ Clear, specific, on-brand | None |
| Hero H1 | "Nhihad Hassan Photography" | ✅ Uses brand name as display type | None |
| Hero subtitle | "Wedding, couples, portrait, and event photography based in Toronto — shaped around atmosphere, movement, and the moments worth keeping." | ✅ Atmosphere-first, no clichés | None |
| Hero sidebar quote | "Photography for first looks, packed dance floors, family rituals, soft portraits, and the late-night frames that still feel loud the next morning." | ✅ Strong sensory specificity | None |
| Hero stats | Base: Toronto / Focus: Weddings & events | ✅ Concise, accurate | None |
| Selected Work headline | "Built around the photograph first." | ✅ | None |
| Selected Work body | "A portfolio with wedding warmth, portrait calm, and event pace — paired with enough negative space to let each image hold the room." | ✅ | None |
| About heading | "Photographs that keep the atmosphere intact." | ✅ | None |
| About body | "Nhihad Hassan Photography covers Toronto weddings, couples and engagements, portraits, events, and nightlife with a clean eye for light, gesture, and emotional pace." | ✅ | None |

**Overall homepage assessment:** ✅ Strong. No changes required.

---

## 3. Portfolio (`/portfolio` and `/portfolio/[category]`)

| Element | Current | Assessment | Action |
|---------|---------|------------|--------|
| Page title | "Portfolio" | ✅ | None |
| Meta description | "A curated selection of wedding, couples, portrait, event, and nightlife photographs from Toronto and beyond." | ✅ | None |
| OG title | "Portfolio | Nhihad Hassan Photography" | ✅ | None |
| Category labels | events, nightlife, portraits, lifestyle, weddings-couples | ✅ Consistent with URL slugs | None |
| InquiryCallout at bottom | ✅ Present | ✅ | None |

**Overall portfolio assessment:** ✅ Clean. No changes required.

---

## 4. Investment (`/investment`)

| Section | Current | Assessment | Action |
|---------|---------|------------|--------|
| Hero eyebrow | "Investment" | ✅ | None |
| Hero H1 | "Considered photography, simply booked." | ✅ Elegant, non-cheesy | None |
| Hero body | "Wedding, couples, portrait, and event coverage in Toronto and across Ontario. Built around the feel of the day, delivered in a private gallery..." | ✅ | None |
| Interac note | "Bookings are confirmed manually. Deposit instructions are sent after booking confirmation via **Interac e-Transfer** — there is no checkout on this site." | ✅ Explicit, honest | None |
| Booking steps | Inquire → Booking confirmed → Deposit via Interac e-Transfer → Shoot day → Gallery delivery | ✅ | None |
| Services section eyebrow | "What I shoot" | ✅ | None |
| Services headline | "Coverage for the five things I shoot most." | ✅ | None |
| Per-service long blurbs | Read from `src/data/services.ts` | ⚠️ Review each blurb below | See §4.1 |
| Testimonials section | Hidden (empty array) | ✅ Correct for pre-launch | None |
| InquiryCallout | ✅ Present | ✅ | None |
| Price/dollar figures | None found | ✅ | None |

### 4.1 Per-Service Blurb Audit (`src/data/services.ts`)

Verify these are present and on-brand. Open `src/data/services.ts` and confirm:

| Service | Key phrases to check | Notes |
|---------|---------------------|-------|
| Weddings | Focus on ceremony emotion, reception energy, not "capturing memories" | Update if generic |
| Couples & Engagements | Mention of location scouting or natural direction | Update if missing |
| Portraits | "Quiet direction" or similar; light quality | Update if generic |
| Events | Coverage pace, crowd energy, atmosphere | Update if generic |
| Nightlife | Low-light mastery, movement, dance floor energy | Update if generic |

---

## 5. Contact (`/contact`)

| Element | Current | Assessment | Action |
|---------|---------|------------|--------|
| H1 | "Tell me what the night should feel like." | ✅ Evocative, on-brand | None |
| Body | "Share the date, place, and mood. For urgent bookings..." | ✅ | None |
| Email shown | `nhihadhassanphotography@gmail.com` | ✅ Matches `brandConfig` | Verify this is the live inbox |
| Instagram handles | `@nhihad.h`, `@nhihad_photography` | ✅ Matches `brandConfig` | Verify these are live |
| Form success message | Should mention Interac e-Transfer | ⚠️ Verify in `src/app/contact/actions.ts` | Check below |
| Meta description | "Book a wedding, couples, portrait, or event session... Inquiry-based — no checkout on this site." | ✅ | None |

**Action 5.1**: Open `src/app/contact/actions.ts` and confirm the success message copy mentions Interac e-Transfer per Phase 3L spec. It should read something like: *"Thanks — I'll be in touch within 48 hours. Deposits are handled via Interac e-Transfer after booking confirmation."*

---

## 6. Mini-Sessions (`/mini-sessions`)

| Element | Current | Assessment | Action |
|---------|---------|------------|--------|
| Hero eyebrow | "Mini Sessions" | ✅ | None |
| Sessions offered | Couples, Portraits, Events (from `src/data/mini-sessions.ts`) | ✅ | None |
| Interac e-Transfer mention | Should appear in FAQ | ⚠️ Verify FAQ text | Check `src/data/mini-sessions.ts` |
| Dollar figures | None | ✅ Must stay absent | None |
| InquiryCallout | ✅ Present | ✅ | None |

---

## 7. Journal (`/journal` and `/journal/[slug]`)

| Post | Slug | Assessment | Action |
|------|------|------------|--------|
| Toronto engagement locations | `toronto-engagement-locations` | ✅ Location-focused, helpful | None |
| What to wear for couples sessions | `what-to-wear-couples-session` | ✅ Practical advice | None |
| How gallery delivery works | `how-gallery-delivery-works` | ✅ Process transparency | None |

**Action 7.1**: Once the site is live, add 1–2 more posts to signal an active journal. Topics:  
- *"5 things I look for in wedding venue light"*  
- *"Toronto nightlife photography — how I shoot in dark rooms"*

---

## 8. Services Grid (`src/components/services-grid.tsx` + `src/data/services.ts`)

Cards appear on both homepage and `/investment`. Verify:

| Service card | Short blurb | Portfolio link | Cover image |
|---|---|---|---|
| Weddings | ✅ / ⚠️ review | `/portfolio/weddings-couples` | Check imageId resolves |
| Couples & Engagements | ✅ / ⚠️ review | `/portfolio/weddings-couples` | Check imageId resolves |
| Portraits | ✅ / ⚠️ review | `/portfolio/portraits` | Check imageId resolves |
| Events | ✅ / ⚠️ review | `/portfolio/events` | Check imageId resolves |
| Nightlife | ✅ / ⚠️ review | `/portfolio/nightlife` | Check imageId resolves |

**Action 8.1**: Load homepage locally (`npm run dev`) and confirm all 5 cards render with images, not broken placeholders.

---

## 9. Global Elements

### 9.1 Site Header

| Element | Current | Assessment |
|---------|---------|------------|
| Nav items (desktop) | Portfolio · Sessions · Investment · Client Gallery · Inquire | ✅ |
| Nav items (mobile drawer) | Same + "Inquire" CTA button | ✅ |
| Logo | NH monogram SVG | ✅ |

### 9.2 Site Footer

| Element | Current | Assessment |
|---------|---------|------------|
| Brand name | "Nhihad Hassan Photography" | ✅ |
| Email | `nhihadhassanphotography@gmail.com` | ✅ Verify live inbox |
| Instagram links | `@nhihad.h`, `@nhihad_photography` | ✅ Verify live accounts |
| Secondary links | Portfolio · Sessions · Investment · Gallery Preview · Admin | ✅ |
| Copyright year | 2026 | ✅ |
| Tagline | "Event, nightlife, lifestyle, and portrait photography based in Toronto." | ⚠️ Does not mention weddings/couples | Consider updating |

**Action 9.1**: Update `brandConfig.tagline` in `src/lib/config.ts` to include weddings, e.g.:  
> *"Wedding, couples, event, and portrait photography based in Toronto."*  
This tagline propagates to the footer and any SEO use of `brandConfig.tagline`.

---

## 10. Copy Issues Summary

| Priority | Issue | File | Action |
|----------|-------|------|--------|
| 🔴 Verify | Footer tagline omits weddings/couples | `src/lib/config.ts` | Update `tagline` field |
| 🟡 Verify | Contact form success message mentions Interac e-Transfer | `src/app/contact/actions.ts` | Read and confirm |
| 🟡 Verify | Mini-sessions FAQ mentions Interac e-Transfer | `src/data/mini-sessions.ts` | Read and confirm |
| 🟡 Verify | Per-service long blurbs are non-generic and atmosphere-focused | `src/data/services.ts` | Read and refine if needed |
| 🟢 Future | Journal needs 2+ more posts for credibility | `src/data/journal.ts` | Add when ready |
| 🟢 Future | Testimonials: add real client quotes when available | `src/data/testimonials.ts` | Drop in when ready |

---

## 11. Implement: Footer Tagline Fix

> This is a safe, one-line change. Update now.

**File**: `src/lib/config.ts`  
**Current**: `tagline: "Event, nightlife, lifestyle, and portrait photography based in Toronto."`  
**Proposed**: `tagline: "Wedding, couples, portrait, and event photography based in Toronto."`

This brings the footer copy into alignment with the homepage hero eyebrow and investment page headline, which all lead with weddings/couples.

---

*Generated for Phase 5B — Content Audit. Last code state: commit `2076097`.*
