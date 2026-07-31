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
import {
  employeeCopy,
  employeeIntlLocale,
  employeeProductText,
} from "@/lib/platform-api/employee-i18n";
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

function money(value: number, locale: string) {
  return new Intl.NumberFormat(employeeIntlLocale(locale), {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function date(value: string, locale: string) {
  return new Intl.DateTimeFormat(employeeIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function recordsCopy(locale: string) {
  return employeeCopy(locale, {
    es: {
      emptyPrefix: "Sin",
      emptyBody: "Los nuevos registros aparecerán aquí después de ser confirmados.",
      quotes: "Cotizaciones",
      history: "Historial comercial",
      historyBody: "Consulta borradores, documentos enviados y cotizaciones convertidas.",
      newQuote: "Nueva cotización",
      number: "Número",
      customer: "Cliente",
      seller: "Vendedor",
      date: "Fecha",
      total: "Total",
      status: "Estado",
      quote: "Cotización",
      backQuotes: "Volver a cotizaciones",
      description: "Descripción",
      quantity: "Cantidad",
      unit: "Unitario",
      discount: "Descuento",
      subtotal: "Subtotal",
      notes: "Notas",
      noNotes: "Sin notas.",
      terms: "Términos",
      taxes: "Impuestos",
      availability: "La disponibilidad se confirma cuando los productos son reservados.",
      downloadPdf: "Descargar PDF",
      sharedInventory: "Inventario compartido",
      reservations: "Reservas",
      reservationsBody: "Revisa reservas activas, parciales, vencidas o convertidas en pedido.",
      products: "productos",
      reservation: "Reserva",
      backReservations: "Volver a reservas",
      expires: "vence",
      partial: "Esta reserva es parcial. Revisa los productos afectados antes de continuar.",
      requested: "Solicitado",
      reserved: "Reservado",
      sales: "Ventas",
      orders: "Pedidos",
      ordersBody: "Consulta pedidos confirmados y su estado de pago.",
      order: "Pedido",
      backOrders: "Volver a pedidos",
      viewReceipt: "Ver recibo",
      downloadReceipt: "Descargar recibo PDF",
      receiptPending: "El recibo estará disponible cuando el pedido sea confirmado.",
      receipt: "Recibo",
      backOrder: "Volver al pedido",
      quoteLabel: "Cotización",
      verification: "Referencia verificable",
      download: "Descargar PDF",
    },
    en: {
      emptyPrefix: "No",
      emptyBody: "New records will appear here after confirmation.",
      quotes: "Quotes",
      history: "Commercial history",
      historyBody: "Review drafts, sent documents and converted quotes.",
      newQuote: "New quote",
      number: "Number",
      customer: "Customer",
      seller: "Seller",
      date: "Date",
      total: "Total",
      status: "Status",
      quote: "Quote",
      backQuotes: "Back to quotes",
      description: "Description",
      quantity: "Quantity",
      unit: "Unit price",
      discount: "Discount",
      subtotal: "Subtotal",
      notes: "Notes",
      noNotes: "No notes.",
      terms: "Terms",
      taxes: "Taxes",
      availability: "Availability is confirmed when products are reserved.",
      downloadPdf: "Download PDF",
      sharedInventory: "Shared inventory",
      reservations: "Reservations",
      reservationsBody: "Review active, partial, expired or converted reservations.",
      products: "products",
      reservation: "Reservation",
      backReservations: "Back to reservations",
      expires: "expires",
      partial: "This reservation is partial. Review affected items before continuing.",
      requested: "Requested",
      reserved: "Reserved",
      sales: "Sales",
      orders: "Orders",
      ordersBody: "Review confirmed orders and payment status.",
      order: "Order",
      backOrders: "Back to orders",
      viewReceipt: "View receipt",
      downloadReceipt: "Download receipt PDF",
      receiptPending: "The receipt will be available once the order is confirmed.",
      receipt: "Receipt",
      backOrder: "Back to order",
      quoteLabel: "Quote",
      verification: "Verification reference",
      download: "Download PDF",
    },
    zh: {
      emptyPrefix: "暂无",
      emptyBody: "确认后的新记录将显示在这里。",
      quotes: "报价",
      history: "商务记录",
      historyBody: "查看草稿、已发送文件和已转换报价。",
      newQuote: "新建报价",
      number: "编号",
      customer: "客户",
      seller: "销售人员",
      date: "日期",
      total: "合计",
      status: "状态",
      quote: "报价",
      backQuotes: "返回报价",
      description: "描述",
      quantity: "数量",
      unit: "单价",
      discount: "折扣",
      subtotal: "小计",
      notes: "备注",
      noNotes: "无备注。",
      terms: "条款",
      taxes: "税费",
      availability: "产品预留时确认库存。",
      downloadPdf: "下载 PDF",
      sharedInventory: "共享库存",
      reservations: "预留",
      reservationsBody: "查看有效、部分、过期或已转订单的预留。",
      products: "件产品",
      reservation: "预留",
      backReservations: "返回预留",
      expires: "到期",
      partial: "此预留不完整。继续前请检查受影响的产品。",
      requested: "申请数量",
      reserved: "预留数量",
      sales: "销售",
      orders: "订单",
      ordersBody: "查看已确认订单及付款状态。",
      order: "订单",
      backOrders: "返回订单",
      viewReceipt: "查看收据",
      downloadReceipt: "下载收据 PDF",
      receiptPending: "订单确认后可查看收据。",
      receipt: "收据",
      backOrder: "返回订单",
      quoteLabel: "报价",
      verification: "验证参考",
      download: "下载 PDF",
    },
  });
}

function EmptyRecord({ label, locale }: { label: string; locale: string }) {
  const copy = recordsCopy(locale);
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
      <FileText
        aria-hidden="true"
        className="mx-auto text-slate-300"
        size={42}
      />
      <h2 className="mt-4 text-lg font-semibold">
        {copy.emptyPrefix} {label}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {copy.emptyBody}
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
  const copy = recordsCopy(locale);
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow={copy.quotes}
        title={copy.history}
        body={copy.historyBody}
        actions={
          <Link
            href={`/${locale}/employee/quotes/new`}
            className="focus-ring inline-flex min-h-12 items-center justify-center rounded-lg bg-orange-600 px-5 font-semibold text-white"
          >
            {copy.newQuote}
          </Link>
        }
      />
      {quotes.length ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#062f33] text-xs uppercase text-white">
              <tr>
                <th className="px-5 py-4">{copy.number}</th>
                <th className="px-5 py-4">{copy.customer}</th>
                <th className="px-5 py-4">{copy.seller}</th>
                <th className="px-5 py-4">{copy.date}</th>
                <th className="px-5 py-4">{copy.total}</th>
                <th className="px-5 py-4">{copy.status}</th>
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
                  <td className="px-5 py-4">
                    {date(quote.createdAt, locale)}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {money(quote.total, locale)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={quote.status} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyRecord label={copy.quotes.toLocaleLowerCase()} locale={locale} />
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
  const copy = recordsCopy(locale);
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/${locale}/employee/quotes`}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={18} /> {copy.backQuotes}
      </Link>
      <EmployeePageHeader
        eyebrow={copy.quote}
        title={quote.number}
        body={`${quote.customer.companyOrName} · ${quote.sellerName} · ${quote.sellerEmail}`}
        actions={<StatusBadge status={quote.status} locale={locale} />}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">MPN</th>
                  <th className="px-5 py-4">{copy.description}</th>
                  <th className="px-5 py-4">{copy.quantity}</th>
                  <th className="px-5 py-4">{copy.unit}</th>
                  <th className="px-5 py-4">{copy.discount}</th>
                  <th className="px-5 py-4">{copy.subtotal}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {quote.items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-5 py-4 font-mono font-semibold">
                      {item.mpn}
                    </td>
                    <td className="px-5 py-4">
                      {employeeProductText(locale, item.description)}
                    </td>
                    <td className="px-5 py-4">{item.quantity}</td>
                    <td className="px-5 py-4">
                      {money(item.authorizedUnitPrice, locale)}
                    </td>
                    <td className="px-5 py-4">{item.discountPercent}%</td>
                    <td className="px-5 py-4 font-semibold">
                      {money(item.lineSubtotal, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-stone-200 p-5 text-sm leading-7 text-slate-600">
            <p>
              <strong>{copy.notes}:</strong> {quote.notes || copy.noNotes}
            </p>
            <p>
              <strong>{copy.terms}:</strong> {quote.commercialTerms}
            </p>
          </div>
        </section>
        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>{copy.subtotal}</dt>
              <dd className="font-semibold">
                {money(quote.subtotal, locale)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>{copy.taxes}</dt>
              <dd className="font-semibold">{money(quote.tax, locale)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-4 text-lg">
              <dt className="font-semibold">{copy.total}</dt>
              <dd className="font-bold">{money(quote.total, locale)}</dd>
            </div>
          </dl>
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            {copy.availability}
          </p>
          <div className="mt-5 grid gap-3">
            <a
              href={`/api/employee/quotes/${quote.id}/pdf`}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 font-semibold"
            >
              <Download size={18} />
              {copy.downloadPdf}
            </a>
            <DuplicateQuoteButton quote={quote} locale={locale} />
            <SendQuoteButton quote={quote} locale={locale} />
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
  const copy = recordsCopy(locale);
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow={copy.sharedInventory}
        title={copy.reservations}
        body={copy.reservationsBody}
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
                <StatusBadge status={reservation.status} locale={locale} />
                <span className="text-xs text-slate-500">
                  {reservation.items.length} {copy.products}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyRecord
          label={copy.reservations.toLocaleLowerCase()}
          locale={locale}
        />
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
  const copy = recordsCopy(locale);
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/${locale}/employee/reservations`}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={18} /> {copy.backReservations}
      </Link>
      <EmployeePageHeader
        eyebrow={copy.reservation}
        title={reservation.number}
        body={`${reservation.customer.companyOrName} · ${copy.expires} ${date(
          reservation.expiresAt,
          locale,
        )}`}
        actions={<StatusBadge status={reservation.status} locale={locale} />}
      />
      {reservation.affectedProductIds.length ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          {copy.partial}
        </div>
      ) : null}
      <section className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-[#062f33] text-xs uppercase text-white">
            <tr>
              <th className="px-5 py-4">MPN</th>
              <th className="px-5 py-4">{copy.description}</th>
              <th className="px-5 py-4">{copy.requested}</th>
              <th className="px-5 py-4">{copy.reserved}</th>
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
                <td className="px-5 py-4">
                  {employeeProductText(locale, item.description)}
                </td>
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
          <CancelReservationButton reservation={reservation} locale={locale} />
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
  const copy = recordsCopy(locale);
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow={copy.sales}
        title={copy.orders}
        body={copy.ordersBody}
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
                {money(order.total, locale)}
              </p>
              <div className="mt-4 flex gap-2">
                <StatusBadge status={order.status} locale={locale} />
                <StatusBadge status={order.paymentStatus} locale={locale} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyRecord label={copy.orders.toLocaleLowerCase()} locale={locale} />
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
  const copy = recordsCopy(locale);
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/${locale}/employee/orders`}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={18} /> {copy.backOrders}
      </Link>
      <EmployeePageHeader
        eyebrow={copy.order}
        title={order.number}
        body={`${order.customer.companyOrName} · ${order.reservationNumber}`}
        actions={<StatusBadge status={order.status} locale={locale} />}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#062f33] text-xs uppercase text-white">
              <tr>
                <th className="px-5 py-4">MPN</th>
                <th className="px-5 py-4">{copy.description}</th>
                <th className="px-5 py-4">{copy.quantity}</th>
                <th className="px-5 py-4">{copy.unit}</th>
                <th className="px-5 py-4">{copy.subtotal}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-5 py-4 font-mono font-semibold">
                    {item.mpn}
                  </td>
                  <td className="px-5 py-4">
                    {employeeProductText(locale, item.description)}
                  </td>
                  <td className="px-5 py-4">{item.quantity}</td>
                  <td className="px-5 py-4">
                    {money(item.authorizedUnitPrice, locale)}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {money(item.lineSubtotal, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>{copy.subtotal}</dt>
              <dd className="font-semibold">
                {money(order.subtotal, locale)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>{copy.taxes}</dt>
              <dd className="font-semibold">{money(order.tax, locale)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-4 text-lg">
              <dt className="font-semibold">{copy.total}</dt>
              <dd className="font-bold">{money(order.total, locale)}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status={order.status} locale={locale} />
            <StatusBadge status={order.paymentStatus} locale={locale} />
          </div>
          {receipt && order.status === "confirmed" ? (
            <div className="mt-5 grid gap-3">
              <Link
                href={`/${locale}/employee/receipts/${receipt.id}`}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 font-semibold"
              >
                <ReceiptText size={18} />
                {copy.viewReceipt}
              </Link>
              <a
                href={`/api/employee/orders/${order.id}/receipt`}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 font-semibold text-white"
              >
                <Download size={18} />
                {copy.downloadReceipt}
              </a>
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-950">
              {copy.receiptPending}
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
  const copy = recordsCopy(locale);
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/${locale}/employee/orders/${receipt.orderId}`}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={18} /> {copy.backOrder}
      </Link>
      <EmployeePageHeader
        eyebrow={copy.receipt}
        title={receipt.number}
        body={`${receipt.orderNumber} · ${receipt.order.customer.companyOrName}`}
        actions={
          <StatusBadge status={receipt.order.status} locale={locale} />
        }
      />
      <section className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-500">{copy.order}</span>
            <strong className="mt-1 block">{receipt.orderNumber}</strong>
          </p>
          <p>
            <span className="text-slate-500">{copy.quoteLabel}</span>
            <strong className="mt-1 block">{receipt.order.quoteNumber}</strong>
          </p>
          <p>
            <span className="text-slate-500">{copy.date}</span>
            <strong className="mt-1 block">
              {date(receipt.issuedAt, locale)}
            </strong>
          </p>
          <p>
            <span className="text-slate-500">{copy.customer}</span>
            <strong className="mt-1 block">
              {receipt.order.customer.companyOrName}
            </strong>
          </p>
          <p>
            <span className="text-slate-500">{copy.verification}</span>
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
          {copy.download}
        </a>
      </section>
    </div>
  );
}
