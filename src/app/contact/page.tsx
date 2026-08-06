import type { Metadata } from "next";
import { AtSign, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { BookingServicePicker } from "@/components/booking-service-picker";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { ContactServiceSelect } from "@/components/contact-service-select";
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
            <ContactServiceSelect categories={pricing} />
          </Reveal>
        </section>
        <div className="-mx-4 mt-14 sm:-mx-6 lg:-mx-8">
          <AvailabilityCalendar interactive={false} />
        </div>
        <section id="sessions" className="mx-auto mt-20 max-w-7xl scroll-mt-28">
          <div className="mb-12 grid gap-4 border-b border-soft-white/12 pb-7 sm:grid-cols-[0.7fr_1.3fr] sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-copper">Sessions</p>
              <h2 className="mt-3 font-serif text-4xl leading-none text-soft-white sm:text-5xl">
                Choose what fits your shoot.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-soft-white/58 sm:justify-self-end sm:text-right">
              Your session length determines the exact start times available for the date you have in mind.
            </p>
          </div>
          <BookingServicePicker categories={pricing} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
