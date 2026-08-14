import { redirect } from "next/navigation";

/** The bookings list was merged into the Schedule page, alongside the live calendar. */
export default function AdminBookingsPage() {
  redirect("/admin#bookings");
}
