"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sendInquiryAdminAlert, sendInquiryAutoReply } from "@/lib/notify-email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  firstName: z.string().trim().min(2, "Please enter your first name."),
  lastName: z.string().trim().min(2, "Please enter your last name."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().trim().min(7, "Please enter a phone number."),
  shootType: z.string().trim().min(2, "Please describe the type of shoot."),
  preferredDate: z.string().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Please enter a valid date."),
  location: z.string().trim().optional(),
  budget: z.string().trim().min(1, "Please share your approximate budget."),
  photoCount: z.coerce.number().int().min(1, "Please request at least one photo.").max(5000, "Please enter 5,000 photos or fewer."),
  coverage: z.string().trim().min(1, "Please choose the coverage time you need."),
  details: z.string().trim().min(10, "Please share a little more about the package you need."),
  referralSource: z.string().trim().optional(),
});

export type CustomPackageState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof schema>, string[]>>;
};

export async function submitCustomPackageRequest(
  _previous: CustomPackageState,
  formData: FormData,
): Promise<CustomPackageState> {
  const parsed = schema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    shootType: formData.get("shootType") ?? "",
    preferredDate: formData.get("preferredDate") ?? "",
    location: formData.get("location") ?? "",
    budget: formData.get("budget") ?? "",
    photoCount: formData.get("photoCount") ?? "",
    coverage: formData.get("coverage") ?? "",
    details: formData.get("details") ?? "",
    referralSource: formData.get("referralSource") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const name = `${parsed.data.firstName} ${parsed.data.lastName}`;
  const requestDetails = [
    `Desired edited photos: ${parsed.data.photoCount}`,
    `Coverage requested: ${parsed.data.coverage}`,
    "",
    "Extra details:",
    parsed.data.details,
  ].join("\n");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("inquiries").insert({
      name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      event_type: parsed.data.shootType,
      package_name: "Custom package request",
      event_date: parsed.data.preferredDate || null,
      event_time: null,
      location: parsed.data.location || null,
      budget: parsed.data.budget,
      referral_source: parsed.data.referralSource || null,
      message: requestDetails,
    });
    if (error) throw error;

    await Promise.allSettled([
      sendInquiryAutoReply({ to: parsed.data.email, name }),
      sendInquiryAdminAlert({
        name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        eventType: parsed.data.shootType,
        packageName: "Custom package request",
        eventDate: parsed.data.preferredDate || null,
        eventTime: parsed.data.coverage,
        location: parsed.data.location,
        budget: parsed.data.budget,
        message: requestDetails,
      }),
    ]);
  } catch {
    return {
      status: "error",
      message: "Your request could not be sent. Please try again or email me directly.",
    };
  }

  redirect("/book/custom/confirmation");
}
