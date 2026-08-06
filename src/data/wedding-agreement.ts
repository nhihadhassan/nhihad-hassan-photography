import type { AgreementSection } from "@/data/booking-agreement";

export type AgreementContent = {
  intro: string;
  disclaimer: string;
  sections: AgreementSection[];
};

export type AgreementTemplateId = "photography" | "wedding";

export const agreementTemplates: readonly {
  id: AgreementTemplateId;
  label: string;
  description: string;
}[] = [
  {
    id: "photography",
    label: "Photography Services Agreement",
    description: "Portraits, events, nightlife, and other general photography.",
  },
  {
    id: "wedding",
    label: "Wedding Photography Services Agreement",
    description: "Wedding coverage with partner, exclusivity, and meal terms.",
  },
];

export function resolveAgreementTemplateId(value?: string | null): AgreementTemplateId {
  return value === "wedding" ? "wedding" : "photography";
}

export function isWeddingAgreementType(shootType?: string | null): boolean {
  return /\bweddings?\b/i.test(shootType ?? "");
}

function replaceClauseNumber(clause: string, from: string, to: string): string {
  return clause.startsWith(from) ? `${to}${clause.slice(from.length)}` : clause;
}

/** Add wedding-only terms without duplicating the shared photography agreement. */
export function applyWeddingAgreement(
  content: AgreementContent,
  context: { clientName?: string | null; partnerName?: string | null } = {},
): AgreementContent {
  const clientName = context.clientName?.trim();
  const partnerName = context.partnerName?.trim();
  const couple = clientName
    ? partnerName
      ? `${clientName} and ${partnerName}`
      : `${clientName} and the Client's partner`
    : partnerName
      ? `the Client and ${partnerName}`
      : "the Client and the Client's partner";

  const sections = content.sections.map((section): AgreementSection => {
    if (section.heading.startsWith("1.")) {
      return {
        ...section,
        clauses: section.clauses.map((clause, index) => {
          if (index === 0) {
            return `1.1 Services. The Client engages the Photographer to provide the photography services described in the Agreement details in connection with the wedding of ${couple} (the “Wedding”). The edited photographs and related deliverables selected and delivered by the Photographer are the “Work Product.” “Images” means still or moving photographic material created under this Agreement and captured, recorded, stored, or delivered in any analogue or digital medium.`;
          }
          if (index === 1) {
            return "1.2 Exclusivity. Unless agreed otherwise in writing, the Photographer will be the sole professional photographer responsible for coverage of the Wedding. The Client will help prevent guests or other vendors from materially interfering with the services.";
          }
          return clause;
        }),
      };
    }

    if (section.heading.startsWith("3.")) {
      const [access, travel, cooperation, authorizedUse, ...rest] = section.clauses;
      return {
        ...section,
        clauses: [
          access?.replace("ensure attendees", "ensure Wedding attendees") ?? "",
          travel ?? "",
          "3.3 Meals. When scheduled coverage exceeds six consecutive hours or spans a customary meal period, the Client will provide a meal for the Photographer and Photography staff or reimburse reasonable meal expenses approved by the Client and shown on an invoice.",
          cooperation ? replaceClauseNumber(cooperation, "3.3", "3.4") : "",
          authorizedUse ? replaceClauseNumber(authorizedUse, "3.4", "3.5") : "",
          ...rest,
        ].filter(Boolean),
      };
    }

    if (section.heading.startsWith("7.")) {
      return {
        ...section,
        clauses: section.clauses.map((clause) =>
          clause
            .replace("7.3 Client materials.", "7.3 Wedding materials.")
            .replace("Client-supplied materials", "Client-supplied Wedding materials"),
        ),
      };
    }

    return { ...section, clauses: [...section.clauses] };
  });

  return {
    ...content,
    intro: `THIS AGREEMENT is made as of the date the Client signs it (the “Effective Date”) between the client identified below (the “Client”) and Nhihad Hassan Photography (the “Photographer”) in connection with the Wedding described below.`,
    sections,
  };
}
