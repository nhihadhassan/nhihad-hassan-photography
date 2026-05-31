import type { Metadata } from "next";
import { Bodoni_Moda, Cormorant_Garamond, Geist, Geist_Mono, Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getSiteSettings } from "@/lib/site-settings";

const SITE_URL = "https://nhihadhassan.ca";

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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.seoTitle ?? settings.brandName;
  const description = settings.seoDescription ?? settings.tagline;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${settings.brandName}`,
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_CA",
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
    "@type": "Photographer",
    name: settings.brandName,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image.png`,
    email: settings.contactEmail,
    description: settings.tagline,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressRegion: "ON",
      addressCountry: "CA",
    },
    areaServed: "Toronto, Ontario",
    sameAs: settings.instagram.map((account) => account.href),
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.brandName,
    url: SITE_URL,
  };

  // Curated theme overrides: re-point the serif font and accent token site-wide.
  const themeStyle: Record<string, string> = {};
  if (settings.themeSerifFont === "bodoni") themeStyle["--font-serif"] = "var(--font-bodoni)";
  if (settings.themeAccentHex) themeStyle["--copper"] = settings.themeAccentHex;

  return (
    <html
      lang="en"
      style={themeStyle as React.CSSProperties}
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${bodoni.variable} ${montserrat.variable} h-full scroll-smooth antialiased`}
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
