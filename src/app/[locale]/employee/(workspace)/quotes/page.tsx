import { QuoteList } from "@/components/employee/CommerceRecords";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getQuotes } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export const metadata = { title: "Cotizaciones" };

export default async function EmployeeQuotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const session = await requireEmployeeSession();
  const quotes = await getQuotes(session);
  return (
    <QuoteList
      quotes={quotes}
      locale={isLocale(rawLocale) ? rawLocale : "es"}
    />
  );
}
