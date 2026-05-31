import type { Metadata } from "next";
import { AtSign, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { HowBookingWorks } from "@/components/how-booking-works";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { SelectedDateProvider } from "@/components/selected-date-context";
import { EditPencil } from "@/components/edit-mode";
import { getSiteSettings } from "@/lib/site-settings";
import { getContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a wedding, couples, portrait, or event session with Nhihad Hassan Photography in Toronto. Inquiry-based, no checkout on this site.",
  openGraph: {
    title: "Contact | Nhihad Hassan Photography",
    description:
      "Start an inquiry for weddings, portraits, events, or nightlife coverage in Toronto.",
  },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const heading = await getContent("contact.hero.heading");
  const subtext = await getContent("contact.hero.subtext");
  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <SelectedDateProvider>
      <main id="inquiry" className="scroll-mt-24 px-4 pb-20 pt-32 sm:px-6 sm:pt-40 lg:px-8">
        <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1fr]">
          <Reveal>
            <div className="relative lg:sticky lg:top-28">
              <EditPencil href="/admin/settings" label="Edit text" className="absolute right-0 top-0" />
              <p className="text-xs uppercase tracking-[0.22em] text-copper">Book / inquire</p>
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
            <div className="rounded-[2px] bg-[#f3eee5] p-5 text-ink shadow-[0_24px_80px_-48px_rgba(0,0,0,0.7)] sm:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </section>

        {/* How booking works (shared with the pricing page) */}
        <HowBookingWorks className="mt-16 lg:mt-20" cardClassName="border-ink/10 bg-[#f3eee5]" />
      </main>
      <AvailabilityCalendar />
      </SelectedDateProvider>
      <SiteFooter />
    </div>
  );
}
