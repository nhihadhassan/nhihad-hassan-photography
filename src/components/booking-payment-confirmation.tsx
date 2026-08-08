"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type TipChoice = "none" | "five" | "ten" | "custom";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function BookingPaymentConfirmation({
  deposit,
  transferEmail,
}: {
  deposit: number;
  transferEmail: string;
}) {
  const [tipChoice, setTipChoice] = useState<TipChoice>("none");
  const [customTip, setCustomTip] = useState("");
  const [copied, setCopied] = useState(false);

  const tip = tipChoice === "five"
    ? deposit * 0.05
    : tipChoice === "ten"
      ? deposit * 0.1
      : tipChoice === "custom"
        ? Math.max(0, Number(customTip) || 0)
        : 0;
  const total = deposit + tip;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(transferEmail);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // The address remains visible and selectable if clipboard access is blocked.
    }
  }

  return (
    <div className="grid gap-6">
      <section className="bg-[#f8f3eb] p-5 sm:p-8" aria-labelledby="tip-heading">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8b6444]">Optional tip</p>
        <h2 id="tip-heading" className="mt-3 font-serif text-4xl leading-none text-ink">No tip is expected.</h2>
        <fieldset className="mt-6">
          <legend className="sr-only">Choose an optional tip</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TipOption label="No tip" value="none" selected={tipChoice} onSelect={setTipChoice} />
            <TipOption label="5%" value="five" selected={tipChoice} onSelect={setTipChoice} />
            <TipOption label="10%" value="ten" selected={tipChoice} onSelect={setTipChoice} />
            <TipOption label="Custom" value="custom" selected={tipChoice} onSelect={setTipChoice} />
          </div>
          {tipChoice === "custom" ? (
            <label className="mt-4 grid max-w-xs gap-2">
              <span className="text-sm font-medium text-ink">Custom tip amount</span>
              <span className="flex min-h-12 items-center border border-ink/12 bg-[#fbf8f1] px-3 focus-within:border-copper">
                <span className="text-ink/48">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={customTip}
                  onChange={(event) => setCustomTip(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-2 text-base text-ink outline-none"
                  aria-label="Custom tip amount in Canadian dollars"
                />
              </span>
            </label>
          ) : null}
        </fieldset>
      </section>

      <section className="bg-[#f8f3eb] p-5 sm:p-8" aria-labelledby="transfer-heading">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8b6444]">Interac e-Transfer</p>
        <h2 id="transfer-heading" className="mt-3 font-serif text-4xl leading-none text-ink">Payment instructions</h2>
        <div className="mt-5 border-l-2 border-copper bg-[#efe6d8] px-4 py-4 text-sm leading-6 text-ink/72">
          <strong className="font-medium text-ink">Please wait for my confirmation email before sending payment.</strong>{" "}
          Your requested date is not held until availability is confirmed and the deposit is received.
        </div>
        <ol className="mt-6 grid gap-5 text-sm leading-6 text-ink/68">
          <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="grid size-8 place-items-center rounded-full border border-ink/15 font-serif text-lg text-ink">1</span><p className="pt-1">Look for a personal confirmation email from Nhihad.</p></li>
          <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="grid size-8 place-items-center rounded-full border border-ink/15 font-serif text-lg text-ink">2</span><div className="pt-1"><p>Send the deposit to:</p><div className="mt-2 flex flex-wrap items-center gap-3"><span className="break-all font-medium text-ink">{transferEmail}</span><button type="button" onClick={copyEmail} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-xs font-medium text-ink transition hover:bg-ink hover:text-soft-white" aria-live="polite">{copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}{copied ? "Copied" : "Copy email"}</button></div></div></li>
          <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="grid size-8 place-items-center rounded-full border border-ink/15 font-serif text-lg text-ink">3</span><p className="pt-1">Include your name and requested shoot date in the transfer message so I can match it to your inquiry.</p></li>
        </ol>

        <dl className="mt-8 border-t border-ink/10 pt-6 text-sm">
          <div className="flex items-center justify-between gap-4 py-2"><dt className="text-ink/58">Deposit</dt><dd className="font-medium text-ink">{money.format(deposit)}</dd></div>
          <div className="flex items-center justify-between gap-4 py-2"><dt className="text-ink/58">Optional tip</dt><dd className="font-medium text-ink">{money.format(tip)}</dd></div>
          <div className="mt-2 flex items-end justify-between gap-4 border-t border-ink/10 pt-5"><dt><span className="block font-medium text-ink">E-transfer total</span><span className="mt-1 block text-xs text-ink/45">Only after your date is confirmed</span></dt><dd className="font-serif text-3xl text-ink">{money.format(total)}</dd></div>
        </dl>
      </section>
    </div>
  );
}

function TipOption({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: TipChoice;
  selected: TipChoice;
  onSelect: (value: TipChoice) => void;
}) {
  const active = selected === value;
  return (
    <label
      className={`min-h-12 border px-4 text-sm font-medium transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-copper ${active ? "border-ink bg-ink text-soft-white" : "border-ink/12 bg-[#fbf8f1] text-ink hover:border-ink/35"}`}
    >
      <input
        type="radio"
        name="tip"
        value={value}
        checked={active}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span className="grid min-h-12 cursor-pointer place-items-center">{label}</span>
    </label>
  );
}
