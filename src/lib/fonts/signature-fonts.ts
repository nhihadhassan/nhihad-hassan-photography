import { Alex_Brush, Dancing_Script, Great_Vibes, Homemade_Apple } from "next/font/google";

/**
 * Handwriting faces offered on the agreement signing page's "type your
 * signature" tab. Scoped to the /agreement route for the same reason as the
 * cover fonts: nowhere else on the site can render them.
 */
const dancingScript = Dancing_Script({
  variable: "--font-signature-dancing",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  preload: false,
});

const greatVibes = Great_Vibes({
  variable: "--font-signature-vibes",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const alexBrush = Alex_Brush({
  variable: "--font-signature-brush",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const homemadeApple = Homemade_Apple({
  variable: "--font-signature-handwritten",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

/** Apply to a wrapper element so `--font-signature-*` resolves for its subtree. */
export const signatureFontVariables = [
  dancingScript.variable,
  greatVibes.variable,
  alexBrush.variable,
  homemadeApple.variable,
].join(" ");
