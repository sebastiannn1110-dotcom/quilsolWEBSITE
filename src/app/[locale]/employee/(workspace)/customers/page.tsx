import { EmployeeCustomers } from "@/components/employee/EmployeeCustomers";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getCustomers } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export const metadata = { title: "Clientes" };

export default async function EmployeeCustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "es";
  const session = await requireEmployeeSession();
  const customers = await getCustomers(session);

  return <EmployeeCustomers customers={customers} locale={locale} />;
}
