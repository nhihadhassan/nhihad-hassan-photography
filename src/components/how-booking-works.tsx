import { Reveal } from "@/components/reveal";

export const bookingSteps = [
  "Send your date, location, and the kind of shoot.",
  "I reply with availability and the deposit amount.",
  "An Interac e-Transfer holds the date. No checkout here.",
  "We shoot, and your gallery arrives online to share.",
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
            {bookingSteps.map((step, index) => (
              <li key={step} className="flex flex-col gap-2.5">
                <span className="font-serif text-2xl text-[#8b6444]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-6 text-ink/68">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm leading-6 text-ink/62">
            Prices are in Canadian dollars and cover the shoot, editing, and gallery delivery.
            Travel beyond the Greater Toronto Area may add a small fee, confirmed before you book.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
