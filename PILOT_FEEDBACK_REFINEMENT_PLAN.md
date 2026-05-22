# Pilot Feedback & Refinement Plan — Phase 5E

> Living document. Fill in as pilot feedback arrives. Use this to triage, prioritize, and track post-pilot improvements.

---

## 1. Pilot Summary

| Field | Value |
|-------|-------|
| Pilot start date | |
| Pilot end date | |
| Number of clients | |
| Gallery types covered | |
| Issues found | |
| Critical blockers | |
| Pilot outcome (pass / pass-with-fixes / blocked) | |

---

## 2. Feedback Log

Add one row per piece of feedback as it comes in. Include source (client name or "self-test"), date, and channel.

| # | Date | Source | Category | Feedback | Severity |
|---|------|--------|----------|----------|----------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

**Severity scale:**
- 🔴 **Blocker** — client could not complete a flow (can't view gallery, can't submit selects, can't download)
- 🟡 **Friction** — client could complete the flow but found something confusing or slow
- 🟢 **Polish** — a "nice to have" improvement, not impacting flow

---

## 3. Known Pre-Pilot Observations (Self-Test Notes)

Add your own observations during the admin setup and self-testing phase here before sending to clients.

| Observation | Type | Notes |
|-------------|------|-------|
| | | |

---

## 4. Refinement Backlog

Once feedback is collected, move items to this table with a priority and proposed fix.

| Priority | Issue | Proposed fix | File(s) | Status |
|----------|-------|-------------|---------|--------|
| | | | | |

---

## 5. UX Patterns to Watch

Based on the pilot design, these are the most likely friction points. Note if any are confirmed:

### 5.1 Password Gate Discovery
- **Risk**: Client opens gallery link, sees password gate, doesn't know where to find the password.
- **Current mitigation**: Invite email shows password in a clearly labelled block.
- **If confirmed**: Add a "Need your password? Check your gallery email." note below the password input.
- **File**: `src/components/gallery-password-gate.tsx`

### 5.2 Selects Drawer Discoverability
- **Risk**: Client hearts photos but doesn't notice the floating toolbar or the "Submit" action.
- **Current mitigation**: Toolbar appears after first heart, with badge count.
- **If confirmed**: Add a subtle first-heart toast ("Photo added to your selects — see the toolbar below to submit").
- **File**: `src/components/selects-toolbar.tsx` (or wherever the toolbar is)

### 5.3 Lightbox on Mobile
- **Risk**: Tap to open lightbox works, but swipe to navigate between photos is not implemented (only arrow buttons).
- **Current mitigation**: Arrow buttons visible on mobile.
- **If confirmed friction**: Add touch swipe support to `GalleryLightbox` and `ShareLightbox` using a pointer-events approach.
- **File**: `src/components/gallery-lightbox.tsx`, `src/components/share-photo-viewer.tsx`

### 5.4 Download ZIP Naming
- **Risk**: Downloaded ZIP named `gallery-[slug]-all.zip` may be unclear to clients unfamiliar with the gallery slug.
- **Current mitigation**: Slug is usually human-readable (e.g. `smith-wedding-2026-all.zip`).
- **If confirmed**: Update `buildZipFilename` to use the gallery title instead of slug.
- **File**: `src/lib/download.ts`

### 5.5 Mobile Grid Load Speed
- **Risk**: Gallery grid with 50+ photos on a slow mobile connection may show a blank flash before thumbnails load.
- **Current mitigation**: `next/image` with `sizes` prop and thumbnail URLs for the grid.
- **If confirmed**: Add a low-quality placeholder or a shimmer CSS class to image containers.
- **File**: `src/components/gallery-grid.tsx`

---

## 6. Post-Pilot Decision Framework

After collecting all feedback, use this to decide what to build next:

### Tier 1 — Fix before wider launch (any 🔴 blocker)
These block real client work. Fix immediately, then re-test before announcing the site.

### Tier 2 — Fix within 2 weeks (🟡 friction affecting >1 client)
These create negative impressions. Prioritize in the first maintenance sprint.

### Tier 3 — Add to roadmap (🟢 polish or single-client mention)
Log in the Phase 6 roadmap. Ship when bandwidth allows.

---

## 7. Roadmap Hooks (Features to consider after pilot)

These were deliberately deferred from Phases 3–5. Revisit based on pilot need:

| Feature | Phase | Trigger to build |
|---------|-------|-----------------|
| Touch swipe in gallery lightbox | 6A | If mobile navigation friction confirmed |
| Real testimonials wiring | 6B | When 3+ real client quotes collected |
| `LocalBusiness` JSON-LD schema | 6C | After site indexed, before SEO push |
| Journal blog posts (2+ more) | 6D | When content is ready |
| Separate `engagements` portfolio category | 6E | Only if source images exist |
| Stripe / online deposits | Deferred indefinitely | Only if business model changes |
| Admin-editable hero/about copy | 6F | If copy changes are frequent |
| Branded gallery invite email domain (resend.dev → your domain) | 6G | After Resend domain verification |
| Mini-session booking calendar | 6H | If mini-sessions become a major revenue stream |

---

## 8. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Photographer (site owner) | Nhihad Hassan | | |
| Developer | | | |

*Pilot complete and refinements prioritized: proceed to wider client launch.*

---

*Generated for Phase 5E — Pilot Feedback & Refinement. Last code state: commit `2076097`.*
