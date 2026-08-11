"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { signAgreement, updateAgreementContactDetailsByToken, type ClientEditableField } from "@/lib/agreements";

export type SignState = { status: "idle" | "success" | "error"; message: string };

export type MissingDetailsState = { status: "idle" | "success" | "error"; message: string };

const CLIENT_EDITABLE_FIELDS: ClientEditableField[] = ["phone", "clientAddress", "startTime", "location"];

/** Lets a client fill in their own missing fields (contact info, start time, venue) before signing. */
export async function submitMissingDetailsAction(
  _prev: MissingDetailsState,
  formData: FormData,
): Promise<MissingDetailsState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { status: "error", message: "Missing signing token." };

  const patch: Partial<Record<ClientEditableField, string>> = {};
  for (const field of CLIENT_EDITABLE_FIELDS) {
    if (formData.has(field)) patch[field] = String(formData.get(field) ?? "").trim();
  }

  const result = await updateAgreementContactDetailsByToken(token, patch);
  if (!result.ok) return { status: "error", message: result.message ?? "Couldn't save those details." };

  revalidatePath(`/agreement/${token}`);
  return { status: "success", message: "Saved." };
}

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
  return {
    status: "success",
    message: result.complete
      ? "Your details and signature are complete. You will receive the finalized copy once the agreement is countersigned."
      : "Your signature is recorded. The agreement is waiting for the other signer.",
  };
}
