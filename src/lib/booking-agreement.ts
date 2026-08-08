import "server-only";
import { cache } from "react";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import {
  agreementDisclaimer as staticDisclaimer,
  agreementIntro as staticIntro,
  agreementSections as staticSections,
  type AgreementSection,
} from "@/data/booking-agreement";
import {
  applyWeddingAgreement,
  resolveAgreementTemplateId,
  type AgreementTemplateId,
} from "@/data/wedding-agreement";

type TemplateRow = { intro: string; sections: unknown; supports_second_signer: boolean };

/**
 * Reads a named row from contract_templates (the admin's template editor).
 * Public/anon-safe: RLS on that table only exposes non-archived rows. Not
 * cached across requests — the editor's autosave should be visible on the
 * next page load without a redeploy.
 */
async function getNamedTemplate(slug: string): Promise<TemplateRow | null> {
  try {
    const supabase = getPublicSupabaseClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("contract_templates")
      .select("intro,sections,supports_second_signer")
      .eq("slug", slug)
      .maybeSingle();
    return (data as TemplateRow | null) ?? null;
  } catch {
    return null;
  }
}

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
const getBaseBookingAgreement = cache(async (): Promise<BookingAgreementContent> => {
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

export const getBookingAgreement = cache(
  async (
    templateId: AgreementTemplateId | string = "photography",
    clientName = "",
    partnerName = "",
    secondSignerName = "",
    omitRehostingFee = false,
  ): Promise<BookingAgreementContent> => {
    // A template created/edited in the admin templates editor, matched by
    // slug, wins outright — no wedding word-substitution layered on top,
    // since that content is directly editable now. Falls back to the legacy
    // single-row override + code-level wedding transform for any slug that
    // doesn't have its own row (keeps every agreement created before the
    // templates editor existed rendering exactly as before).
    const named = await getNamedTemplate(String(templateId));
    const templated = named
      ? { intro: named.intro, disclaimer: staticDisclaimer, sections: sanitizeSections(named.sections) }
      : await (async () => {
          const content = await getBaseBookingAgreement();
          return resolveAgreementTemplateId(templateId) === "wedding"
            ? applyWeddingAgreement(content, { clientName, partnerName, secondSignerName })
            : content;
        })();

    if (!omitRehostingFee) return templated;
    return {
      ...templated,
      sections: templated.sections.map((section) => ({
        ...section,
        clauses: section.clauses.map((clause) => clause.replace(
          " Restoring an expired gallery will incur a rehosting fee of {{rehostingFee}}.",
          "",
        )),
      })),
    };
  },
);
