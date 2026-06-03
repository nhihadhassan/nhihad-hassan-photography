"use client";

import { useActionState } from "react";
import { ArrowDown, Send } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { useSelectedDate } from "@/components/selected-date-context";

const initialState: InquiryState = {
  status: "idle",
  message: "",
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-[#9b3d2f]">{errors[0]}</p>;
}

function Required() {
  return (
    <span className="text-[#9b3d2f]" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

const inputClass =
  "min-h-12 rounded-[2px] border border-ink/12 bg-[#fbf8f1] px-3 text-base text-ink outline-none transition placeholder:text-ink/34 focus:border-copper";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);
  const { selectedDate, setSelectedDate } = useSelectedDate();

  return (
    <form action={formAction} className="grid gap-5">
      {/* The essentials, asked conversationally. */}
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">
            Name
            <Required />
          </span>
          <input className={inputClass} name="name" autoComplete="name" />
          <FieldError errors={state.fieldErrors?.name} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">
            Email
            <Required />
          </span>
          <input className={inputClass} name="email" type="email" autoComplete="email" />
          <FieldError errors={state.fieldErrors?.email} />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Event date</span>
          <input
            className={inputClass}
            name="eventDate"
            type="date"
            value={selectedDate ?? ""}
            onChange={(e) => setSelectedDate(e.target.value || null)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Shoot type</span>
          <input className={inputClass} name="eventType" placeholder="Wedding, engagement, event, portrait, nightlife…" />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-ink">
          Message
          <Required />
        </span>
        <textarea
          className="min-h-36 rounded-[2px] border border-ink/12 bg-[#fbf8f1] px-3 py-3 text-base text-ink outline-none transition placeholder:text-ink/34 focus:border-copper"
          name="message"
          placeholder="Tell me about your shoot — the date, the vibe, and what you want the photos to feel like."
        />
        <FieldError errors={state.fieldErrors?.message} />
      </label>

      {/* Secondary, optional details kept visually lighter. */}
      <div className="mt-1 border-t border-ink/10 pt-5">
        <p className="text-xs uppercase tracking-[0.18em] text-ink/60">Optional details</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink/75">Phone</span>
            <input className={inputClass} name="phone" type="tel" autoComplete="tel" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink/75">Location</span>
            <input className={inputClass} name="location" placeholder="Toronto, venue, or neighbourhood" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink/75">Budget</span>
            <input className={inputClass} name="budget" placeholder="Optional" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink/75">How did you hear about me?</span>
            <input className={inputClass} name="referralSource" placeholder="Instagram, referral, search" />
          </label>
        </div>
      </div>
      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-[2px] bg-[#d8c8b2]/35 px-4 py-3 text-sm text-ink"
              : "rounded-[2px] bg-[#9b3d2f]/10 px-4 py-3 text-sm text-[#7a2e25]"
          }
        >
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="submit" variant="light" disabled={pending}>
          <Send className="size-4" aria-hidden="true" />
          {pending ? "Sending" : "Send inquiry"}
        </Button>
        <p className="inline-flex items-center gap-1.5 text-xs text-ink/60">
          <ArrowDown className="size-3.5" aria-hidden="true" />
          Check availability below
        </p>
      </div>
    </form>
  );
}

