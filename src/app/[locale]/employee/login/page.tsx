import { redirect } from "next/navigation";
import { EmployeeLoginForm } from "@/components/employee/EmployeeLoginForm";
import {
  employeeAuthMode,
  getEmployeeSession,
} from "@/lib/platform-api/auth";
import { isLocale } from "@/lib/dictionary";

export const metadata = {
  title: "Acceso de empleados | Quiksol",
  robots: { index: false, follow: false },
};

export default async function EmployeeLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "es";
  const session = await getEmployeeSession();

  if (session) {
    redirect(`/${locale}/employee`);
  }

  return <EmployeeLoginForm locale={locale} mode={employeeAuthMode()} />;
}
