import type { ReactNode } from "react";
import { coverFontVariables } from "@/lib/fonts/cover-fonts";

/**
 * The admin gallery screens preview and pick cover fonts, so they need the
 * same scoped set as the public gallery routes.
 */
export default function AdminGalleriesLayout({ children }: { children: ReactNode }) {
  return <div className={coverFontVariables}>{children}</div>;
}
