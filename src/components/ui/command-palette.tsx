"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  keywords?: string;
  href?: string;
  run?: () => void;
};

/**
 * Global admin command palette. Opens on Cmd/Ctrl+K. Filters a flat item list
 * (nav sections, create actions, and later client/booking records) and runs the
 * selected item's href or callback. Keyboard-first: arrows move, Enter runs,
 * Escape closes.
 */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((current) => {
          if (!current) {
            setQuery("");
            setActive(0);
            requestAnimationFrame(() => inputRef.current?.focus());
          }
          return !current;
        });
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.label} ${i.hint ?? ""} ${i.keywords ?? ""} ${i.group}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, query]);

  function runItem(item: CommandItem | undefined) {
    if (!item) return;
    setOpen(false);
    if (item.run) item.run();
    else if (item.href) router.push(item.href);
  }

  if (!open) return null;

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});
  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActive((a) => Math.min(a + 1, filtered.length - 1));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActive((a) => Math.max(a - 1, 0));
        }
        if (e.key === "Enter") {
          e.preventDefault();
          runItem(filtered[active]);
        }
      }}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-admin-ink/30"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-admin-line-strong bg-admin-surface shadow-2xl motion-safe:animate-[toast-in_140ms_ease-out]">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder="Search or jump to..."
          className="w-full border-b border-admin-line bg-transparent px-4 py-3.5 text-sm text-admin-ink outline-none placeholder:text-admin-muted"
        />
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-admin-muted">No matches.</p>
          ) : (
            Object.entries(groups).map(([group, groupItems]) => (
              <div key={group} className="mb-1">
                <p className="px-4 py-1 text-xs uppercase tracking-wide text-admin-muted">{group}</p>
                {groupItems.map((item) => {
                  flatIndex += 1;
                  const idx = flatIndex;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => runItem(item)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm",
                        idx === active ? "bg-admin-ink text-admin-surface" : "text-admin-ink",
                      )}
                    >
                      <span>{item.label}</span>
                      {item.hint ? (
                        <span className={cn("text-xs", idx === active ? "text-admin-surface/70" : "text-admin-muted")}>
                          {item.hint}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
