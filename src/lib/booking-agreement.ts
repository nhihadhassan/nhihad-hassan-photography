import "server-only";
import { cache } from "react";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import {
  agreementDisclaimer as staticDisclaimer,
  agreementIntro as staticIntro,
  agreementSections as staticSections,
  type AgreementSection,
} from "@/data/booking-agreement";

export type BookingAgreementContent = {
  intro: string;
  disclaimer: string;
  sections: AgreementSection[];
};

function sanitizeSections(value: unknown): AgreementSection[] {
  if (!Array.isArray(value)) return [];
  const sections: AgreementSection[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const heading = typeof (item as { heading?: unknown }).heading === "string"
      ? (item as { heading: string }).heading
      : "";
    const rawClauses = (item as { clauses?: unknown }).clauses;
    const clauses = Array.isArray(rawClauses)
      ? rawClauses.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      : [];
    if (heading.trim() || clauses.length) sections.push({ heading, clauses });
  }
  return sections;
}

/**
 * The booking-agreement content: the single edited row if present, otherwise
 * the static defaults from src/data/booking-agreement.ts. Cached per request.
 */
export const getBookingAgreement = cache(async (): Promise<BookingAgreementContent> => {
  const fallback: BookingAgreementContent = {
    intro: staticIntro,
    disclaimer: staticDisclaimer,
    sections: staticSections,
  };

  try {
    const supabase = getPublicSupabaseClient();
    if (!supabase) return fallback;
    const { data } = await supabase
      .from("booking_agreement")
      .select("intro,disclaimer,sections")
      .limit(1)
      .maybeSingle();
    if (!data) return fallback;

    const sections = sanitizeSections(data.sections);
    return {
      intro: typeof data.intro === "string" && data.intro.trim() ? data.intro : staticIntro,
      disclaimer:
        typeof data.disclaimer === "string" && data.disclaimer.trim()
          ? data.disclaimer
          : staticDisclaimer,
      sections: sections.length ? sections : staticSections,
    };
  } catch {
    return fallback;
  }
});
