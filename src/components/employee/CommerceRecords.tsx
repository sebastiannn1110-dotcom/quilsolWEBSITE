import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { can } from "@/lib/platform-api/permissions";
import type {
  EmployeeSession,
  Order,
  Quote,
  Receipt,
  Reservation,
} from "@/lib/platform-api/types";
import { EmployeePageHeader, StatusBadge } from "./EmployeeShell";
import {
  CancelReservationButton,
  ConfirmOrderButton,
  DuplicateQuoteButton,
  ReserveQuoteButton,
  SendQuoteButton,
} from "./CommerceActions";

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function date(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function EmptyRecord({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
      <FileText
        aria-hidden="true"
        className="mx-auto text-slate-300"
        size={42}
      />
      <h2 className="mt-4 text-lg font-semibold">Sin {label}</h2>
      <p className="mt-2 text-sm text-slate-500">
        Los nuevos registros aparecerán aquí después de ser confirmados por la
        API mock.
      </p>
    </div>
  );
}

export function QuoteList({
  quotes,
  locale,
}: {
  quotes: Quote[];
  locale: string;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow="Cotizaciones"
        title="Historial comercial"
        body="Consulta borradores, documentos enviados y cotizaciones convertidas."
        actions={
          <Link
            href={`/${locale}/employee/quotes/new`}
            className="focus-ring inline-flex min-h-12 items-center justify-center rounded-lg bg-orange-600 px-5 font-semibold text-white"
          >
            Nueva cotización
          </Link>
        }
      />
      {quotes.length ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#062f33] text-xs uppercase text-white">
              <tr>
                <th className="px-5 py-4">Número</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Vendedor</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/${locale}/employee/quotes/${quote.id}`}
                      className="font-semibold text-orange-700"
                    >
                      {quote.number}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    {quote.customer.companyOrName}
                  </td>
                  <td className="px-5 py-4">{quote.sellerName}</td>
                  <td className="px-5 py-4">{date(quote.createdAt)}</td>
                  <td className="px-5 py-4 font-semibold">
                    {money(quote.total)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={quote.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyRecord label="cotizaciones" />
      )}
    </div>
  );
}

export function QuoteDetail({
  quote,
  locale,
}: {
  quote: Quote;
  locale: string;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/${locale}/employee/quotes`}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={18} /> Volver a cotizaciones
      </Link>
      <EmployeePageHeader
        eyebrow="Cotización"
        title={quote.number}
        body={`${quote.customer.companyOrName} · ${quote.sellerName}`}
        actions={<StatusBadge status={quote.status} />}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">MPN</th>
                  <th className="px-5 py-4">Descripción</th>
                  <th className="px-5 py-4">Cantidad</th>
                  <th className="px-5 py-4">Unitario</th>
                  <th className="px-5 py-4">Descuento</th>
                  <th className="px-5 py-4">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {quote.items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-5 py-4 font-mono font-semibold">
                      {item.mpn}
                    </td>
                    <td className="px-5 py-4">{item.description}</td>
                    <td className="px-5 py-4">{item.quantity}</td>
                    <td className="px-5 py-4">
                      {money(item.authorizedUnitPrice)}
                    </td>
                    <td className="px-5 py-4">{item.discountPercent}%</td>
                    <td className="px-5 py-4 font-semibold">
                      {money(item.lineSubtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-stone-200 p-5 text-sm leading-7 text-slate-600">
            <p>
              <strong>Notas:</strong> {quote.notes || "Sin notas."}
            </p>
            <p>
              <strong>Términos:</strong> {quote.commercialTerms}
            </p>
          </div>
        </section>
        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold">{money(quote.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Impuestos</dt>
              <dd className="font-semibold">{money(quote.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-4 text-lg">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold">{money(quote.total)}</dd>
            </div>
          </dl>
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            Esta cotización no garantiza disponibilidad de inventario hasta que
            los productos sean apartados.
          </p>
          <div className="mt-5 grid gap-3">
            <a
              href={`/api/employee/quotes/${quote.id}/pdf`}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 font-semibold"
            >
              <Download size={18} />
              Descargar PDF
            </a>
            <DuplicateQuoteButton quote={quote} locale={locale} />
            <SendQuoteButton quote={quote} />
            <ReserveQuoteButton quote={quote} locale={locale} />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ReservationList({
  reservations,
  locale,
}: {
  reservations: Reservation[];
  locale: string;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow="Inventario compartido"
        title="Reservas"
        body="Revisa apartados activos, parciales, vencidos o convertidos en pedido."
      />
      {reservations.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reservations.map((reservation) => (
            <Link
              key={reservation.id}
              href={`/${locale}/employee/reservations/${reservation.id}`}
              className="focus-ring rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <PackageCheck
                aria-hidden="true"
                className="text-orange-700"
                size={24}
              />
              <h2 className="mt-4 text-lg font-semibold">
                {reservation.number}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {reservation.customer.companyOrName}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <StatusBadge status={reservation.status} />
                <span className="text-xs text-slate-500">
                  {reservation.items.length} productos
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyRecord label="reservas" />
      )}
    </div>
  );
}

export function ReservationDetail({
  reservation,
  locale,
  session,
}: {
  reservation: Reservation;
  locale: string;
  session: EmployeeSession;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/${locale}/employee/reservations`}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={18} /> Volver a reservas
      </Link>
      <EmployeePageHeader
        eyebrow="Reserva"
        title={reservation.number}
        body={`${reservation.customer.companyOrName} · vence ${date(
          reservation.expiresAt,
        )}`}
        actions={<StatusBadge status={reservation.status} />}
      />
      {reservation.affectedProductIds.length ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Esta reserva es parcial. Los productos afectados aparecen resaltados y
          deben revisarse antes de continuar.
        </div>
      ) : null}
      <section className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-[#062f33] text-xs uppercase text-white">
            <tr>
              <th className="px-5 py-4">MPN</th>
              <th className="px-5 py-4">Descripción</th>
              <th className="px-5 py-4">Solicitado</th>
              <th className="px-5 py-4">Apartado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {reservation.items.map((item) => (
              <tr
                key={item.productId}
                className={
                  reservation.affectedProductIds.includes(item.productId)
                    ? "bg-amber-50"
                    : ""
                }
              >
                <td className="px-5 py-4 font-mono font-semibold">{item.mpn}</td>
                <td className="px-5 py-4">{item.description}</td>
                <td className="px-5 py-4">{item.quantity}</td>
                <td className="px-5 py-4 font-semibold">
                  {item.reservedQuantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="flex flex-wrap gap-3">
        <ConfirmOrderButton reservation={reservation} locale={locale} />
        {can(session.role, "reservations:cancel_team") ? (
          <CancelReservationButton reservation={reservation} />
        ) : null}
      </div>
    </div>
  );
}

export function OrderList({
  orders,
  locale,
}: {
  orders: Order[];
  locale: string;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow="Ventas"
        title="Pedidos"
        body="Consulta pedidos confirmados por el backend y su estado de pago."
      />
      {orders.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/${locale}/employee/orders/${order.id}`}
              className="focus-ring rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <ShoppingBag
                aria-hidden="true"
                className="text-orange-700"
                size={24}
              />
              <h2 className="mt-4 text-lg font-semibold">{order.number}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {order.customer.companyOrName}
              </p>
              <p className="mt-4 text-xl font-semibold">
                {money(order.total)}
              </p>
              <div className="mt-4 flex gap-2">
                <StatusBadge status={order.status} />
                <StatusBadge status={order.paymentStatus} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyRecord label="pedidos" />
      )}
    </div>
  );
}

export function OrderDetail({
  order,
  locale,
  receipt,
}: {
  order: Order;
  locale: string;
  receipt: Receipt | null;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/${locale}/employee/orders`}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={18} /> Volver a pedidos
      </Link>
      <EmployeePageHeader
        eyebrow="Pedido"
        title={order.number}
        body={`${order.customer.companyOrName} · ${order.reservationNumber}`}
        actions={<StatusBadge status={order.status} />}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#062f33] text-xs uppercase text-white">
              <tr>
                <th className="px-5 py-4">MPN</th>
                <th className="px-5 py-4">Descripción</th>
                <th className="px-5 py-4">Cantidad</th>
                <th className="px-5 py-4">Unitario</th>
                <th className="px-5 py-4">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-5 py-4 font-mono font-semibold">
                    {item.mpn}
                  </td>
                  <td className="px-5 py-4">{item.description}</td>
                  <td className="px-5 py-4">{item.quantity}</td>
                  <td className="px-5 py-4">
                    {money(item.authorizedUnitPrice)}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {money(item.lineSubtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold">{money(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Impuestos</dt>
              <dd className="font-semibold">{money(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-4 text-lg">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold">{money(order.total)}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
          {receipt && order.status === "confirmed" ? (
            <div className="mt-5 grid gap-3">
              <Link
                href={`/${locale}/employee/receipts/${receipt.id}`}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 font-semibold"
              >
                <ReceiptText size={18} />
                Ver recibo
              </Link>
              <a
                href={`/api/employee/orders/${order.id}/receipt`}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 font-semibold text-white"
              >
                <Download size={18} />
                Descargar recibo PDF
              </a>
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-950">
              El recibo sólo estará disponible cuando el backend confirme el
              pedido.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export function ReceiptDetail({
  receipt,
  locale,
}: {
  receipt: Receipt;
  locale: string;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/${locale}/employee/orders/${receipt.orderId}`}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={18} /> Volver al pedido
      </Link>
      <EmployeePageHeader
        eyebrow="Recibo"
        title={receipt.number}
        body={`${receipt.orderNumber} · ${receipt.order.customer.companyOrName}`}
        actions={<StatusBadge status={receipt.order.status} />}
      />
      <section className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Pedido</span>
            <strong className="mt-1 block">{receipt.orderNumber}</strong>
          </p>
          <p>
            <span className="text-slate-500">Cotización</span>
            <strong className="mt-1 block">{receipt.order.quoteNumber}</strong>
          </p>
          <p>
            <span className="text-slate-500">Fecha</span>
            <strong className="mt-1 block">{date(receipt.issuedAt)}</strong>
          </p>
          <p>
            <span className="text-slate-500">Cliente</span>
            <strong className="mt-1 block">
              {receipt.order.customer.companyOrName}
            </strong>
          </p>
          <p>
            <span className="text-slate-500">Referencia verificable</span>
            <strong className="mt-1 block font-mono">
              {receipt.verificationReference}
            </strong>
          </p>
        </div>
        <div className="mt-6 rounded-lg border-2 border-orange-300 bg-orange-50 p-4 text-center font-bold text-orange-900">
          DOCUMENTO DE PRUEBA — SIN VALIDEZ COMERCIAL
        </div>
        <a
          href={`/api/employee/orders/${receipt.orderId}/receipt`}
          className="focus-ring mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-semibold text-white"
        >
          <Download size={18} />
          Descargar PDF
        </a>
      </section>
    </div>
  );
}
