import { OrderDetail } from "@/components/employee/CommerceRecords";
import { PlatformApiError } from "@/lib/platform-api/errors";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import {
  getOrder,
  getReceiptByOrder,
} from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale: rawLocale, orderId } = await params;
  const session = await requireEmployeeSession();
  const order = await getOrder(session, orderId);
  let receipt = null;
  try {
    receipt = await getReceiptByOrder(session, orderId);
  } catch (error) {
    if (!(error instanceof PlatformApiError) || error.status !== 404) {
      throw error;
    }
  }
  return (
    <OrderDetail
      order={order}
      receipt={receipt}
      locale={isLocale(rawLocale) ? rawLocale : "es"}
    />
  );
}
