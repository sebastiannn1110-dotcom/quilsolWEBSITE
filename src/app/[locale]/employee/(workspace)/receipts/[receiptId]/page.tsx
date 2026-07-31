import { ReceiptDetail } from "@/components/employee/CommerceRecords";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getReceipt } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ locale: string; receiptId: string }>;
}) {
  const { locale: rawLocale, receiptId } = await params;
  const session = await requireEmployeeSession();
  const receipt = await getReceipt(session, receiptId);
  return (
    <ReceiptDetail
      receipt={receipt}
      locale={isLocale(rawLocale) ? rawLocale : "es"}
    />
  );
}
