import { QuoteDetail } from "@/components/employee/CommerceRecords";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getQuote } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ locale: string; quoteId: string }>;
}) {
  const { locale: rawLocale, quoteId } = await params;
  const session = await requireEmployeeSession();
  const quote = await getQuote(session, quoteId);
  return (
    <QuoteDetail
      quote={quote}
      locale={isLocale(rawLocale) ? rawLocale : "es"}
    />
  );
}
