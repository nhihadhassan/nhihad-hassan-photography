import type { ReactNode } from "react";
import { coverFontVariables } from "@/lib/fonts/cover-fonts";

/**
 * Scopes the optional gallery-cover typefaces to the public gallery routes.
 * Only a cover can use them, so only these routes carry their stylesheet.
 */
export default function GalleriesLayout({ children }: { children: ReactNode }) {
  return <div className={coverFontVariables}>{children}</div>;
}
