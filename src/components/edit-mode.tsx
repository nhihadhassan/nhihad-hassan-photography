"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

type EditModeContextValue = {
  isAdmin: boolean;
  editMode: boolean;
};

const EditModeContext = createContext<EditModeContextValue>({ isAdmin: false, editMode: false });

export function useEditMode() {
  return useContext(EditModeContext);
}

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const pathname = usePathname();

  // Detect admin status client-side so public pages stay statically rendered.
  useEffect(() => {
    let active = true;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => {
        if (active) setIsAdmin(Boolean(d.isAdmin));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Never show the editor chrome inside the admin area itself.
  const onAdmin = pathname?.startsWith("/admin") ?? false;
  const showChrome = isAdmin && !onAdmin;

  return (
    <EditModeContext.Provider value={{ isAdmin: showChrome, editMode: showChrome && editMode }}>
      {children}
      {showChrome ? (
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className={cn(
            "fixed bottom-5 right-5 z-[200] inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition",
            editMode
              ? "bg-copper text-ink hover:bg-copper/90"
              : "bg-ink text-soft-white hover:bg-ink/90",
          )}
          title={editMode ? "Exit edit mode" : "Edit this site"}
        >
          {editMode ? <X className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
          {editMode ? "Done editing" : "Edit site"}
        </button>
      ) : null}
    </EditModeContext.Provider>
  );
}

/**
 * Small pencil affordance shown only to a logged-in admin with edit mode on.
 * Deep-links to the relevant admin editor. Place inside a `relative` container
 * and pass positioning via className (e.g. "absolute right-2 top-2").
 */
export function EditPencil({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const { editMode } = useEditMode();
  if (!editMode) return null;
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "z-[120] inline-flex items-center gap-1.5 rounded-full border border-copper bg-ink/85 px-2.5 py-1 text-xs font-medium text-copper shadow-md backdrop-blur transition hover:bg-copper hover:text-ink",
        className,
      )}
    >
      <Pencil className="size-3" aria-hidden="true" />
      {label}
    </Link>
  );
}

/** Marker used to confirm a region is editable (optional visual aid). */
export function EditDot() {
  const { editMode } = useEditMode();
  if (!editMode) return null;
  return (
    <span className="ml-2 inline-flex items-center text-copper" aria-hidden="true">
      <Check className="size-3" />
    </span>
  );
}
