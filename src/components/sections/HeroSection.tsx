import { ArrowRight, Boxes, ExternalLink, Link2, MessageSquareText } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { Locale } from "@/lib/constants";
import { localizedPath, type Dictionary } from "@/lib/dictionary";
import { AnimatedWrapper } from "@/components/ui/AnimatedWrapper";
import { HeroVideo } from "@/components/sections/HeroVideo";

const quicksolLinkedInPostUrl =
  "https://www.linkedin.com/posts/quiksol-global_workhardplayhard-melbourne-incentivetrip-activity-7478975884134100992-KQbW?utm_source=share&utm_medium=member_desktop&rcm=ACoAAESKkT8BT6ARAgYmRxlPeoJwStMyvqr6diA";

export function HeroSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <section className="relative overflow-hidden bg-[#071314] text-white">
      <div className="absolute inset-0">
        <HeroVideo label={dict.home.hero.imageAlt} locale={locale} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#071314_0%,rgba(7,19,20,0.9)_36%,rgba(6,47,51,0.34)_100%)]" />
        <div className="absolute inset-0 bg-slate-950/20" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-600" />
      </div>
      <div className="container-page relative min-h-[calc(100vh-80px)] py-16 md:min-h-[720px] md:py-24">
        <div className="flex h-full max-w-3xl flex-col justify-center">
          <AnimatedWrapper>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-orange-300">
              {dict.home.hero.eyebrow}
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-normal md:text-7xl">
              {dict.home.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
              {dict.home.hero.body}
            </p>
          </AnimatedWrapper>

          <AnimatedWrapper delay={0.08}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href={localizedPath(locale, "/rfq")}
                icon={<ArrowRight aria-hidden="true" className="h-4 w-4" />}
              >
                {dict.common.cta.rfq}
              </ButtonLink>
              <ButtonLink
                href={localizedPath(locale, "/catalog")}
                variant="dark"
                icon={<Boxes aria-hidden="true" className="h-4 w-4" />}
              >
                {dict.common.cta.products}
              </ButtonLink>
              <ButtonLink
                href={localizedPath(locale, "/contact")}
                variant="dark"
                icon={
                  <MessageSquareText aria-hidden="true" className="h-4 w-4" />
                }
              >
                {dict.common.cta.contact}
              </ButtonLink>
            </div>
            <a
              href={quicksolLinkedInPostUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open Quicksol LinkedIn post"
              className="focus-ring mt-5 inline-flex min-h-10 w-fit items-center gap-2 rounded-md border border-sky-300/35 bg-white/8 px-4 py-2 text-sm font-semibold text-sky-100 transition duration-200 hover:border-sky-200 hover:bg-white/14 hover:text-white"
            >
              <Link2 aria-hidden="true" className="h-4 w-4" />
              <span>LinkedIn Quicksol</span>
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </AnimatedWrapper>
        </div>
      </div>
    </section>
  );
}
