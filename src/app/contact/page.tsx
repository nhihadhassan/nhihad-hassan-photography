import type { Metadata } from "next";
import { AtSign, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { brandConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a wedding, couples, portrait, or event session with Nhihad Hassan Photography in Toronto. Inquiry-based — no checkout on this site.",
  openGraph: {
    title: "Contact | Nhihad Hassan Photography",
    description:
      "Start an inquiry for weddings, portraits, events, or nightlife coverage in Toronto.",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1fr]">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="text-xs uppercase tracking-[0.22em] text-copper">Book / inquire</p>
              <h1 className="mt-4 font-serif text-6xl leading-[0.9] text-soft-white sm:text-8xl">
                Tell me about the day you want remembered.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-soft-white/62">
                Tell me the date, the location, and what you want the photos to feel like. If email is easier, that works too.
              </p>
              <div className="mt-8 grid gap-3 text-sm text-soft-white/70">
                <a
                  href={`mailto:${brandConfig.contactEmail}`}
                  className="inline-flex min-h-11 items-center gap-3 rounded-full border border-soft-white/14 px-4 transition hover:border-soft-white/28 hover:text-soft-white"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {brandConfig.contactEmail}
                </a>
                {brandConfig.instagram.map((item) => (
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
      </main>
      <SiteFooter />
    </div>
  );
}
