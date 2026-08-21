import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Montserrat,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

// The optional gallery-cover and signature typefaces are declared in
// lib/fonts/*.ts and applied by the route segments that can render them
// (app/galleries, app/admin/.../galleries, app/agreement). Keeping them out of
// the root layout means an ordinary visitor no longer downloads a stylesheet
// describing thirteen families the page cannot use.

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
    // Deliberately no `alternates.canonical` here. Metadata is inherited, so a
    // canonical declared at the root becomes every subpage's canonical unless
    // that page overrides it -- which is how every page on the site ended up
    // claiming to be a duplicate of the homepage. Each page declares its own;
    // see lib/seo.ts.
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
    email: settings.publicContactEmail,
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
        {/* min-w-0, and deliberately NOT display:flex: without min-w-0, a flex
            item's cross-axis floor is its content's min-content width, so one
            unbreakable value anywhere on the page (a long address, an
            unwrapped URL) silently widens the whole document past the
            viewport instead of wrapping or scrolling. Making this wrapper a
            flex container itself would just hand that same problem to
            {children}'s own root element one level down. */}
        <div className="min-w-0">
          <EditModeProvider>{children}</EditModeProvider>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
