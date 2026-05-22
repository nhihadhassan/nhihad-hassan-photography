# Pilot Test Plan — Phase 5D

> Structured plan for the first wave of real-client deliveries.  
> Goal: validate the full photographer → client workflow end-to-end under real conditions before wider use.

---

## 1. Pilot Scope

**Number of pilot clients:** 2–3 (ideally people you have an existing relationship with who will be honest)  
**Gallery types to cover:**
- 1 password-protected gallery with downloads enabled
- 1 open gallery (no password) with selects enabled
- 1 gallery with a share link created (to test the share page independently)

**Timeline:** Run pilot over 5–7 days. Collect feedback by day 7 before any wider announcement.

---

## 2. Pre-Pilot Setup Checklist

Before sending any client gallery:

| Task | Status |
|------|--------|
| All items in `PRIVATE_LAUNCH_CHECKLIST.md` verified ✅ | ☐ |
| Test gallery created with 5–10 real photos (not placeholder content) | ☐ |
| Invite email sent to yourself — link and password correct in email | ☐ |
| Download tested from your own device — ZIP arrives, files open correctly | ☐ |
| Selects submission tested — notification arrives at `SELECTS_NOTIFICATION_TO` | ☐ |
| Admin can view submitted selects in `/admin/galleries/[id]/favorites` | ☐ |
| Deposit status dropdown familiar — know how to update it after payment received | ☐ |
| You have a way to reach each pilot client for feedback (WhatsApp, email, etc.) | ☐ |

---

## 3. Pilot Flow Per Client

### Step 1: Create the Gallery

1. Log in to `/admin`
2. Create a new gallery: title, event date, client name, client email
3. Upload photos (use the batch upload)
4. Set password (if applicable)
5. Enable downloads (web quality recommended for pilot)
6. Publish

### Step 2: Send the Gallery Invite

1. In gallery detail → Send invite email
2. Verify the email arrives with:
   - Correct gallery title
   - Working gallery link
   - Password block (if applicable)
   - "Open your gallery →" CTA

### Step 3: Client Reviews and Submits Selects

Ask the client to:
- Open the gallery link and enter the password (if set)
- Browse photos in the grid and lightbox
- Heart 3–5 photos they like
- Open the selects drawer and submit with their name and a short note
- Optionally download selected photos

### Step 4: Monitor & Respond

1. Check `/admin/galleries/[id]/favorites` — selects appear within seconds of submission
2. Confirm notification email arrived at your inbox
3. Check `/admin/access-logs` — client access attempt is logged (IP hash only)
4. Check `/admin/download-logs` if they downloaded

---

## 4. What to Observe (Not a Survey — Just Watch)

During the pilot, note any moment where the client:

| Observation point | What to watch for |
|---|---|
| Opening the gallery email | Do they understand what the email is? Does the link work? |
| Entering the password | Is the password gate clear? Do they mistype? Do they know where to find the password? |
| Browsing the grid | Do they scroll naturally? Do they notice the lightbox affordance (click-to-open)? |
| Using the lightbox | Do they navigate with arrows? Do they use keyboard arrows? Do they find the close button? |
| Hearting photos | Is the heart icon intuitive? Do they notice the counter in the toolbar? |
| Opening the selects drawer | Is the "Submit my selects" button discoverable? |
| Submitting selects | Does the form make sense? Do they know what happens next? |
| Downloading | Does the download start promptly? Does the ZIP open correctly? |

---

## 5. Feedback Collection

After 2–3 days of access, send a brief note (text, WhatsApp, or email):

> *"Hey [name] — glad the gallery is up! Quick question while it's fresh: was there anything that felt confusing or slow when you were browsing? Even a small thing. I'm refining the experience and your input helps."*

Log responses in `PILOT_FEEDBACK_REFINEMENT_PLAN.md`.

### Specific questions if they're willing to answer:

1. How easy was it to find and enter the gallery password? (1 = confusing, 5 = obvious)
2. Did the photo grid load quickly enough on your phone?
3. Did the "heart" / selects feature make sense to you?
4. Was there anything you wanted to do but couldn't find?
5. How did the download experience feel? (if they downloaded)

---

## 6. Share Link Pilot

Use the share link feature with a non-client (a friend or family member):

1. Create a share link with 6–10 photos from a gallery, no expiry
2. Send them the link directly
3. Ask them to open it on their phone and let you know:
   - Did the page load within 2 seconds?
   - Did the grid look good at their phone's screen size?
   - Could they open the lightbox and navigate between photos?
4. Revoke the link after the test

---

## 7. Technical Things to Monitor During Pilot

| Monitor | Where | What to look for |
|---------|-------|-----------------|
| Error logs | Vercel Dashboard → Deployments → Functions logs | Any 500 errors during client access |
| Access logs | `/admin/access-logs` | Entries appearing for each client unlock |
| Download logs | `/admin/download-logs` | Entries appearing for each download |
| Selects | `/admin/galleries/[id]/favorites` | Submission appearing within 5s of client click |
| R2 storage | Cloudflare dashboard → R2 | Bandwidth/request metrics |
| Email deliverability | Resend dashboard | Check that invite + selects notification emails are not bouncing |

---

## 8. Success Criteria

The pilot is successful if:

- [ ] All 2–3 pilot clients successfully view their gallery on both desktop and mobile
- [ ] At least 1 client submits selects and the notification arrives correctly
- [ ] At least 1 client downloads photos and the ZIP contains correct files
- [ ] No 500 errors appear in Vercel logs during pilot period
- [ ] Client feedback contains no "I couldn't figure out how to..." moments
- [ ] You can confidently complete the full workflow (create → invite → track → mark deposit) in under 5 minutes

---

## 9. If Something Goes Wrong

| Problem | First response |
|---------|---------------|
| Client can't open gallery link | Check if gallery is published in admin; check Vercel deployment status |
| Password gate not working | Verify `GALLERY_ACCESS_SECRET` is set in Vercel env vars |
| Selects notification not arriving | Check Resend dashboard → check `SELECTS_NOTIFICATION_*` env vars |
| Download fails or ZIP is empty | Check R2 credentials; check `/admin/download-logs` for error reason |
| Photos not loading | Check R2 bucket permissions; signed URLs may have expired (1-hour window) — reload the page |
| Admin can't log in | Verify Supabase Auth user exists and has `role = 'admin'` in profiles table |

---

## 10. Post-Pilot Actions

Once pilot is complete and feedback is collected:

1. Review all feedback and log in `PILOT_FEEDBACK_REFINEMENT_PLAN.md`
2. Prioritize any UX fixes (should be minimal after Phases 3–4)
3. Verify all 3 pilot galleries are in a clean state (archive test galleries if needed)
4. Mark pilot complete
5. Open the site to real client bookings

---

*Generated for Phase 5D — Pilot Test Plan. Last code state: commit `2076097`.*
