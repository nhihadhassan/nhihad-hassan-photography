"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  submitCustomPackageRequest,
  type CustomPackageState,
} from "@/app/book/custom/actions";
import { Button } from "@/components/ui/button";

const initialState: CustomPackageState = { status: "idle", message: "" };
const inputClass =
  "min-h-12 rounded-[2px] border border-ink/12 bg-[#fbf8f1] px-3 text-base text-ink outline-none transition placeholder:text-ink/34 focus:border-copper";

export function CustomPackageForm() {
  const [state, action, pending] = useActionState(submitCustomPackageRequest, initialState);

  return (
    <form action={action} className="grid gap-6 bg-[#f8f3eb] p-5 sm:p-8">
      <fieldset className="grid gap-5">
        <legend className="font-serif text-3xl text-ink">Your package</legend>
        <Field
          label="Type of shoot or event"
          name="shootType"
          placeholder="Wedding, launch, family event, editorial…"
          error={state.fieldErrors?.shootType}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Approximate budget"
            name="budget"
            inputMode="decimal"
            placeholder="Around $500"
            error={state.fieldErrors?.budget}
          />
          <Field
            label="Edited photos requested"
            name="photoCount"
            type="number"
            min="1"
            max="5000"
            placeholder="75"
            error={state.fieldErrors?.photoCount}
          />
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">
            Coverage time <Required />
          </span>
          <select name="coverage" defaultValue="" className={inputClass}>
            <option value="" disabled>Choose coverage time</option>
            <option>Under 1 hour</option>
            <option>1–2 hours</option>
            <option>3–4 hours</option>
            <option>5–6 hours</option>
            <option>Full day (8+ hours)</option>
            <option>Not sure yet</option>
          </select>
          <FieldError errors={state.fieldErrors?.coverage} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">
            Extra details <Required />
          </span>
          <textarea
            name="details"
            className="min-h-36 rounded-[2px] border border-ink/12 bg-[#fbf8f1] px-3 py-3 text-base text-ink outline-none transition placeholder:text-ink/34 focus:border-copper"
            placeholder="Tell me what you are planning, the moments that matter, and anything the standard packages do not cover."
          />
          <FieldError errors={state.fieldErrors?.details} />
        </label>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-ink/10 pt-6">
        <legend className="font-serif text-3xl text-ink">How to reach you</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" name="firstName" autoComplete="given-name" error={state.fieldErrors?.firstName} />
          <Field label="Last name" name="lastName" autoComplete="family-name" error={state.fieldErrors?.lastName} />
        </div>
        <Field label="Email" name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} />
        <Field label="Phone number" name="phone" type="tel" autoComplete="tel" error={state.fieldErrors?.phone} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Preferred date" name="preferredDate" type="date" optional error={state.fieldErrors?.preferredDate} />
          <Field label="Location" name="location" placeholder="Venue, city, or still deciding" optional />
        </div>
        <Field label="How did you hear about me?" name="referralSource" placeholder="Instagram, referral, search" optional />
      </fieldset>

      {state.message ? (
        <p className="rounded-[2px] bg-[#9b3d2f]/10 px-4 py-3 text-sm text-[#7a2e25]">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="light" disabled={pending} className="w-full sm:w-auto sm:justify-self-start">
        <Send className="size-4" aria-hidden="true" />
        {pending ? "Sending request" : "Request a custom quote"}
      </Button>
      <p className="text-xs leading-5 text-ink/65">
        This is a request, not an automatic booking. I&apos;ll review the scope and reply with availability, a tailored quote, and next steps.
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
        {label} {optional ? <span className="font-normal text-ink/60">Optional</span> : <Required />}
      </span>
      <input className={inputClass} {...inputProps} />
      <FieldError errors={error} />
    </label>
  );
}

function Required() {
  return <span className="text-[#9b3d2f]" aria-hidden="true">*</span>;
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <span className="text-sm text-[#9b3d2f]">{errors[0]}</span> : null;
}
