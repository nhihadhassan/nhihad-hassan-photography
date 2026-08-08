import { redirect } from "next/navigation";

/** Calendar and Bookings were merged into a single Schedule page. */
export default function AdminCalendarPage() {
  redirect("/admin/schedule");
}
