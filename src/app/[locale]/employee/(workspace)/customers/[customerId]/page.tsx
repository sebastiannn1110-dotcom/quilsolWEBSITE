import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/employee/CustomerForm";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getCustomers } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export const metadata = { title: "Editar cliente" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ locale: string; customerId: string }>;
}) {
  const { locale: rawLocale, customerId } = await params;
  const session = await requireEmployeeSession();
  const customers = await getCustomers(session);
  const customer = customers.find((item) => item.id === customerId);

  if (!customer) notFound();

  return (
    <CustomerForm
      locale={isLocale(rawLocale) ? rawLocale : "es"}
      customer={customer}
    />
  );
}
