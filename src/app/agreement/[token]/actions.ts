"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { signAgreement } from "@/lib/agreements";

export type SignState = { status: "idle" | "success" | "error"; message: string };

export async function submitSignatureAction(
  _prev: SignState,
  formData: FormData,
): Promise<SignState> {
  const token = String(formData.get("token") ?? "");
  const signerName = String(formData.get("signer_name") ?? "").trim();
  const signerEmail = String(formData.get("signer_email") ?? "").trim() || null;
  const signatureDataUrl = String(formData.get("signature") ?? "") || null;
  const consent = formData.get("consent") === "on";

  if (!token) return { status: "error", message: "Missing signing token." };
  if (signerName.length < 2) return { status: "error", message: "Please type your full legal name." };
  if (!consent) return { status: "error", message: "Please check the box to agree to the terms." };
  if (!signatureDataUrl || !signatureDataUrl.startsWith("data:image/")) {
    return { status: "error", message: "Please draw your signature in the box." };
  }
  if (signatureDataUrl.length > 1_500_000) {
    return { status: "error", message: "Signature image is too large. Please clear and try again." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent") || null;

  const result = await signAgreement({
    token,
    signerName,
    signerEmail,
    signatureDataUrl,
    ip,
    userAgent,
  });

  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath(`/agreement/${token}`);
  return { status: "success", message: "Signed. Thank you." };
}
