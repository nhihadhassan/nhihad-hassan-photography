"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SelectsContextValue = {
  slug: string;
  selectedIds: string[];
  selectedSet: ReadonlySet<string>;
  count: number;
  isSelected: (photoId: string) => boolean;
  toggle: (photoId: string) => void;
  remove: (photoId: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const SelectsContext = createContext<SelectsContextValue | null>(null);

const STORAGE_PREFIX = "nhp_selects_";

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

function readStored(slug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeStored(slug: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    if (ids.length === 0) {
      window.localStorage.removeItem(storageKey(slug));
    } else {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(ids));
    }
  } catch {
    // ignore quota / privacy mode
  }
}

export function SelectsProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount. This must be in useEffect (not
  // render time) because window.localStorage is not available during SSR.
  // The setState calls here are the canonical pattern for syncing browser-only
  // state into a client component after hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedIds(readStored(slug));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [slug]);

  // Persist on change (only after hydration so we don't clobber storage on initial render)
  useEffect(() => {
    if (!hydrated) return;
    writeStored(slug, selectedIds);
  }, [slug, selectedIds, hydrated]);

  // Sync across tabs
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey(slug)) return;
      setSelectedIds(readStored(slug));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [slug]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggle = useCallback((photoId: string) => {
    setSelectedIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId],
    );
  }, []);

  const remove = useCallback((photoId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== photoId));
  }, []);

  const clear = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<SelectsContextValue>(
    () => ({
      slug,
      selectedIds,
      selectedSet,
      count: selectedIds.length,
      isSelected: (id) => selectedSet.has(id),
      toggle,
      remove,
      clear,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [slug, selectedIds, selectedSet, toggle, remove, clear, drawerOpen, openDrawer, closeDrawer],
  );

  return <SelectsContext.Provider value={value}>{children}</SelectsContext.Provider>;
}

export function useSelects(): SelectsContextValue {
  const ctx = useContext(SelectsContext);
  if (!ctx) {
    // Safe fallback: when there's no provider (e.g. in tests, or when the
    // gallery has no photos), expose a no-op shape so consumers don't crash.
    return {
      slug: "",
      selectedIds: [],
      selectedSet: new Set(),
      count: 0,
      isSelected: () => false,
      toggle: () => undefined,
      remove: () => undefined,
      clear: () => undefined,
      drawerOpen: false,
      openDrawer: () => undefined,
      closeDrawer: () => undefined,
    };
  }
  return ctx;
}
