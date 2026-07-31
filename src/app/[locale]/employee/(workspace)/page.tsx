import { EmployeeDashboard } from "@/components/employee/EmployeeDashboard";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getEmployeeDashboard } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export default async function EmployeeHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "es";
  const session = await requireEmployeeSession();
  const dashboard = await getEmployeeDashboard(session);

  return (
    <EmployeeDashboard
      data={dashboard}
      locale={locale}
      session={session}
    />
  );
}
