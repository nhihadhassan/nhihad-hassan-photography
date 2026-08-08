import { redirect } from "next/navigation";

/** Superseded by the document-first templates editor. Keep the URL alive for old bookmarks. */
export default function AdminBookingAgreementPage() {
  redirect("/admin/templates");
}
