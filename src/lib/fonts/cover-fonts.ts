import {
  Abril_Fatface,
  DM_Serif_Display,
  Libre_Baskerville,
  Lora,
  Newsreader,
  Oswald,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";

/**
 * Optional typefaces a gallery cover can be set to.
 *
 * These live here rather than in the root layout so their @font-face CSS is
 * only shipped on routes that can actually render a cover -- the public
 * gallery pages and the admin gallery screens. They were already `preload:
 * false`, so nothing was being downloaded eagerly, but every page on the site
 * still carried the stylesheet for thirteen families it would never use.
 *
 * Montserrat, Cormorant and Bodoni are deliberately absent: they are part of
 * the site's core type and stay global in the root layout, and
 * lib/gallery-cover-fonts.ts already points at their global variables.
 */
const playfair = Playfair_Display({
  variable: "--font-cover-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  preload: false,
});

const dmSerif = DM_Serif_Display({
  variable: "--font-cover-dm-serif",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-cover-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});

const lora = Lora({
  variable: "--font-cover-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const newsreader = Newsreader({
  variable: "--font-cover-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const oswald = Oswald({
  variable: "--font-cover-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-cover-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-cover-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const abrilFatface = Abril_Fatface({
  variable: "--font-cover-abril-fatface",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

/** Apply to a wrapper element so `--font-cover-*` resolves for its subtree. */
export const coverFontVariables = [
  playfair.variable,
  dmSerif.variable,
  libreBaskerville.variable,
  lora.variable,
  newsreader.variable,
  oswald.variable,
  spaceGrotesk.variable,
  plusJakarta.variable,
  abrilFatface.variable,
].join(" ");
