import { CustomerForm } from "@/components/employee/CustomerForm";
import { isLocale } from "@/lib/dictionary";

export const metadata = { title: "Nuevo cliente" };

export default async function NewCustomerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  return <CustomerForm locale={isLocale(rawLocale) ? rawLocale : "es"} />;
}
