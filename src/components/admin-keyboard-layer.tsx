"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Global admin keyboard shortcuts. Cmd/Ctrl+K (palette) lives in the palette
 * itself; this handles the single-key shortcuts and the help overlay. Keys are
 * ignored while typing in a field.
 */
export function AdminKeyboardLayer() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    function isTyping(el: EventTarget | null) {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;

      if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>("[data-table-search]");
        if (search) {
          e.preventDefault();
          search.focus();
        }
      } else if (e.key === "c") {
        e.preventDefault();
        router.push("/admin/bookings/new");
      } else if (e.key === "?") {
        e.preventDefault();
        setShowHelp((v) => !v);
      } else if (e.key === "Escape") {
        setShowHelp(false);
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  if (!showHelp) return null;

  const shortcuts = [
    { keys: "Cmd K", label: "Open the command palette" },
    { keys: "/", label: "Focus the table search" },
    { keys: "c", label: "New booking" },
    { keys: "?", label: "Show this help" },
    { keys: "Esc", label: "Close" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-admin-ink/30" onClick={() => setShowHelp(false)} />
      <div className="relative w-full max-w-sm rounded-2xl border border-admin-line-strong bg-admin-surface p-5 shadow-2xl">
        <h2 className="admin-display text-lg text-admin-ink">Keyboard shortcuts</h2>
        <ul className="mt-4 space-y-2">
          {shortcuts.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-admin-muted">{s.label}</span>
              <kbd className="rounded border border-admin-line px-1.5 py-0.5 font-mono text-xs text-admin-ink">{s.keys}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
