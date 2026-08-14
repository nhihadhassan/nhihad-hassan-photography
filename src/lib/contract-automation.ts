import "server-only";

import { randomBytes } from "node:crypto";
import { getAgreementRequestById } from "@/lib/agreements";
import { titleCaseClientName } from "@/lib/client-names";
import { contractAutomationValues } from "@/lib/contract-automation-values";
import { torontoLocalToUtc } from "@/lib/ics";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { BookingStage } from "@/lib/booking-stages";

export class ContractAutomationValidationError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Complete the contract's ${missing.join(", ")} before sending.`);
    this.name = "ContractAutomationValidationError";
    this.missing = missing;
  }
}

/**
 * Turns a successfully sent agreement into the operational records that power
 * Today, Pipeline and Invoices. Every identity is protected by a unique key,
 * so a resend or double click updates the same records instead of duplicating.
 */
export async function materializeAgreementWorkflow(agreementRequestId: string): Promise<{ bookingId: string }> {
  const request = await getAgreementRequestById(agreementRequestId);
  if (!request) throw new Error("Agreement request not found.");
  if (!request.sent_at) throw new Error("The agreement must be sent before its job can be created.");

  const parsed = contractAutomationValues(request.details);
  if (!parsed.ok) throw new ContractAutomationValidationError(parsed.missing);
  const values = parsed.values;

  const start = torontoLocalToUtc(`${values.shootDate}T${values.startTime}`);
  if (!start) throw new ContractAutomationValidationError(["valid Toronto shoot date and time"]);
  const end = new Date(start.getTime() + values.durationMinutes * 60_000);
  const stage: BookingStage = end.getTime() <= Date.now()
    ? "editing"
    : request.signed_at
      ? "booked"
      : "contract_out";

  const primaryName = titleCaseClientName(request.details.signerName || request.client_name || "Client");
  const secondaryName = request.details.secondSignerName
    ? titleCaseClientName(request.details.secondSignerName)
    : null;
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin.rpc("materialize_contract_workflow", {
    p_agreement_id: request.id,
    p_primary_name: primaryName,
    p_primary_email: request.client_email,
    p_primary_phone: request.details.phone ?? null,
    p_primary_address: request.details.clientAddress ?? null,
    p_secondary_name: secondaryName,
    p_secondary_email: request.details.secondSignerEmail ?? null,
    p_secondary_phone: request.details.secondSignerPhone ?? null,
    p_shoot_type: request.details.type || request.details.description || "Photography coverage",
    p_start_at: start.toISOString(),
    p_end_at: end.toISOString(),
    p_location: values.location,
    p_total: values.total,
    p_invoice_due_date: values.invoiceDueDate,
    p_delivery_due_date: values.deliveryDueDate,
    p_stage: stage,
    p_calendar_event_id: request.calendar_event_id,
    p_booking_token: randomBytes(24).toString("hex"),
  });
  if (error || !data) throw new Error(error?.message ?? "Could not materialize the contract workflow.");
  return { bookingId: String(data) };
}
