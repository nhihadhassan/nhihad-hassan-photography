"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { PricingTier } from "@/data/pricing";

/**
 * Pricing card that expands in place to reveal extra detail and a quick
 * inquiry action.
 *
 * Desktop reveals on hover; touch has no hover, so tapping the card toggles
 * it. The reveal grows the card in flow (grid-rows 0fr -> 1fr), so the parent
 * grid must be items-start to avoid stretching neighbouring cards.
 */
export function PricingTierCard({ tier }: { tier: PricingTier }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="group flex flex-col rounded-[2px] border border-ink/12 bg-soft-white/70 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-copper/45 sm:p-7"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-ink/62">{tier.name}</p>
      <p className="mt-3 font-serif text-4xl">{tier.price}</p>
      <p className="mt-1 text-sm text-[#8b6444]">{tier.duration}</p>

      <ul className="mt-5 space-y-2.5 border-t border-ink/12 pt-5">
        {tier.includes.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm leading-6 text-ink/72"
          >
            <Check className="mt-0.5 size-3.5 shrink-0 text-[#8b6444]" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>

      <div
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-ink/12 pt-5">
            {tier.details ? (
              <p className="text-sm leading-6 text-ink/68">{tier.details}</p>
            ) : null}
            <a
              href="/contact#inquiry"
              onClick={(e) => e.stopPropagation()}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#8b6444] transition hover:gap-2.5 hover:text-ink"
            >
              Inquire
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
