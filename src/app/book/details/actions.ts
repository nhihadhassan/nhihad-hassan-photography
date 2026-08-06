"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendInquiryAdminAlert, sendInquiryAutoReply } from "@/lib/notify-email";
import { findBookingSelection } from "@/lib/booking-options";
import { getPricing } from "@/lib/pricing";

const schema = z.object({
  firstName: z.string().trim().min(2, "Please enter your first name."),
  lastName: z.string().trim().min(2, "Please enter your last name."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().trim().min(7, "Please enter a phone number."),
  location: z.string().trim().optional(),
  message: z.string().trim().optional(),
  referralSource: z.string().trim().optional(),
  serviceId: z.string(),
  packageName: z.string(),
  eventDate: z.iso.date(),
  eventTime: z.string().trim().min(1),
});

export type BookingInquiryState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof schema>, string[]>>;
};

export async function submitBookingInquiry(
  _previous: BookingInquiryState,
  formData: FormData,
): Promise<BookingInquiryState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const pricing = await getPricing();
  const selection = findBookingSelection(pricing, parsed.data.serviceId, parsed.data.packageName);
  if (!selection) {
    return { status: "error", message: "That package is no longer available. Please choose it again." };
  }

  const name = `${parsed.data.firstName} ${parsed.data.lastName}`;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("inquiries").insert({
      name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      event_type: selection.category.label,
      event_date: parsed.data.eventDate,
      event_time: parsed.data.eventTime,
      package_name: selection.tier.name,
      location: parsed.data.location || null,
      budget: selection.tier.price,
      referral_source: parsed.data.referralSource || null,
      message: parsed.data.message || "No additional message.",
    });
    if (error) throw error;

    await Promise.allSettled([
      sendInquiryAutoReply({ to: parsed.data.email, name }),
      sendInquiryAdminAlert({
        name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        eventType: selection.category.label,
        packageName: selection.tier.name,
        eventDate: parsed.data.eventDate,
        eventTime: parsed.data.eventTime,
        location: parsed.data.location,
        budget: selection.tier.price,
        message: parsed.data.message || "No additional message.",
      }),
    ]);

  } catch {
    return {
      status: "error",
      message: "Your request could not be sent. Please try again or email me directly.",
    };
  }

  const query = new URLSearchParams({
    service: selection.category.id,
    package: selection.tier.name,
    date: parsed.data.eventDate,
    time: parsed.data.eventTime,
  });
  redirect(`/book/confirmation?${query.toString()}`);
}
