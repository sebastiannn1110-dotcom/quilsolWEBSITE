import { EmployeeCatalog } from "@/components/employee/EmployeeCatalog";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getCatalog } from "@/lib/platform-api/server-client";

export const metadata = { title: "Catálogo comercial" };

export default async function EmployeeCatalogPage() {
  const session = await requireEmployeeSession();
  const catalog = await getCatalog(session, {
    page: 1,
    pageSize: 24,
    sort: "availability",
  });

  return <EmployeeCatalog initial={catalog} />;
}
