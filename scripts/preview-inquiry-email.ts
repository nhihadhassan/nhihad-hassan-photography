/** Renders the inquiry alert to an HTML file so the layout can be eyeballed. */
import { writeFileSync } from "node:fs";
import { buildInquiryAdminAlert } from "../src/lib/emails/inquiry-alert";

const out = process.argv[2] ?? "inquiry-preview.html";
const { html } = buildInquiryAdminAlert({
  name: "Syed Imam",
  email: "contact@syedimam.com",
  phone: "16472004350",
  eventType: "1st Year Anniversary Shoot",
  eventDate: "2026-10-02",
  location: "Parkwood Estate",
  message: "We want to hit up Parkwood Estate in Oshawa, as we really like the fountain area.",
});
writeFileSync(out, html);
console.log(`wrote ${out}`);
