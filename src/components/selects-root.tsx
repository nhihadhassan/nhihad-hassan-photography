"use client";

import type { ReactNode } from "react";
import { SelectsProvider } from "@/components/selects-provider";
import { SelectsDrawer } from "@/components/selects-drawer";
import type { PublicGalleryPhoto } from "@/lib/public-gallery";

export function SelectsRoot({
  slug,
  photos,
  downloadEnabled = false,
  children,
}: {
  slug: string;
  photos: PublicGalleryPhoto[];
  downloadEnabled?: boolean;
  children: ReactNode;
}) {
  return (
    <SelectsProvider slug={slug}>
      {children}
      <SelectsDrawer slug={slug} photos={photos} downloadEnabled={downloadEnabled} />
    </SelectsProvider>
  );
}
