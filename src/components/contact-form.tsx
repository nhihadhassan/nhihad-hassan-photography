"use client";

import { useState } from "react";
import { useActionState } from "react";
import { CalendarDays, Lock, Send } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { useSelectedDate } from "@/components/selected-date-context";

const initialState: InquiryState = {
  status: "idle",
  message: "",
};

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <p id={id} role="alert" className="text-sm text-[#e8998a]">
      {errors[0]}
    </p>
  );
}

function Required() {
  return (
    <span className="text-copper" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

const inputClass =
  "min-h-12 w-full rounded-[2px] border border-soft-white/18 bg-charcoal px-3 text-base text-soft-white outline-none transition placeholder:text-soft-white/34 hover:border-soft-white/32 focus:border-copper";

const labelClass = "text-sm font-medium text-soft-white/80";

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);
  const { selectedDate, selectedService } = useSelectedDate();
  const [eventType, setEventType] = useState("");
  const [lastSelectedService, setLastSelectedService] = useState(selectedService);

  if (selectedService !== lastSelectedService) {
    setLastSelectedService(selectedService);
    if (selectedService && !eventType) {
      setEventType(selectedService);
    }
  }

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>
            Name
            <Required />
          </span>
          <input
            className={inputClass}
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            aria-invalid={state.fieldErrors?.name?.length ? true : undefined}
            aria-describedby={state.fieldErrors?.name?.length ? "name-error" : undefined}
          />
          <FieldError id="name-error" errors={state.fieldErrors?.name} />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>
            Email
            <Required />
          </span>
          <input
            className={inputClass}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={state.fieldErrors?.email?.length ? true : undefined}
            aria-describedby={state.fieldErrors?.email?.length ? "email-error" : undefined}
          />
          <FieldError id="email-error" errors={state.fieldErrors?.email} />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Date</span>
          <button
            type="button"
            onClick={() =>
              document.getElementById("availability")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className={`${inputClass} flex items-center justify-between text-left`}
          >
            <span className={selectedDate ? "text-soft-white" : "text-soft-white/34"}>
              {selectedDate ? formatDisplayDate(selectedDate) : "Choose from availability"}
            </span>
            <CalendarDays className="size-4 shrink-0 text-copper" aria-hidden="true" />
          </button>
          <input type="hidden" name="eventDate" value={selectedDate ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Shoot type</span>
          <input
            className={inputClass}
            name="eventType"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            placeholder="Wedding, engagement, event, portrait, nightlife…"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Phone</span>
          <input
            className={inputClass}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(416) 123-4567"
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Location</span>
          <input className={inputClass} name="location" placeholder="Toronto, venue, or neighbourhood" />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Budget</span>
          <input className={inputClass} name="budget" placeholder="e.g. $500 – $1,000" />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>How did you hear about me?</span>
          <input className={inputClass} name="referralSource" placeholder="Instagram, referral, search" />
        </label>
      </div>

      <label className="grid gap-2">
        <span className={labelClass}>Message</span>
        <textarea
          className="min-h-28 w-full rounded-[2px] border border-soft-white/18 bg-charcoal px-3 py-3 text-base text-soft-white outline-none transition placeholder:text-soft-white/34 hover:border-soft-white/32 focus:border-copper"
          name="message"
          placeholder="Tell me about your shoot: the date, the vibe, and what you want the photos to feel like."
          aria-invalid={state.fieldErrors?.message?.length ? true : undefined}
          aria-describedby={state.fieldErrors?.message?.length ? "message-error" : undefined}
        />
        <FieldError id="message-error" errors={state.fieldErrors?.message} />
      </label>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-[2px] border border-copper/30 bg-copper/10 px-4 py-3 text-sm text-soft-white"
              : "rounded-[2px] border border-[#9b3d2f]/40 bg-[#9b3d2f]/10 px-4 py-3 text-sm text-[#e8998a]"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button type="submit" variant="primary" disabled={pending}>
          <Send className="size-4" aria-hidden="true" />
          {pending ? "Sending" : "Send inquiry"}
        </Button>
        <p className="inline-flex items-center gap-2 text-xs text-soft-white/45">
          <Lock className="size-3.5" aria-hidden="true" />
          Your details are secure and private.
        </p>
      </div>
    </form>
  );
}
