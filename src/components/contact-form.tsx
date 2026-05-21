"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";

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

const inputClass =
  "min-h-12 rounded-[2px] border border-ink/12 bg-[#fbf8f1] px-3 text-base text-ink outline-none transition placeholder:text-ink/34 focus:border-copper";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Name</span>
          <input className={inputClass} name="name" autoComplete="name" />
          <FieldError errors={state.fieldErrors?.name} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Email</span>
          <input className={inputClass} name="email" type="email" autoComplete="email" />
          <FieldError errors={state.fieldErrors?.email} />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Phone</span>
          <input className={inputClass} name="phone" type="tel" autoComplete="tel" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Event type</span>
          <input className={inputClass} name="eventType" placeholder="Nightlife, wedding, portrait, birthday" />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Event date</span>
          <input className={inputClass} name="eventDate" type="date" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Location</span>
          <input className={inputClass} name="location" placeholder="Toronto, venue, or neighbourhood" />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Budget</span>
          <input className={inputClass} name="budget" placeholder="Optional" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">How did you hear about us?</span>
          <input className={inputClass} name="referralSource" placeholder="Instagram, referral, search" />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-ink">Message</span>
        <textarea
          className="min-h-36 rounded-[2px] border border-ink/12 bg-[#fbf8f1] px-3 py-3 text-base text-ink outline-none transition placeholder:text-ink/34 focus:border-copper"
          name="message"
          placeholder="Tell me about the event, timing, guest count, mood, and what you want the photos to feel like."
        />
        <FieldError errors={state.fieldErrors?.message} />
      </label>
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
      <Button type="submit" variant="light" disabled={pending} className="justify-self-start">
        <Send className="size-4" aria-hidden="true" />
        {pending ? "Sending" : "Send inquiry"}
      </Button>
    </form>
  );
}

