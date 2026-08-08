/**
 * Pure `{{token}}` / “quoted phrase” parsing shared by the read-only
 * AgreementDocument renderer and the editable agreement-builder document, so
 * both walk contract text identically instead of maintaining two regexes.
 */
export type RichTextToken =
  | { type: "text"; value: string }
  | { type: "variable"; key: string }
  | { type: "quoted"; value: string };

const TOKEN_PATTERN = /(\{\{[A-Za-z]+\}\}|“[^”]+”)/g;

export function parseRichText(text: string): RichTextToken[] {
  return text
    .split(TOKEN_PATTERN)
    .filter(Boolean)
    .map((part): RichTextToken => {
      const variable = part.match(/^\{\{([A-Za-z]+)\}\}$/)?.[1];
      if (variable) return { type: "variable", key: variable };
      if (/^“[^”]+”$/.test(part)) return { type: "quoted", value: part };
      return { type: "text", value: part };
    });
}

const CLAUSE_LEAD_PATTERN = /^(\d+\.\d+\s+[^.]+\.)(?:\s+|$)([\s\S]*)$/;

/** Splits "1.1 Services. The Client..." into its bold numbered lead and the rest. */
export function splitClauseLead(clause: string): { lead: string | null; rest: string } {
  const match = clause.match(CLAUSE_LEAD_PATTERN);
  if (!match) return { lead: null, rest: clause };
  return { lead: match[1], rest: match[2] ?? "" };
}

export const AGREEMENT_INTRO_LEAD = "THIS AGREEMENT";
