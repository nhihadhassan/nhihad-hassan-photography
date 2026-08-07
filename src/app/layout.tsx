import type { Metadata } from "next";
import {
  Abril_Fatface,
  Bodoni_Moda,
  Cormorant_Garamond,
  DM_Serif_Display,
  Geist,
  Geist_Mono,
  Libre_Baskerville,
  Lora,
  Montserrat,
  Newsreader,
  Oswald,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { getSiteSettings } from "@/lib/site-settings";
import { EditModeProvider } from "@/components/edit-mode";
import { defaultOgImage, defaultTwitterImage, siteUrl } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Cover fonts are opt-in per gallery, so they are available to the cover
// renderer without preloading every optional face on every page.
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.seoTitle ?? settings.brandName;
  const description = settings.seoDescription ?? settings.tagline;
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${settings.brandName}`,
    },
    description,
    alternates: {
      canonical: "/",
    },
    ...(settings.googleVerification
      ? { verification: { google: settings.googleVerification } }
      : {}),
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: settings.brandName,
      type: "website",
      locale: "en_CA",
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultTwitterImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Photographer", "LocalBusiness"],
    name: settings.brandName,
    url: siteUrl,
    image: `${siteUrl}/opengraph-image.png`,
    logo: `${siteUrl}/icon.png`,
    email: settings.contactEmail,
    ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
    description: settings.tagline,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressRegion: "ON",
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.6532,
      longitude: -79.3832,
    },
    areaServed: [
      "Toronto",
      "Greater Toronto Area",
      "Etobicoke",
      "North York",
      "Scarborough",
      "Mississauga",
      "Markham",
      "Vaughan",
      "Ontario",
    ],
    knowsAbout: [
      "Wedding photography",
      "Engagement photography",
      "Portrait photography",
      "Event photography",
    ],
    sameAs: settings.instagram.map((account) => account.href),
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.brandName,
    url: siteUrl,
  };

  // Curated theme overrides: re-point the serif font and accent token site-wide.
  const themeStyle: Record<string, string> = {};
  if (settings.themeSerifFont === "bodoni") themeStyle["--font-serif"] = "var(--font-bodoni)";
  if (settings.themeAccentHex) themeStyle["--copper"] = settings.themeAccentHex;

  return (
    <html
      lang="en"
      style={themeStyle as React.CSSProperties}
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${bodoni.variable} ${montserrat.variable} ${playfair.variable} ${dmSerif.variable} ${libreBaskerville.variable} ${lora.variable} ${newsreader.variable} ${oswald.variable} ${spaceGrotesk.variable} ${plusJakarta.variable} ${abrilFatface.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <EditModeProvider>{children}</EditModeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
