import type { Metadata } from "next";
import { AtSign, Mail, Phone } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingServicePicker } from "@/components/booking-service-picker";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { ContactServiceSelect } from "@/components/contact-service-select";
import { ContactForm } from "@/components/contact-form";
import { SelectedDateProvider } from "@/components/selected-date-context";
import { EditPencil } from "@/components/edit-mode";
import { getSiteSettings } from "@/lib/site-settings";
import { getContent } from "@/lib/site-content";
import { getPricing } from "@/lib/pricing";
import { withDefaultSocialImages } from "@/lib/seo";
import { brandConfig } from "@/lib/config";

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
      <SelectedDateProvider>
        <main className="px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-8">
          <section className="mx-auto grid max-w-7xl gap-x-14 gap-y-12 border-b border-soft-white/12 pb-16 lg:grid-cols-[0.82fr_1fr] lg:items-start">
            {/* LEFT — intro + contact details. Sticks alongside the taller
                right column so the composition stays balanced while the
                inquiry form scrolls. */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="relative">
                <EditPencil href="/admin/settings" label="Edit text" className="absolute right-0 top-0" />
                <p className="text-xs uppercase tracking-[0.22em] text-copper">Let&apos;s connect</p>
                <h1 className="mt-5 font-serif text-5xl leading-[0.95] text-soft-white sm:text-7xl">
                  {heading}
                </h1>
                <span className="mt-7 block h-px w-16 bg-copper/70" aria-hidden="true" />
                <p className="mt-7 max-w-md text-base leading-7 text-soft-white/62">
                  {subtext}
                </p>
                <div className="mt-9 grid gap-3 text-sm text-soft-white/70">
                  <a
                    href={`mailto:${brandConfig.publicContactEmail}`}
                    className="group inline-flex min-h-11 items-center gap-3 rounded-full border border-soft-white/14 px-4 transition hover:border-copper/50 hover:text-soft-white"
                  >
                    <Mail className="size-4 text-copper" aria-hidden="true" />
                    {brandConfig.publicContactEmail}
                  </a>
                  <a
                    href={`tel:+1${brandConfig.publicContactPhone.replace(/\D/g, "")}`}
                    className="group inline-flex min-h-11 items-center gap-3 rounded-full border border-soft-white/14 px-4 transition hover:border-copper/50 hover:text-soft-white"
                  >
                    <Phone className="size-4 text-copper" aria-hidden="true" />
                    {brandConfig.publicContactPhone}
                  </a>
                  {settings.instagram.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex min-h-11 items-center gap-3 rounded-full border border-soft-white/14 px-4 transition hover:border-copper/50 hover:text-soft-white"
                    >
                      <AtSign className="size-4 text-copper" aria-hidden="true" />
                      {item.label}
                    </a>
                  ))}
                </div>
                <div className="mt-12 hidden border-t border-soft-white/10 pt-6 lg:block">
                  <p className="text-xs uppercase tracking-[0.2em] text-soft-white/35">
                    Based in Toronto
                  </p>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-soft-white/50">
                    Available for weddings, couples, events, portraits, and nightlife across the
                    GTA and beyond.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT — two paths: pick a service, or send a general inquiry.
                Rendered without a scroll-reveal gate: this is above-the-fold
                and must be visible immediately. */}
            <div className="w-full">
              <ContactServiceSelect categories={pricing} />

              <div className="my-9 flex items-center gap-4 text-[11px] uppercase tracking-[0.24em] text-soft-white/35">
                <span className="h-px flex-1 bg-soft-white/12" aria-hidden="true" />
                or
                <span className="h-px flex-1 bg-soft-white/12" aria-hidden="true" />
              </div>

              <div id="inquiry" className="scroll-mt-28">
                <div className="flex items-center gap-4">
                  <p className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-copper">
                    Not sure yet? Send an inquiry
                  </p>
                  <span className="h-px flex-1 bg-soft-white/12" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm leading-6 text-soft-white/60">
                  Share a few details and I&apos;ll get back to you personally.
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>
          </section>
          <div className="-mx-4 mt-14 sm:-mx-6 lg:-mx-8">
            <AvailabilityCalendar />
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
      </SelectedDateProvider>
      <SiteFooter />
    </div>
  );
}
