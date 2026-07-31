import { ReservationList } from "@/components/employee/CommerceRecords";
import { requireEmployeeSession } from "@/lib/platform-api/auth";
import { getReservations } from "@/lib/platform-api/server-client";
import { isLocale } from "@/lib/dictionary";

export const metadata = { title: "Reservas" };

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const session = await requireEmployeeSession();
  const reservations = await getReservations(session);
  return (
    <ReservationList
      reservations={reservations}
      locale={isLocale(rawLocale) ? rawLocale : "es"}
    />
  );
}
