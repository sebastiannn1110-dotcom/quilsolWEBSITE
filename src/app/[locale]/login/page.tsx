import { getAuthCopy, LoginForm } from "@/components/auth/AuthForms";
import { PageHero } from "@/components/sections/PageHero";
import type { Locale } from "@/lib/constants";
import { isLocale } from "@/lib/dictionary";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string }>;
};

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const { message } = await searchParams;
  const copy = getAuthCopy(locale);

  return (
    <>
      <PageHero
        eyebrow={copy.portal}
        title={copy.login}
        body={copy.loginBody}
        locale={locale}
      />
      <section className="section-y bg-slate-50">
        <div className="container-page max-w-xl">
          <LoginForm locale={locale} message={message} />
        </div>
      </section>
    </>
  );
}
