"use client";

import { Banknote, CalendarCheck, Images, MessageCircle, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/reveal";

export const bookingSteps: { icon: LucideIcon; text: string }[] = [
  { icon: MessageCircle, text: "Send your date and shoot type." },
  { icon: CalendarCheck, text: "Get availability and your deposit amount." },
  { icon: Banknote, text: "An e-Transfer deposit holds the date." },
  { icon: Images, text: "We shoot, and your gallery arrives online." },
];

type HowBookingWorksProps = {
  /** Outer section spacing (e.g. "mt-16 lg:mt-20"). */
  className?: string;
  /** Card surface + border classes, so it can sit on light or dark pages. */
  cardClassName?: string;
};

export function HowBookingWorks({
  className = "",
  cardClassName = "border-ink/12 bg-soft-white/60",
}: HowBookingWorksProps) {
  return (
    <section className={`mx-auto max-w-7xl ${className}`}>
      <Reveal>
        <div className={`rounded-[2px] border p-8 text-ink sm:p-10 ${cardClassName}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8b6444]">How booking works</p>
          <h2 className="mt-3 max-w-xl font-serif text-3xl sm:text-4xl">
            Booked by inquiry, confirmed by deposit.
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bookingSteps.map(({ icon: Icon, text }) => (
              <li key={text} className="flex flex-col gap-2.5">
                <Icon className="size-5 text-[#8b6444]" aria-hidden="true" strokeWidth={1.75} />
                <span className="text-sm leading-6 text-ink/68">{text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm leading-6 text-ink/68">
            <span className="font-medium text-ink">The deposit is non-refundable</span> and holds
            your date, with the balance due by the shoot day. One reschedule is allowed with 7+
            days notice.
          </p>
          <p className="mt-4 text-sm leading-6 text-ink/62">
            Prices are in CAD and include editing and gallery delivery. Travel outside the GTA may
            add a small fee.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
