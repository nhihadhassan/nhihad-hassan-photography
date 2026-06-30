import type { PortfolioCategory } from "@/data/photography";

/** A typed content block in a journal post body. */
export type JournalBlock =
  | { id: string; type: "heading"; text: string; level?: 2 | 3; align?: "left" | "center" }
  | { id: string; type: "paragraph"; text: string; align?: "left" | "center" }
  | { id: string; type: "quote"; text: string; attribution?: string }
  | {
      id: string;
      type: "image";
      imageKey?: string | null;
      imageUrl?: string | null;
      caption?: string;
      alt?: string;
      width?: "normal" | "wide" | "full";
    }
  | {
      id: string;
      type: "image_row";
      images: { imageKey?: string | null; imageUrl?: string | null; alt?: string }[];
      caption?: string;
    }
  | { id: string; type: "list"; items: string[] }
  | { id: string; type: "divider" };

export type BlockType = JournalBlock["type"];

/** Block with image sources already resolved to URLs for rendering. */
export type ResolvedBlock =
  | Exclude<JournalBlock, { type: "image" } | { type: "image_row" }>
  | (Extract<JournalBlock, { type: "image" }> & { src: string })
  | (Extract<JournalBlock, { type: "image_row" }> & { srcs: { src: string; alt?: string }[] });

export type JournalPostRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tag: string | null;
  post_date: string;
  cover_key: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  content: JournalBlock[];
  accent_hex: string | null;
  body_font: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Public-facing post with cover + block images resolved to URLs. */
export type PublicJournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string | null;
  date: string;
  coverUrl: string | null;
  coverAlt: string;
  blocks: ResolvedBlock[];
  accentHex: string | null;
  bodyFont: string | null;
};

export type JournalListItem = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  coverUrl: string | null;
  coverAlt: string;
};

export const JOURNAL_TAGS: { value: string; label: string }[] = [
  { value: "weddings-couples", label: "Weddings / Couples" },
  { value: "events", label: "Events" },
  { value: "portraits", label: "Portraits" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "nightlife", label: "Nightlife" },
  { value: "tips", label: "Tips" },
];

export type { PortfolioCategory };
