import { ReservationDetail } from "@/components/employee/CommerceRecords";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getReservation } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; reservationId: string }>;
}) {
  const { locale: rawLocale, reservationId } = await params;
  const session = await requireEmployeeSession();
  const reservation = await getReservation(session, reservationId);
  return (
    <ReservationDetail
      reservation={reservation}
      locale={isLocale(rawLocale) ? rawLocale : "es"}
      session={session}
    />
  );
}
