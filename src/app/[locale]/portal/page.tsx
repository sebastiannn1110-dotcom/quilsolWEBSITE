import { StatusPanel } from "@/components/catalog/StatusPanel";
import { FeatureShell } from "@/components/dashboard/FeatureShell";
import type { Locale } from "@/lib/constants";
import { getDictionary, isLocale } from "@/lib/dictionary";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const copy = getDictionary(locale).pages.portal;
  const { user, configured } = await getCurrentUser();

  return (
    <FeatureShell
      eyebrow={copy.hero.eyebrow}
      title={copy.hero.title}
      body={copy.hero.body}
    >
      {!configured || !user ? (
        <StatusPanel
          tone={!configured ? "setup" : "protected"}
          title={copy.hero.eyebrow}
          body={copy.notice}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {copy.features.map((item) => (
            <div
              key={item}
              className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-950">{item}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {copy.notice}
              </p>
            </div>
          ))}
        </div>
      )}
    </FeatureShell>
  );
}
