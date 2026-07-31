import { OrderList } from "@/components/employee/CommerceRecords";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getOrders } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export const metadata = { title: "Pedidos" };

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const session = await requireEmployeeSession();
  const orders = await getOrders(session);
  return (
    <OrderList
      orders={orders}
      locale={isLocale(rawLocale) ? rawLocale : "es"}
    />
  );
}
