"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitBookingInquiry, type BookingInquiryState } from "@/app/book/details/actions";
import { Button } from "@/components/ui/button";

const initialState: BookingInquiryState = { status: "idle", message: "" };
const inputClass = "min-h-12 rounded-[2px] border border-ink/12 bg-[#fbf8f1] px-3 text-base text-ink outline-none transition placeholder:text-ink/34 focus:border-copper";

export function BookingDetailsForm(props: {
  serviceId: string;
  packageName: string;
  eventDate: string;
  eventTime: string;
}) {
  const [state, action, pending] = useActionState(submitBookingInquiry, initialState);

  if (state.status === "success") {
    return (
      <div className="grid min-h-[520px] place-items-center bg-[#f8f3eb] p-8 text-center">
        <div className="max-w-md">
          <CheckCircle2 className="mx-auto size-10 text-copper" aria-hidden="true" />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#8b6444]">Request received</p>
          <h2 className="mt-3 font-serif text-5xl leading-none text-ink">Your date is on my radar.</h2>
          <p className="mt-5 text-base leading-7 text-ink/62">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5 bg-[#f8f3eb] p-5 sm:p-8">
      <input type="hidden" name="serviceId" value={props.serviceId} />
      <input type="hidden" name="packageName" value={props.packageName} />
      <input type="hidden" name="eventDate" value={props.eventDate} />
      <input type="hidden" name="eventTime" value={props.eventTime} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" autoComplete="given-name" error={state.fieldErrors?.firstName} />
        <Field label="Last name" name="lastName" autoComplete="family-name" error={state.fieldErrors?.lastName} />
      </div>
      <Field label="Email" name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} />
      <Field label="Phone number" name="phone" type="tel" autoComplete="tel" error={state.fieldErrors?.phone} />
      <Field label="Shoot location" name="location" placeholder="Venue, neighbourhood, or still deciding" optional />
      <label className="grid gap-2">
        <span className="text-sm font-medium text-ink">Anything I should know? <span className="font-normal text-ink/42">Optional</span></span>
        <textarea
          name="message"
          className="min-h-32 rounded-[2px] border border-ink/12 bg-[#fbf8f1] px-3 py-3 text-base text-ink outline-none transition placeholder:text-ink/34 focus:border-copper"
          placeholder="Tell me about the people, the setting, or what you want the photos to feel like."
        />
      </label>
      <Field label="How did you hear about me?" name="referralSource" placeholder="Instagram, referral, search" optional />

      {state.message ? (
        <p className="rounded-[2px] bg-[#9b3d2f]/10 px-4 py-3 text-sm text-[#7a2e25]">{state.message}</p>
      ) : null}
      <Button type="submit" variant="light" disabled={pending} className="mt-2 w-full sm:w-auto sm:justify-self-start">
        <Send className="size-4" aria-hidden="true" />
        {pending ? "Sending request" : "Request this date"}
      </Button>
      <p className="text-xs leading-5 text-ink/48">
        This sends an inquiry, not an automatic confirmation. Your date is held after availability is confirmed and the 25% deposit is received.
      </p>
    </form>
  );
}
function Field({ label, error, optional, ...inputProps }: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string[];
  optional?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-ink">
        {label} {optional ? <span className="font-normal text-ink/42">Optional</span> : <span className="text-[#9b3d2f]">*</span>}
      </span>
      <input className={inputClass} {...inputProps} />
      {error?.[0] ? <span className="text-sm text-[#9b3d2f]">{error[0]}</span> : null}
    </label>
  );
}
