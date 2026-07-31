import { QuoteBuilder } from "@/components/employee/QuoteBuilder";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getCustomers } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export const metadata = { title: "Nueva cotización" };

function sevenDaysAfter(value: string) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
}

export default async function NewQuotePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "es";
  const session = await requireEmployeeSession();
  const customers = await getCustomers(session);
  return (
    <QuoteBuilder
      customers={customers}
      session={session}
      locale={locale}
      initialValidUntil={sevenDaysAfter(
        customers[0]?.createdAt || "2030-01-01T00:00:00.000Z",
      )}
    />
  );
}
