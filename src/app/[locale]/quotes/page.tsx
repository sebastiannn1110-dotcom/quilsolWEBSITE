import { FeatureShell } from "@/components/dashboard/FeatureShell";
import type { Locale } from "@/lib/constants";
import { getDictionary, isLocale } from "@/lib/dictionary";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function QuotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const copy = getDictionary(locale).pages.portal;

  return (
    <FeatureShell
      eyebrow={copy.hero.eyebrow}
      title={copy.features[3]}
      body={copy.hero.body}
      emptyTitle={copy.features[3]}
      emptyBody={copy.notice}
    />
  );
}
