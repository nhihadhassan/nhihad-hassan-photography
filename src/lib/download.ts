import "server-only";
import archiver from "archiver";
import { downloadFromR2 } from "@/lib/r2";

export type DownloadablePhoto = {
  id: string;
  filename: string;
  originalKey: string;
  webKey: string | null;
  sortOrder: number;
};

const FORBIDDEN_FS_CHARS = /[\\/:*?"<>|\x00-\x1f]/g;

function sanitiseFilenameForZip(name: string): string {
  const cleaned = name.replace(FORBIDDEN_FS_CHARS, "_").trim();
  return cleaned || "photo";
}

function uniquify(filename: string, used: Set<string>): string {
  if (!used.has(filename)) {
    used.add(filename);
    return filename;
  }
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : "";
  let i = 2;
  let candidate = `${stem} (${i})${ext}`;
  while (used.has(candidate)) {
    i += 1;
    candidate = `${stem} (${i})${ext}`;
  }
  used.add(candidate);
  return candidate;
}

/**
 * Builds the in-zip path for a photo. The sort_order prefix preserves the
 * grid order when the visitor opens the folder. Filename collisions are
 * resolved with "(2)", "(3)" suffixes.
 */
export function buildArchivePaths(
  photos: DownloadablePhoto[],
): { photo: DownloadablePhoto; path: string }[] {
  const used = new Set<string>();
  // Sort by sort_order then id for determinism
  const sorted = [...photos].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
  return sorted.map((photo, index) => {
    const safe = sanitiseFilenameForZip(photo.filename);
    const prefix = String(index + 1).padStart(3, "0");
    const unique = uniquify(`${prefix}-${safe}`, used);
    return { photo, path: unique };
  });
}

export function buildZipFilename(slug: string, scope: "all" | "selects"): string {
  const safeSlug = slug.replace(FORBIDDEN_FS_CHARS, "_").slice(0, 60) || "gallery";
  const date = new Date().toISOString().slice(0, 10);
  return `${safeSlug}-${scope}-${date}.zip`;
}

/**
 * Creates a streaming ZIP. Each photo is downloaded from R2 sequentially
 * (bounded memory: one photo at a time), appended to the archive, and
 * piped out as bytes. Returns a Web ReadableStream suitable for a Next.js
 * Response.
 */
export function streamGalleryZip({
  entries,
  quality,
}: {
  entries: { photo: DownloadablePhoto; path: string }[];
  quality: "web" | "full";
}): ReadableStream<Uint8Array> {
  const archive = archiver("zip", {
    // Photos (JPEG/WebP) are already compressed — DEFLATE wastes CPU for
    // negligible gain. Store-only keeps the throughput high.
    store: true,
  });

  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const dataHandler = (chunk: Buffer) => {
        if (cancelled) return;
        controller.enqueue(new Uint8Array(chunk));
      };
      const endHandler = () => {
        if (cancelled) return;
        try {
          controller.close();
        } catch {
          // ignore double-close
        }
      };
      const errorHandler = (err: Error) => {
        if (cancelled) return;
        try {
          controller.error(err);
        } catch {
          // ignore
        }
      };

      archive.on("data", dataHandler);
      archive.on("end", endHandler);
      archive.on("warning", (err) => {
        // Surface only fatal warnings; non-fatal (ENOENT) shouldn't kill stream.
        if (err && (err as { code?: string }).code !== "ENOENT") {
          errorHandler(err as Error);
        }
      });
      archive.on("error", errorHandler);

      void (async () => {
        try {
          for (const entry of entries) {
            if (cancelled) break;
            const key =
              quality === "web"
                ? entry.photo.webKey ?? entry.photo.originalKey
                : entry.photo.originalKey;
            const buffer = await downloadFromR2(key);
            archive.append(buffer, { name: entry.path });
          }
          if (!cancelled) await archive.finalize();
        } catch (err) {
          errorHandler(err instanceof Error ? err : new Error("zip-stream"));
        }
      })();
    },
    cancel() {
      cancelled = true;
      try {
        archive.abort();
      } catch {
        // ignore
      }
    },
  });

  return stream;
}
