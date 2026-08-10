"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";

const inputClass =
  "min-h-11 w-full rounded-md border border-admin-ink/10 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35";

/**
 * Freeform location text field that suggests recently-used locations as you
 * type (from past galleries), so the admin rarely has to type "Toronto" or a
 * repeat venue name out in full. Still just submits plain text — no schema
 * change, no fixed vocabulary.
 */
export function LocationCombobox({
  name,
  defaultValue = "",
  suggestions,
  placeholder = "Toronto",
}: {
  name: string;
  defaultValue?: string;
  suggestions: string[];
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const term = value.trim().toLowerCase();
    const pool = term ? suggestions.filter((s) => s.toLowerCase().includes(term)) : suggestions;
    // Hide the suggestion that exactly matches what's already typed.
    return pool.filter((s) => s.toLowerCase() !== term).slice(0, 6);
  }, [suggestions, value]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <input
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClass}
      />
      {open && matches.length ? (
        <div
          role="listbox"
          aria-label="Suggested locations"
          className="absolute left-0 top-full z-20 mt-1.5 w-full overflow-hidden rounded-md border border-admin-ink/12 bg-white/95 py-1 shadow-[0_12px_30px_rgba(43,35,28,0.10)]"
        >
          {matches.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                setValue(suggestion);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-admin-ink transition hover:bg-admin-surface"
            >
              <MapPin className="size-3.5 shrink-0 text-admin-ink/40" aria-hidden="true" />
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
