"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Download, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

type PackageOption = {
  id: string;
  name: string;
  description: string[];
  price: number;
};

type AddOn = {
  id: string;
  name: string;
  detail: string;
  price: number;
  initialQuantity: number;
};

const packages: PackageOption[] = [
  {
    id: "full-story",
    name: "The Full Story",
    description: [
      "Up to 8 hours of event coverage",
      "350+ professionally edited images",
      "Private high-resolution online gallery",
      "72-hour highlight preview",
    ],
    price: 2400,
  },
  {
    id: "signature",
    name: "The Signature",
    description: [
      "Up to 5 hours of event coverage",
      "200+ professionally edited images",
      "Private high-resolution online gallery",
    ],
    price: 1650,
  },
  {
    id: "essential",
    name: "The Essential",
    description: [
      "Up to 3 hours of event coverage",
      "100+ professionally edited images",
      "Private high-resolution online gallery",
    ],
    price: 1050,
  },
];

const addOns: AddOn[] = [
  {
    id: "coverage",
    name: "Additional coverage",
    detail: "Per hour",
    price: 225,
    initialQuantity: 1,
  },
  {
    id: "rush",
    name: "Rush gallery delivery",
    detail: "Complete gallery within 5 business days",
    price: 350,
    initialQuantity: 1,
  },
  {
    id: "reel",
    name: "Social highlight reel",
    detail: "One vertical recap, edited for social",
    price: 275,
    initialQuantity: 1,
  },
];

const CONSULTATION_PRICE = 150;
const TAX_RATE = 0.13;

function money(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatQuoteNumber(token: string) {
  const clean = token.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  return `NHP-Q-${clean || "PREVIEW"}`;
}

export function QuotePreview({ token }: { token: string }) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(addOns.map((item) => [item.id, item.initialQuantity])),
  );
  const [accepted, setAccepted] = useState(false);
  const [showPackageError, setShowPackageError] = useState(false);

  const totals = useMemo(() => {
    const packagePrice = packages.find((item) => item.id === selectedPackage)?.price ?? 0;
    const addOnTotal = addOns.reduce((sum, item) => {
      if (!selectedAddOns[item.id]) return sum;
      return sum + item.price * (quantities[item.id] ?? item.initialQuantity);
    }, 0);
    const subtotal = CONSULTATION_PRICE + packagePrice + addOnTotal;
    const tax = subtotal * TAX_RATE;
    return { subtotal, tax, total: subtotal + tax };
  }, [quantities, selectedAddOns, selectedPackage]);

  function selectPackage(id: string) {
    setSelectedPackage(id);
    setShowPackageError(false);
    setAccepted(false);
  }

  function toggleAddOn(id: string) {
    setSelectedAddOns((current) => ({ ...current, [id]: !current[id] }));
    setAccepted(false);
  }

  function updateQuantity(id: string, delta: number) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(1, Math.min(12, (current[id] ?? 1) + delta)),
    }));
    setAccepted(false);
  }

  function acceptQuote() {
    if (!selectedPackage) {
      setShowPackageError(true);
      document.getElementById("package-options")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setAccepted(true);
  }

  return (
    <main className="min-h-dvh bg-[#100e0c] text-soft-white print:bg-[#f7f3ed] print:text-ink">
      <section className="relative isolate min-h-[34rem] overflow-hidden sm:min-h-[38rem] print:hidden">
        <Image
          src="/portfolio/moove-dj-floor.webp"
          alt="A packed Toronto dance floor photographed by Nhihad Hassan"
          fill
          priority
          className="object-cover object-[48%_48%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,.4)_0%,rgba(8,8,8,.14)_36%,rgba(8,8,8,.88)_100%)]" />

        <div className="relative mx-auto flex min-h-[34rem] max-w-6xl flex-col px-5 py-8 sm:min-h-[38rem] sm:px-10 sm:py-10">
          <div className="flex items-center justify-between gap-5">
            <Link
              href="/"
              className="font-display text-[0.7rem] font-bold uppercase tracking-[0.24em] text-soft-white/90 transition hover:text-soft-white"
            >
              Nhihad Hassan Photography
            </Link>
            <span className="text-[0.65rem] uppercase tracking-[0.22em] text-soft-white/65">Toronto, Canada</span>
          </div>

          <div className="mt-auto max-w-3xl pb-20 sm:pb-24">
            <p className="mb-4 text-xs uppercase tracking-[0.24em] text-[#d9b28f]">Your photography proposal</p>
            <h1 className="font-serif text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.82] tracking-[-0.04em] text-balance">
              Hi Jordan,
              <span className="mt-3 block text-[0.48em] leading-[1.02] tracking-[-0.025em] text-soft-white/88">
                Let&apos;s make this night unforgettable.
              </span>
            </h1>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-8 print:max-w-none print:px-0 print:pb-0">
        <section className="-mt-16 border border-soft-white/12 bg-[#171411] px-5 py-7 shadow-[0_28px_90px_rgba(8,8,8,.28)] sm:-mt-20 sm:px-10 sm:py-9 print:mt-0 print:border-0 print:bg-[#f7f3ed] print:p-8 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-soft-white/12 pb-8 print:border-ink/15">
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-3xl sm:text-4xl">Quote</h2>
              <span className="rounded-full bg-[#b98257]/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#d9b28f] print:border print:border-ink/15 print:bg-transparent print:text-ink">
                Open
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-soft-white/58 transition hover:text-soft-white print:hidden"
            >
              <Download className="size-4" aria-hidden="true" />
              Print or save PDF
            </button>
          </div>

          <dl className="grid gap-7 pt-7 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-soft-white/42 print:text-ink/50">From</dt>
              <dd className="mt-2 text-soft-white/90 print:text-ink">Nhihad Hassan Photography</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-soft-white/42 print:text-ink/50">Prepared for</dt>
              <dd className="mt-2 text-soft-white/90 print:text-ink">Jordan Williams</dd>
            </div>
            <div className="sm:text-right">
              <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-soft-white/42 print:text-ink/50">Quote details</dt>
              <dd className="mt-2 text-soft-white/90 print:text-ink">{formatQuoteNumber(token)}</dd>
              <dd className="mt-1 text-xs text-soft-white/48 print:text-ink/55">Valid for 14 days</dd>
            </div>
          </dl>
        </section>

        <section className="mt-4 border border-soft-white/12 bg-[#171411] px-5 py-9 sm:px-10 sm:py-12 print:mt-0 print:border-0 print:border-t print:border-ink/15 print:bg-[#f7f3ed] print:p-8">
          <div className="flex items-end justify-between gap-4 border-b border-soft-white/12 pb-5 print:border-ink/15">
            <h2 className="font-serif text-3xl sm:text-4xl">Your coverage</h2>
            <span className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-soft-white/38 sm:block print:text-ink/45">Amount</span>
          </div>

          <div className="grid gap-3 border-b border-soft-white/10 py-6 sm:grid-cols-[1fr_auto] sm:items-center print:border-ink/10">
            <div>
              <p className="text-sm font-medium">Creative planning session</p>
              <p className="mt-1 text-sm leading-6 text-soft-white/48 print:text-ink/55">A focused call to shape the timeline, visual direction, and must-have moments.</p>
            </div>
            <p className="tabular-nums text-sm text-soft-white/80 print:text-ink">{money(CONSULTATION_PRICE)}</p>
          </div>

          <div id="package-options" className="scroll-mt-8 pt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-serif text-2xl">Choose your collection</h3>
                <p className="mt-1 text-sm text-soft-white/48 print:text-ink/55">Select one option to build your quote.</p>
              </div>
              {showPackageError ? (
                <p role="alert" className="text-xs font-medium text-[#e7b58c] print:text-ink">Please choose a collection.</p>
              ) : null}
            </div>

            <div className="divide-y divide-soft-white/10 border-y border-soft-white/10 print:divide-ink/10 print:border-ink/10">
              {packages.map((item) => {
                const selected = selectedPackage === item.id;
                return (
                  <label
                    key={item.id}
                    className={`grid cursor-pointer gap-5 py-6 transition sm:grid-cols-[1fr_auto] sm:items-start ${selected ? "text-soft-white" : "text-soft-white/72 hover:text-soft-white"} print:text-ink`}
                  >
                    <span className="flex gap-4">
                      <input
                        type="radio"
                        name="package"
                        value={item.id}
                        checked={selected}
                        onChange={() => selectPackage(item.id)}
                        className="mt-1 size-5 shrink-0 appearance-none rounded-full border border-soft-white/35 checked:border-[6px] checked:border-[#b98257] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b98257] print:border-ink/40"
                      />
                      <span>
                        <span className="block font-medium">{item.name}</span>
                        <span className="mt-2 block space-y-1 text-sm leading-5 text-soft-white/46 print:text-ink/55">
                          {item.description.map((line) => <span key={line} className="block">{line}</span>)}
                        </span>
                      </span>
                    </span>
                    <span className="tabular-nums pl-9 text-sm sm:pl-0">{money(item.price)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-12">
            <h3 className="font-serif text-2xl">Make it yours</h3>
            <p className="mt-1 text-sm text-soft-white/48 print:text-ink/55">Optional additions can be changed before you accept.</p>

            <div className="mt-5 divide-y divide-soft-white/10 border-y border-soft-white/10 print:divide-ink/10 print:border-ink/10">
              {addOns.map((item) => {
                const checked = Boolean(selectedAddOns[item.id]);
                const quantity = quantities[item.id] ?? item.initialQuantity;
                return (
                  <div key={item.id} className="grid gap-5 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <label className="flex cursor-pointer items-start gap-4">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddOn(item.id)}
                        className="peer sr-only"
                      />
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center border border-soft-white/30 text-transparent transition peer-checked:border-[#b98257] peer-checked:bg-[#b98257] peer-checked:text-[#100e0c] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[#b98257] print:border-ink/40">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm text-soft-white/88 print:text-ink">{item.name}</span>
                        <span className="mt-1 block text-xs text-soft-white/42 print:text-ink/50">{item.detail}</span>
                      </span>
                    </label>

                    <div className={`flex items-center border border-soft-white/12 transition print:border-ink/15 ${checked ? "opacity-100" : "pointer-events-none opacity-30"}`}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={!checked || quantity <= 1}
                        className="grid size-9 place-items-center transition hover:bg-soft-white/8 disabled:cursor-not-allowed"
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <output className="tabular-nums grid h-9 min-w-9 place-items-center border-x border-soft-white/12 text-xs print:border-ink/15" aria-live="polite">{quantity}</output>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={!checked || quantity >= 12}
                        className="grid size-9 place-items-center transition hover:bg-soft-white/8 disabled:cursor-not-allowed"
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="tabular-nums text-sm text-soft-white/72 sm:min-w-24 sm:text-right print:text-ink">
                      {money(item.price * quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 ml-auto max-w-sm border-t border-soft-white/12 pt-5 print:border-ink/15">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-8 text-soft-white/52 print:text-ink/55">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{money(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-8 text-soft-white/52 print:text-ink/55">
                <dt>HST (13%)</dt>
                <dd className="tabular-nums">{money(totals.tax)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-8 border-t border-soft-white/12 pt-5 print:border-ink/15">
                <dt className="font-medium">Total</dt>
                <dd className="tabular-nums font-serif text-3xl">{money(totals.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-right text-[0.68rem] uppercase tracking-[0.16em] text-soft-white/35 print:text-ink/45">All amounts in Canadian dollars</p>
          </div>
        </section>

        <div className="mt-4 print:hidden">
          {accepted ? (
            <div className="flex min-h-20 items-center justify-center gap-3 border border-[#b98257]/35 bg-[#b98257]/10 px-6 text-center text-sm text-[#e5c3a5]" role="status">
              <Check className="size-5 shrink-0" aria-hidden="true" />
              Quote selected. Acceptance and signature will be connected when the quote system is built.
            </div>
          ) : (
            <button
              type="button"
              onClick={acceptQuote}
              className="min-h-20 w-full bg-[#b98257] px-6 font-display text-xs font-bold uppercase tracking-[0.22em] text-[#100e0c] transition duration-300 ease-out hover:bg-[#d09a70]"
            >
              Accept quote
            </button>
          )}
        </div>

        <footer className="py-10 text-center text-[0.65rem] uppercase tracking-[0.2em] text-soft-white/28 print:hidden">
          Nhihad Hassan Photography · Toronto
        </footer>
      </div>
    </main>
  );
}
