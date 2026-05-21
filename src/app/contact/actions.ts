"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inquirySchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().optional(),
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
  location: z.string().optional(),
  budget: z.string().optional(),
  referralSource: z.string().optional(),
  message: z.string().min(10, "Please share a little more about what you are planning."),
});

export type InquiryState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof inquirySchema>, string[]>>;
};

export async function submitInquiry(
  _previousState: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    eventType: formData.get("eventType") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    location: formData.get("location") || undefined,
    budget: formData.get("budget") || undefined,
    referralSource: formData.get("referralSource") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("inquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      event_type: parsed.data.eventType || null,
      event_date: parsed.data.eventDate || null,
      location: parsed.data.location || null,
      budget: parsed.data.budget || null,
      referral_source: parsed.data.referralSource || null,
      message: parsed.data.message,
    });

    if (error) {
      return {
        status: "error",
        message: "The inquiry could not be sent. Please email directly for now.",
      };
    }

    return {
      status: "success",
      message:
        "Your inquiry was sent. If we're a good fit, you'll hear back to confirm the booking — deposit payment instructions will be included in that reply via Interac e-Transfer.",
    };
  } catch {
    return {
      status: "error",
      message:
        "Supabase is not configured yet. Add the environment variables, or email directly for now.",
    };
  }
}

