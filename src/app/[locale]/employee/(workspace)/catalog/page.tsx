import { EmployeeCatalog } from "@/components/employee/EmployeeCatalog";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getCatalog } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export const metadata = { title: "Catálogo comercial" };

export default async function EmployeeCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "es";
  const session = await requireEmployeeSession();
  const catalog = await getCatalog(session, {
    page: 1,
    pageSize: 24,
    sort: "availability",
  });

  return <EmployeeCatalog initial={catalog} locale={locale} />;
}
