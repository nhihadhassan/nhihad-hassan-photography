"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export type MobileNavItem = { href: string; label: string };

type MobileNavProps = {
  items: MobileNavItem[];
};

export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Esc closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-overlay"
        className="inline-flex size-10 items-center justify-center rounded-full border border-soft-white/20 bg-ink/35 text-soft-white backdrop-blur transition hover:border-soft-white/40 md:hidden"
      >
        <Menu className="size-4" aria-hidden="true" strokeWidth={1.7} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav-overlay"
            key="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-ink/96 backdrop-blur-md md:hidden"
          >
            <div className="flex h-full flex-col px-6 pb-10 pt-6">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-soft-white/20 bg-ink/35 text-soft-white backdrop-blur transition hover:border-soft-white/40"
                >
                  <X className="size-4" aria-hidden="true" strokeWidth={1.7} />
                </button>
              </div>

              <motion.nav
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.28, ease: "easeOut", delay: 0.04 }}
                className="mt-12 flex flex-1 flex-col justify-center"
              >
                <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="block font-serif text-5xl leading-tight text-soft-white transition hover:text-copper"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-12">
                  <ButtonLink
                    href="/contact"
                    onClick={close}
                    variant="primary"
                    className="w-full justify-center sm:w-auto"
                  >
                    Inquire
                  </ButtonLink>
                </div>
              </motion.nav>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
