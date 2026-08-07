# PHOTOGRAPHY SERVICES AGREEMENT

> **Draft template:** Engineering review only. Do not issue to a client until this version has been approved by Ontario legal counsel.

**{{business.name}}**
{{business.website}} | {{business.email}} | {{business.phone}}

---

This Agreement is made as of **{{signing.date | date}}** between:

**Photographer:** {{business.owner}}, operating as {{business.name}}{{#unless business.is_incorporated}}, a sole proprietorship{{/unless}} ("the Photographer")
Location: {{business.location}}
Email: {{business.email}}
Phone: {{business.phone}}

**Client:**{{#if client.entity_name}} {{client.entity_name}} ("the Client"), signing through the authorized representatives below{{else}} {{#each clients}}{{#unless is_first}} and {{/unless}}{{name}}{{/each}}{{#if is_multi_client}} (together, "the Client"){{else}} ("the Client"){{/if}}{{/if}}

{{#each clients}}- {{name}}, {{email}}{{#if phone}}, {{phone}}{{/if}}
{{/each}}

{{#if is_multi_client}}
Where more than one individual is named as Client, their obligations under this Agreement, including payment, are joint and several. Notice given to any one of them is notice to all.
{{/if}}

The Photographer and the Client are each a "Party" and together the "Parties."

---

## 1. Services

1.1 The Photographer agrees to provide {{shoot.type_label}} as described in **Schedule A: Shoot Details**, attached to and forming part of this Agreement.

1.2 The Photographer will provide the services with reasonable skill and care, using the Photographer's own equipment, in the Photographer's own artistic style as shown in the Photographer's portfolio.

{{#if shoot.alongside_other_vendors}}
1.3 **Role.** The Photographer is engaged by the Client directly and is not employed, supervised or subcontracted by any other photographer or videographer working at the event. The Photographer will work courteously alongside any primary photography or videography team and will not obstruct their coverage.

1.4 The Client confirms that any other photography or videography vendor engaged for the event has been informed of the Photographer's attendance, and that no agreement between the Client and another vendor prohibits or restricts it.
{{/if}}

1.5 Any services not expressly listed in Schedule A are outside the scope of this Agreement. Additional services may be added by written agreement of both Parties and may be subject to additional fees.

---

## 2. Fees and Payment

2.1 **Total Fee.** The total fee for the services is **{{fee.total | money_cad}}**.

2.2 **Retainer.** To reserve the date, the Client will pay a non-refundable retainer of **{{fee.retainer | money_cad}}** (the "Retainer"), being {{fee.retainer_percent | percent}} of the Total Fee. The date is not reserved until the Retainer and a signed copy of this Agreement are both received. The Retainer is applied against the Total Fee.

2.3 **Balance.** The remaining balance of **{{fee.balance | money_cad}}** is due on or before **{{fee.balance_due_date | date}}**.

2.4 **Payment method.** Payments are made by Interac e-Transfer to {{business.email}}, or by another method agreed in writing.

2.5 **Late payment.** Amounts unpaid after the due date accrue interest at {{fee.late_interest_monthly | percent}} per month ({{fee.late_interest_annual | percent}} per year) from the due date until paid. The Photographer may withhold delivery of images until all amounts owing are paid in full.

2.6 **Taxes.** {{#if business.hst_registered}}The Total Fee is exclusive of HST, which will be added at the applicable rate. GST/HST number: {{business.hst_number}}.{{else}}The Total Fee is not subject to HST. The Photographer is not currently registered for GST/HST as a small supplier under the *Excise Tax Act*.{{/if}}

2.7 **Expenses.** {{#if fee.all_inclusive}}The Total Fee is all inclusive. There are no additional travel, parking or equipment charges.{{else}}The following are billed separately at cost: {{fee.separate_expenses}}.{{/if}}

---

## 3. Deliverables and Delivery

3.1 The Photographer will deliver a minimum of **{{deliverables.min_images | number}}** edited digital images in high resolution JPEG format, and expects to deliver approximately **{{deliverables.expected_images | number}} or more**, selected by the Photographer from the images captured.

{{#if deliverables.has_preview}}
3.2 A preview selection of approximately {{deliverables.preview_count | number}} edited images will be delivered within **{{deliverables.preview_days | number}} business days** of the shoot date.
{{/if}}

3.3 The full gallery will be delivered by online gallery within **{{deliverables.delivery_days | number}} business days** of the shoot date, or within {{deliverables.delivery_days | number}} business days of final payment, whichever is later.

3.4 The gallery will remain available for download for **{{deliverables.gallery_days | number}} days** from the delivery date. The Client is responsible for downloading and backing up the images within that period.

3.5 **Editing.** Delivered images are edited at the Photographer's discretion for exposure, colour, contrast and basic cleanup. Extensive retouching, compositing, object removal or body modification is not included and may be quoted separately.

3.6 **RAW files.** Unedited, raw or rejected images are not delivered and are not part of the deliverables. They form part of the Photographer's working process.

3.7 **Revisions.** The Client may request up to {{policy.revision_rounds | number}} round{{policy.revision_rounds | plural_s}} of minor revisions on up to {{policy.revision_images | number}} images within {{policy.revision_window_days | number}} days of delivery, at no additional charge. Revisions requested after that period may be subject to a fee, quoted in advance.

3.8 **Archiving.** The Photographer will retain delivered images for a minimum of {{deliverables.archive_days | number}} days after delivery but is under no obligation to archive them permanently.

---

## 4. Copyright, Licence and Credit

4.1 **Ownership.** The Photographer retains all copyright in every image created under this Agreement, in accordance with the *Copyright Act* (Canada). Nothing in this Agreement transfers copyright to the Client unless a separate written assignment is signed.

4.2 **Licence to the Client.** On receipt of full payment, the Photographer grants the Client a non-exclusive, perpetual, worldwide, non-transferable licence to use the delivered images for {{#if licence.is_commercial}}**commercial use**. This includes the Client's own marketing, advertising, website, social media, and internal materials. The Client may not resell, sublicense, or transfer the images to third parties, or make them available in a stock library.{{else}}**personal use**. This includes personal display, printing, sharing with family and friends, and posting to the Client's personal social media accounts. Commercial use, resale, and licensing to third parties are not permitted.{{/if}}

4.3 **No alteration.** The Client may not crop, filter, recolour, add graphics to, or otherwise materially alter the images without the Photographer's prior written consent, except for standard cropping required by a social media platform.

4.4 **Credit.** Where the images are used publicly, the Client will credit "{{business.name}}" or tag {{business.instagram}} where the platform allows it. This is a good faith obligation and not a condition of the licence.

4.5 **Moral rights.** The Photographer does not waive the Photographer's moral rights in the images.

{{#unless licence.is_commercial}}
4.6 **Third party and vendor use.** The personal use licence does not extend to businesses. If a venue, planner, florist, caterer, decorator, or other vendor wishes to use the images for their own marketing, they must contact the Photographer directly for permission. The Client may not supply the images to any business for that purpose without the Photographer's written consent.
{{/unless}}

---

## 5. Portfolio and Promotional Use

5.1 The Client grants the Photographer the right to use images created under this Agreement in the Photographer's portfolio, website, social media, printed samples, competition entries, and promotional materials.

5.2 If the Client wishes to restrict this right, the Client must notify the Photographer in writing before the shoot date. A privacy surcharge{{#if policy.has_privacy_surcharge_amount}} of {{policy.privacy_surcharge | money_cad}}{{else}}, quoted on request,{{/if}} may apply.

5.3 The Photographer will not sell or license images to unrelated third parties for their own commercial purposes without the Client's written consent.

---

## 6. Client Responsibilities

6.1 The Client will:

a) Ensure the Photographer has safe, timely and unobstructed access to the shoot locations, including any venue permissions, vendor lists, permits or clearances required;
b) Provide accurate addresses, timings, and a day of contact person who is reachable throughout;
c) Communicate any shot list, must have images, key people, and any cultural, religious or venue restrictions on photography at least {{policy.shot_list_notice_days | number}} days before the shoot date;
d) Ensure that individuals to be photographed are aware that photography is taking place, and that consent is obtained from a parent or guardian for anyone under 18 who is individually photographed at the Client's request;
e) Be responsible for the conduct of guests and attendees.

6.2 **Delays.** If coverage is delayed by the Client, the venue, other vendors, or guests, the Photographer is not required to extend the end time set out in Schedule A.

{{#if fee.has_overtime_rate}}
6.3 **Overtime.** Time beyond the coverage hours in Schedule A is billed at **{{fee.overtime_rate | money_cad}} per hour**, in {{fee.overtime_increment | number}} minute increments, payable within 7 days of the shoot. Overtime must be agreed on site by the Client or the Client's day of contact.
{{else}}
6.3 **Extension of coverage.** The Photographer does not charge an overtime rate. If the Photographer remains beyond the scheduled end time, it is at the Photographer's sole discretion and as a courtesy. It is not an entitlement of the Client and is not guaranteed.
{{/if}}

{{#if shoot.spans_meal}}
6.4 **Meal.** Where coverage spans a meal service, the Client will arrange a vendor meal or a reasonable break for the Photographer.
{{/if}}

---

## 7. Cancellation, Rescheduling and Postponement

7.1 **Cancellation by the Client.** The Client may cancel at any time by written notice. The Retainer is non-refundable in all cases, as it compensates the Photographer for holding the date and turning away other work. In addition:

- Cancellation {{policy.cancel_full_refund_days | number}} or more days before the shoot date: no further amount owing.
- Cancellation {{policy.cancel_mid_days | number}} to {{policy.cancel_mid_upper | number}} days before: {{policy.cancel_mid_percent | percent}} of the Total Fee is owing.
- Cancellation {{policy.cancel_late_days | number}} days or fewer before: {{policy.cancel_late_percent | percent}} of the Total Fee is owing.

7.2 **Rescheduling by the Client.** The Client may reschedule once, without penalty, by written notice given at least {{policy.reschedule_notice_days | number}} days before the shoot date, subject to the Photographer's availability. The Retainer transfers to the new date. The new date must fall within {{policy.reschedule_window_months | number}} months of the original date. Further rescheduling is treated as a cancellation under section 7.1.

7.3 **Cancellation by the Photographer.** If the Photographer cancels for any reason other than a Force Majeure Event or the Client's breach, the Photographer will refund all amounts paid, including the Retainer, and will make reasonable efforts to recommend a replacement photographer of comparable standard. The Photographer's liability in that case is limited as set out in section 9.

7.4 **Illness, emergency and substitution.** If the Photographer is unable to attend due to illness, injury, emergency or other circumstances beyond the Photographer's reasonable control, the Photographer will make reasonable efforts to arrange a qualified replacement photographer at no additional cost to the Client. If no replacement can be found, section 7.3 applies.

7.5 **Force Majeure.** Neither Party is liable for failure to perform due to events beyond its reasonable control, including severe weather, natural disaster, fire, flood, power failure, epidemic or pandemic, public health order, government restriction, transit shutdown, civil unrest, or venue closure (a "Force Majeure Event"). In that case the Parties will make reasonable efforts to reschedule. If rescheduling is not possible, the Photographer will refund all amounts paid except the Retainer.

7.6 **Unsafe conditions.** The Photographer may end coverage early, without refund, if the Photographer reasonably believes that continuing would put the Photographer, the Photographer's equipment, or others at risk of harm, including due to threatening or abusive behaviour or unsafe premises.

---

## 8. Creative Control and Client Expectations

8.1 The Client has reviewed the Photographer's portfolio and engages the Photographer for the Photographer's particular style and approach.

8.2 The Photographer has full creative discretion over composition, framing, lighting, image selection, and editing, while making reasonable efforts to accommodate the Client's requests and shot list.

8.3 Photography is a subjective art form. Dissatisfaction with the Photographer's artistic style, or with the appearance of persons or locations photographed, is not grounds for a refund or a reshoot.

8.4 The Photographer cannot guarantee that any specific person, moment, or shot will be captured. Lighting, movement, crowding, and venue rules are outside the Photographer's control.

{{#if shoot.alongside_other_vendors}}
8.5 Where a primary photography or videography team is present, that team may have priority access to certain positions and moments. The Photographer cannot guarantee angles or vantage points controlled by others.
{{/if}}

---

## 9. Limitation of Liability

9.1 The Photographer's total liability under this Agreement, whether in contract, tort, or otherwise, is limited to the total amount actually paid by the Client under this Agreement.

9.2 Neither Party is liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, opportunity, or reputation.

9.3 **Equipment failure and loss of data.** In the unlikely event of equipment failure, memory card corruption, theft, or loss of images before delivery, the Photographer's liability is limited to a refund of the amounts paid for the affected portion of the work. The Photographer follows reasonable backup practices, including {{business.backup_practice}}.

9.4 The Photographer is not responsible for the quality of, or delays caused by, third party services such as venues, labs, printers, or online gallery providers.

---

## 10. Indemnity and Insurance

10.1 The Client will indemnify and hold the Photographer harmless from any claim arising from the Client's breach of this Agreement, from the conduct of the Client's guests or attendees, or from a lack of required permission, permit or consent that the Client was responsible for obtaining under section 6.1.

{{#if business.has_insurance}}
10.2 The Photographer carries general liability insurance. Where a venue requires proof of insurance or a certificate naming the venue as an additional insured, the Client will notify the Photographer at least 15 days before the shoot date.
{{else}}
10.2 The Photographer does not currently carry general liability insurance. The Client confirms that the venue does not require a certificate of insurance from the Photographer as a condition of entry. If the venue does require one, the Client will notify the Photographer immediately, and either Party may terminate this Agreement with a full refund of all amounts paid, including the Retainer.
{{/if}}

---

## 11. Privacy and Personal Information

11.1 The Photographer will handle the Client's personal information in accordance with applicable Canadian privacy law and the privacy policy published at {{business.website}}.

11.2 The Photographer will not share the Client's contact information with third parties except as needed to perform the services, such as a gallery host or payment processor.

11.3 The gallery may be password protected on request.

---

## 12. General

12.1 **Assignment.** The Photographer may engage {{#if shoot.has_assistant}}an assistant or second shooter{{else}}an assistant{{/if}} to help perform the services and remains responsible for their work, and ensures that copyright in their images is assigned to the Photographer. The Client may not assign this Agreement without the Photographer's written consent.

12.2 **Independent contractor.** The Photographer is an independent contractor, not an employee, partner or agent of the Client{{#if shoot.alongside_other_vendors}} or of any other vendor at the event{{/if}}.

12.3 **Notices.** Notices under this Agreement are given in writing by email to the addresses on page one and are deemed received on the next business day after sending.

12.4 **Entire agreement.** This Agreement, including Schedule A, is the entire agreement between the Parties and supersedes all prior discussions, quotes, messages and understandings.

12.5 **Amendments.** Any change to this Agreement must be in writing and signed or confirmed by email by both Parties.

12.6 **Severability.** If any provision is found unenforceable, the remaining provisions continue in full force.

12.7 **Governing law.** This Agreement is governed by the laws of the Province of Ontario and the federal laws of Canada applicable in Ontario. The Parties attorn to the exclusive jurisdiction of the courts of Ontario.

12.8 **Dispute resolution.** Before starting any legal proceeding, the Parties will attempt in good faith to resolve any dispute by direct discussion for at least {{policy.dispute_discussion_days | number}} days. Claims within the monetary limit of the Ontario Small Claims Court may be brought there.

12.9 **Electronic signature.** This Agreement may be signed electronically and in counterparts. An electronic signature has the same effect as an original signature.

---

## Signatures

By signing below, each Party confirms that it has read, understood, and agrees to be bound by this Agreement.

**Photographer**

Signature: ______________________________

Name: {{business.owner}}, {{business.name}}

Date: ______________________________

**Client**

{{#each clients}}
Signature: ______________________________

Name: {{name}}

Date: ______________________________

{{/each}}

---

# SCHEDULE A: SHOOT DETAILS

| Item | Detail |
|---|---|
| Shoot type | {{shoot.type_label}} |
| Date | {{shoot.date | date_full}} |
| Coverage hours | {{shoot.start_time}} to {{shoot.end_time}} ({{shoot.coverage_hours | number}} hours) |
| Primary location | {{shoot.primary_location}} |
{{#if shoot.additional_locations}}| Additional locations | {{shoot.additional_locations}} |
{{/if}}| Day of contact | {{shoot.contact_name}}, {{shoot.contact_phone}} |
{{#if shoot.alongside_other_vendors}}| Photographer's role | Additional photographer, engaged directly by the Client, working alongside the primary photography and videography team |
{{/if}}| Assistant or second shooter | {{#if shoot.has_assistant}}Yes{{else}}None{{/if}} |
| Deliverables | Minimum {{deliverables.min_images | number}} edited high resolution JPEGs, expected approximately {{deliverables.expected_images | number}} or more |
{{#if deliverables.has_preview}}| Preview delivery | Approximately {{deliverables.preview_count | number}} images within {{deliverables.preview_days | number}} business days |
{{/if}}| Full delivery | Online gallery within {{deliverables.delivery_days | number}} business days, estimated {{deliverables.estimated_delivery_date | date}} |
| Gallery availability | {{deliverables.gallery_days | number}} days from delivery |
| Licence type | {{#if licence.is_commercial}}Commercial use{{else}}Personal use{{/if}} |
{{#if shoot.shot_list}}| Shot list and key people | {{shoot.shot_list}} |
{{/if}}{{#if shoot.restrictions}}| Restrictions | {{shoot.restrictions}} |
{{/if}}

### Fee Breakdown

| Line item | Amount (CAD) |
|---|---|
| Coverage, {{shoot.coverage_hours | number}} hours{{#if fee.all_inclusive}}, all inclusive{{/if}} | {{fee.total | money}} |
| **Total Fee** | **{{fee.total | money}}** |
| Retainer due on signing | {{fee.retainer | money}} |
| Balance due {{fee.balance_due_date | date}} | {{fee.balance | money}} |

### Overtime

{{#if fee.has_overtime_rate}}{{fee.overtime_rate | money_cad}} per hour, billed in {{fee.overtime_increment | number}} minute increments.{{else}}No overtime rate. Coverage beyond {{shoot.end_time}} is at the Photographer's discretion and is not guaranteed.{{/if}}

---

*{{business.name}}. This document is not legal advice.*
