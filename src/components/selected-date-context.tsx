"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Holds the "currently selected event date" on the /contact page so that
 * the AvailabilityCalendar and the ContactForm stay in sync.
 *
 * Value is a "YYYY-MM-DD" string (the native HTML date input format) or
 * null when nothing is selected. The hook is safe to call outside the
 * provider — it just returns a no-op pair — so components stay portable.
 */

type SelectedDateContextValue = {
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
};

const SelectedDateContext = createContext<SelectedDateContextValue | null>(null);

export function SelectedDateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </SelectedDateContext.Provider>
  );
}

export function useSelectedDate(): SelectedDateContextValue {
  const ctx = useContext(SelectedDateContext);
  if (!ctx) {
    return { selectedDate: null, setSelectedDate: () => {} };
  }
  return ctx;
}
