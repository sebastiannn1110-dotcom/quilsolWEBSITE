import { redirect } from "next/navigation";
import { EmployeeShell } from "@/components/employee/EmployeeShell";
import { getEmployeeSession } from "@/lib/platform-api/auth";
import { isLocale } from "@/lib/dictionary";

export const metadata = {
  title: {
    default: "Área comercial | Quiksol",
    template: "%s | Área comercial Quiksol",
  },
  robots: { index: false, follow: false },
};

export default async function EmployeeWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "es";
  const session = await getEmployeeSession();

  if (!session) {
    redirect(`/${locale}/employee/login`);
  }

  return (
    <EmployeeShell session={session} locale={locale}>
      {children}
    </EmployeeShell>
  );
}
