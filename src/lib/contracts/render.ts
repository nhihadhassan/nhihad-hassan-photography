/**
 * Merge template renderer.
 *
 * Deliberately not Handlebars. A contract renderer needs to fail loudly on an
 * unknown or missing token rather than emit an empty string into a legal
 * document, and it needs no runtime compilation. This is about 200 lines and
 * has no dependencies.
 *
 * Syntax
 *   {{fee.total | money}}          value with a formatter
 *   {{#if licence.is_commercial}}  block, optional {{else}}
 *   {{#unless business.has_insurance}}
 *   {{#each clients}}{{name}}{{/each}}
 */

import { FIELD_BY_KEY, type FieldValues, type Signer } from "./schema";

type Node =
  | { kind: "text"; value: string }
  | { kind: "var"; path: string; filters: string[] }
  | { kind: "cond"; path: string; negate: boolean; body: Node[]; alt: Node[] }
  | { kind: "each"; path: string; body: Node[] };

const TAG =
  /\{\{\s*(?:(#if|#unless|#each|\/if|\/unless|\/each|else)(?:\s+([\w.]+))?|([\w.]+)((?:\s*\|\s*\w+)*))\s*\}\}/g;

export class TemplateError extends Error {}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

export function parse(source: string): Node[] {
  const root: Node[] = [];
  const stack: { node: Node; target: "body" | "alt" }[] = [];
  let cursor = 0;

  const current = (): Node[] => {
    if (stack.length === 0) return root;
    const top = stack[stack.length - 1];
    const n = top.node;
    if (n.kind === "cond") return top.target === "alt" ? n.alt : n.body;
    if (n.kind === "each") return n.body;
    throw new TemplateError("Malformed block stack");
  };

  const pushText = (value: string): void => {
    if (value.length > 0) current().push({ kind: "text", value });
  };

  TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG.exec(source)) !== null) {
    pushText(source.slice(cursor, m.index));
    cursor = m.index + m[0].length;

    const [, block, blockPath, varPath, filterPart] = m;

    if (block === undefined) {
      const filters = (filterPart ?? "")
        .split("|")
        .map((f) => f.trim())
        .filter(Boolean);
      current().push({ kind: "var", path: varPath, filters });
      continue;
    }

    switch (block) {
      case "#if":
      case "#unless": {
        if (!blockPath) throw new TemplateError(`${block} requires a field key`);
        const node: Node = { kind: "cond", path: blockPath, negate: block === "#unless", body: [], alt: [] };
        current().push(node);
        stack.push({ node, target: "body" });
        break;
      }
      case "#each": {
        if (!blockPath) throw new TemplateError("#each requires a field key");
        const node: Node = { kind: "each", path: blockPath, body: [] };
        current().push(node);
        stack.push({ node, target: "body" });
        break;
      }
      case "else": {
        const top = stack[stack.length - 1];
        if (!top || top.node.kind !== "cond") throw new TemplateError("{{else}} outside of a conditional");
        top.target = "alt";
        break;
      }
      case "/if":
      case "/unless": {
        const top = stack.pop();
        if (!top || top.node.kind !== "cond") throw new TemplateError(`Unbalanced ${block}`);
        break;
      }
      case "/each": {
        const top = stack.pop();
        if (!top || top.node.kind !== "each") throw new TemplateError("Unbalanced /each");
        break;
      }
    }
  }

  pushText(source.slice(cursor));
  if (stack.length > 0) throw new TemplateError("Template has an unclosed block");
  return root;
}

/** Every field key a template touches. Persist this as contract_templates.field_keys. */
export function extractKeys(source: string): string[] {
  const keys = new Set<string>();
  const walk = (nodes: Node[]): void => {
    for (const n of nodes) {
      if (n.kind === "var" || n.kind === "cond" || n.kind === "each") keys.add(n.path);
      if (n.kind === "cond") {
        walk(n.body);
        walk(n.alt);
      }
      if (n.kind === "each") walk(n.body);
    }
  };
  walk(parse(source));
  // Loop locals such as {{name}} inside {{#each clients}} are not registry keys.
  return [...keys].filter((k) => FIELD_BY_KEY.has(k)).sort();
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const TZ = "America/Toronto";

const FILTERS: Record<string, (v: unknown) => string> = {
  money: (v) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(v)),
  money_cad: (v) =>
    `${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(v))} CAD`,
  date: (v) =>
    new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: TZ }).format(toDate(v)),
  date_full: (v) =>
    new Intl.DateTimeFormat("en-CA", { dateStyle: "full", timeZone: TZ }).format(toDate(v)),
  time: (v) => String(v),
  number: (v) => new Intl.NumberFormat("en-CA").format(Number(v)),
  percent: (v) => `${Number(v)}%`,
  upper: (v) => String(v).toUpperCase(),
  plural_s: (v) => (Number(v) === 1 ? "" : "s"),
};

function toDate(v: unknown): Date {
  // Bare YYYY-MM-DD parses as UTC midnight, which renders as the previous day
  // in Toronto. Anchor it at noon so the calendar date is always correct.
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T12:00:00`);
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) throw new TemplateError(`Not a date: ${String(v)}`);
  return d;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export interface RenderResult {
  readonly text: string;
  /** Keys that resolved to nothing. Non empty means do not send. */
  readonly missing: readonly string[];
}

export interface RenderOptions {
  /** Throw on the first missing value instead of collecting. Use when issuing. */
  readonly strict?: boolean;
  /** Placeholder for missing values in preview mode. */
  readonly placeholder?: string;
}

export function render(
  source: string,
  values: FieldValues,
  options: RenderOptions = {},
): RenderResult {
  const { strict = false, placeholder = "[ MISSING ]" } = options;
  const missing = new Set<string>();

  const resolve = (path: string, scope: Record<string, unknown> | null): unknown => {
    if (scope && path in scope) return scope[path];
    return values[path];
  };

  const truthy = (v: unknown): boolean => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.trim() !== "";
    if (typeof v === "number") return v !== 0;
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined;
  };

  const emit = (nodes: Node[], scope: Record<string, unknown> | null): string => {
    let out = "";

    for (const node of nodes) {
      switch (node.kind) {
        case "text":
          out += node.value;
          break;

        case "var": {
          if (scope === null && !FIELD_BY_KEY.has(node.path)) {
            throw new TemplateError(
              `Unknown field "${node.path}". Add it to FIELDS in schema.ts or fix the template.`,
            );
          }
          const raw = resolve(node.path, scope);
          if (raw === null || raw === undefined || raw === "") {
            if (strict) throw new TemplateError(`Missing value for "${node.path}"`);
            missing.add(node.path);
            out += placeholder;
            break;
          }
          let text = String(raw);
          for (const f of node.filters) {
            const fn = FILTERS[f];
            if (!fn) throw new TemplateError(`Unknown filter "${f}" on "${node.path}"`);
            text = fn(raw);
          }
          out += text;
          break;
        }

        case "cond": {
          const v = resolve(node.path, scope);
          const on = node.negate ? !truthy(v) : truthy(v);
          out += emit(on ? node.body : node.alt, scope);
          break;
        }

        case "each": {
          const items = resolve(node.path, scope);
          if (!Array.isArray(items)) {
            if (strict) throw new TemplateError(`"${node.path}" is not a list`);
            missing.add(node.path);
            break;
          }
          items.forEach((item, i) => {
            const local = { ...(item as Signer), index: i + 1, is_first: i === 0, is_last: i === items.length - 1 } as Record<string, unknown>;
            out += emit(node.body, local);
          });
          break;
        }
      }
    }

    return out;
  };

  const text = emit(parse(source), null)
    // Collapse the blank line runs that conditionals leave behind.
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, missing: [...missing] };
}
