import { getAuthCopy, RegisterForm } from "@/components/auth/AuthForms";
import { PageHero } from "@/components/sections/PageHero";
import type { Locale } from "@/lib/constants";
import { isLocale } from "@/lib/dictionary";

type PageProps = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const copy = getAuthCopy(locale);

  return (
    <>
      <PageHero
        eyebrow={copy.portal}
        title={copy.register}
        body={copy.registerBody}
        locale={locale}
      />
      <section className="section-y bg-slate-50">
        <div className="container-page max-w-xl">
          <RegisterForm locale={locale} />
        </div>
      </section>
    </>
  );
}
