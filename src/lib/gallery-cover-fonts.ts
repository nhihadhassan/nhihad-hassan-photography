export const GALLERY_COVER_FONTS = [
  {
    value: "montserrat",
    label: "Montserrat",
    cssVariable: "--font-montserrat",
    familyFallback: "Arial, sans-serif",
    weight: 700,
  },
  {
    value: "cormorant",
    label: "Cormorant Garamond",
    cssVariable: "--font-cormorant",
    familyFallback: "Georgia, serif",
    weight: 600,
  },
  {
    value: "bodoni",
    label: "Bodoni Moda",
    cssVariable: "--font-bodoni",
    familyFallback: "Didot, Georgia, serif",
    weight: 600,
  },
  {
    value: "playfair",
    label: "Playfair Display",
    cssVariable: "--font-cover-playfair",
    familyFallback: "Georgia, serif",
    weight: 600,
  },
  {
    value: "dm-serif",
    label: "DM Serif Display",
    cssVariable: "--font-cover-dm-serif",
    familyFallback: "Georgia, serif",
    weight: 400,
  },
  {
    value: "libre-baskerville",
    label: "Libre Baskerville",
    cssVariable: "--font-cover-libre-baskerville",
    familyFallback: "Georgia, serif",
    weight: 700,
  },
  {
    value: "lora",
    label: "Lora",
    cssVariable: "--font-cover-lora",
    familyFallback: "Georgia, serif",
    weight: 600,
  },
  {
    value: "newsreader",
    label: "Newsreader",
    cssVariable: "--font-cover-newsreader",
    familyFallback: "Georgia, serif",
    weight: 600,
  },
  {
    value: "oswald",
    label: "Oswald",
    cssVariable: "--font-cover-oswald",
    familyFallback: "Arial Narrow, sans-serif",
    weight: 600,
  },
  {
    value: "space-grotesk",
    label: "Space Grotesk",
    cssVariable: "--font-cover-space-grotesk",
    familyFallback: "Arial, sans-serif",
    weight: 600,
  },
  {
    value: "plus-jakarta",
    label: "Plus Jakarta Sans",
    cssVariable: "--font-cover-plus-jakarta",
    familyFallback: "Arial, sans-serif",
    weight: 700,
  },
  {
    value: "abril-fatface",
    label: "Abril Fatface",
    cssVariable: "--font-cover-abril-fatface",
    familyFallback: "Georgia, serif",
    weight: 400,
  },
] as const;

export type GalleryCoverFont = (typeof GALLERY_COVER_FONTS)[number]["value"];

export const GALLERY_COVER_FONT_VALUES = GALLERY_COVER_FONTS.map(
  (font) => font.value,
) as [GalleryCoverFont, ...GalleryCoverFont[]];

export function getGalleryCoverFont(value: string | null | undefined) {
  return (
    GALLERY_COVER_FONTS.find((font) => font.value === value) ?? GALLERY_COVER_FONTS[0]
  );
}
