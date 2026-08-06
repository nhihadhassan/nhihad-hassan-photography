import type { Metadata } from "next";
import { AtSign, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { BookingServicePicker } from "@/components/booking-service-picker";
import { EditPencil } from "@/components/edit-mode";
import { getSiteSettings } from "@/lib/site-settings";
import { getContent } from "@/lib/site-content";
import { getPricing } from "@/lib/pricing";
import { withDefaultSocialImages } from "@/lib/seo";

export const metadata: Metadata = withDefaultSocialImages({
  title: "Contact",
  description:
    "Book a wedding, couples, portrait, or event session with Nhihad Hassan Photography in Toronto. Inquiry-based, no checkout on this site.",
  openGraph: {
    title: "Contact | Nhihad Hassan Photography",
    description:
      "Start an inquiry for weddings, portraits, events, or nightlife coverage in Toronto.",
  },
});

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const heading = await getContent("contact.hero.heading");
  const subtext = await getContent("contact.hero.subtext");
  const pricing = await getPricing();
  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <main id="inquiry" className="scroll-mt-24 px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-8">
        <section className="mx-auto grid max-w-7xl gap-10 border-b border-soft-white/12 pb-14 lg:grid-cols-[0.72fr_1fr] lg:items-end">
          <Reveal>
            <div className="relative">
              <EditPencil href="/admin/settings" label="Edit text" className="absolute right-0 top-0" />
              <p className="text-xs uppercase tracking-[0.22em] text-copper">Book a session</p>
              <h1 className="mt-4 font-serif text-6xl leading-[0.9] text-soft-white sm:text-8xl">
                {heading}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-soft-white/62">
                {subtext}
              </p>
              <div className="mt-8 grid gap-3 text-sm text-soft-white/70">
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-flex min-h-11 items-center gap-3 rounded-full border border-soft-white/14 px-4 transition hover:border-soft-white/28 hover:text-soft-white"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {settings.contactEmail}
                </a>
                {settings.instagram.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-3 rounded-full border border-soft-white/14 px-4 transition hover:border-soft-white/28 hover:text-soft-white"
                  >
                    <AtSign className="size-4" aria-hidden="true" />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="max-w-xl lg:justify-self-end">
              <p className="font-serif text-3xl leading-tight text-soft-white sm:text-4xl">
                First, choose the session that fits.
              </p>
              <p className="mt-5 text-sm leading-6 text-soft-white/60">
                You&apos;ll choose an available date and time next, then share your contact details. Nothing is charged online.
              </p>
            </div>
          </Reveal>
        </section>
        <section className="mx-auto mt-14 max-w-7xl">
          <BookingServicePicker categories={pricing} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
