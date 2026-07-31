import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  FilePlus2,
  PackageCheck,
  ShoppingBag,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  employeeCopy,
  employeeIntlLocale,
  employeeStatusLabel,
} from "@/lib/platform-api/employee-i18n";
import type {
  EmployeeDashboard as DashboardData,
  EmployeeSession,
} from "@/lib/platform-api/types";
import { EmployeePageHeader, StatusBadge } from "./EmployeeShell";

export function EmployeeDashboard({
  data,
  locale,
  session,
}: {
  data: DashboardData;
  locale: string;
  session: EmployeeSession;
}) {
  const base = `/${locale}/employee`;
  const intlLocale = employeeIntlLocale(locale);
  const copy = employeeCopy(locale, {
    es: {
      eyebrow: "Panel comercial",
      hello: "Hola",
      body: "Revisa el movimiento comercial, prepara cotizaciones y acompaña cada pedido.",
      newQuote: "Nueva cotización",
      quotesMonth: "Cotizaciones del mes",
      activeReservations: "Reservas activas",
      confirmedOrders: "Pedidos confirmados",
      conversion: "Conversión",
      activity: "Actividad reciente",
      quote: "Cotización",
      reservation: "Reserva",
      order: "Pedido",
      noActivity: "La actividad comercial aparecerá aquí.",
      quick: "Accesos rápidos",
      findProduct: "Buscar producto",
      findProductDetail: "MPN, fabricante o categoría",
      createCustomer: "Crear cliente",
      createCustomerDetail: "Datos comerciales y de entrega",
      createQuote: "Crear cotización",
      createQuoteDetail: "Precios autorizados",
      reviewReservations: "Revisar reservas",
      reviewReservationsDetail: "Disponibilidad compartida",
      recentQuotes: "Cotizaciones recientes",
      viewAll: "Ver todas",
      number: "Número",
      customer: "Cliente",
      date: "Fecha",
      total: "Total",
      status: "Estado",
      noQuotes: "Todavía no hay cotizaciones para mostrar.",
      inventoryAlerts: "Alertas de inventario",
      noAlerts: "Sin alertas visibles para tu rol.",
      currentAvailability: "disponibilidad actual",
    },
    en: {
      eyebrow: "Commercial dashboard",
      hello: "Hello",
      body: "Review commercial activity, prepare quotes and track every order.",
      newQuote: "New quote",
      quotesMonth: "Quotes this month",
      activeReservations: "Active reservations",
      confirmedOrders: "Confirmed orders",
      conversion: "Conversion",
      activity: "Recent activity",
      quote: "Quote",
      reservation: "Reservation",
      order: "Order",
      noActivity: "Commercial activity will appear here.",
      quick: "Quick actions",
      findProduct: "Find product",
      findProductDetail: "MPN, manufacturer or category",
      createCustomer: "Create customer",
      createCustomerDetail: "Commercial and delivery details",
      createQuote: "Create quote",
      createQuoteDetail: "Authorized pricing",
      reviewReservations: "Review reservations",
      reviewReservationsDetail: "Shared availability",
      recentQuotes: "Recent quotes",
      viewAll: "View all",
      number: "Number",
      customer: "Customer",
      date: "Date",
      total: "Total",
      status: "Status",
      noQuotes: "There are no quotes to display yet.",
      inventoryAlerts: "Inventory alerts",
      noAlerts: "No alerts are visible for your role.",
      currentAvailability: "current availability",
    },
    zh: {
      eyebrow: "商务仪表板",
      hello: "您好",
      body: "查看商务动态、准备报价并跟踪每个订单。",
      newQuote: "新建报价",
      quotesMonth: "本月报价",
      activeReservations: "有效预留",
      confirmedOrders: "已确认订单",
      conversion: "转化率",
      activity: "最近活动",
      quote: "报价",
      reservation: "预留",
      order: "订单",
      noActivity: "商务活动将显示在这里。",
      quick: "快捷操作",
      findProduct: "查找产品",
      findProductDetail: "MPN、制造商或类别",
      createCustomer: "新建客户",
      createCustomerDetail: "商业及交付信息",
      createQuote: "创建报价",
      createQuoteDetail: "授权价格",
      reviewReservations: "查看预留",
      reviewReservationsDetail: "共享库存",
      recentQuotes: "最近报价",
      viewAll: "查看全部",
      number: "编号",
      customer: "客户",
      date: "日期",
      total: "合计",
      status: "状态",
      noQuotes: "暂无报价。",
      inventoryAlerts: "库存提醒",
      noAlerts: "您的角色当前没有可见提醒。",
      currentAvailability: "当前可用库存",
    },
  });
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium" }).format(
      new Date(value),
    );
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "USD",
    }).format(value);
  const metrics = [
    {
      label: copy.quotesMonth,
      value: data.metrics.quotesThisMonth,
      icon: FilePlus2,
    },
    {
      label: copy.activeReservations,
      value: data.metrics.activeReservations,
      icon: ClipboardCheck,
    },
    {
      label: copy.confirmedOrders,
      value: data.metrics.confirmedOrders,
      icon: ShoppingBag,
    },
    {
      label: copy.conversion,
      value: `${data.metrics.conversionRate}%`,
      icon: CircleDollarSign,
    },
  ];
  const activities = [
    ...data.recentQuotes.map((quote) => ({
      id: `quote-${quote.id}`,
      href: `${base}/quotes/${quote.id}`,
      label: `${copy.quote} ${quote.number}`,
      detail: employeeStatusLabel(locale, quote.status),
      at: quote.updatedAt,
    })),
    ...data.activeReservations.map((reservation) => ({
      id: `reservation-${reservation.id}`,
      href: `${base}/reservations/${reservation.id}`,
      label: `${copy.reservation} ${reservation.number}`,
      detail: employeeStatusLabel(locale, reservation.status),
      at: reservation.createdAt,
    })),
    ...data.recentOrders.map((order) => ({
      id: `order-${order.id}`,
      href: `${base}/orders/${order.id}`,
      label: `${copy.order} ${order.number}`,
      detail: employeeStatusLabel(locale, order.status),
      at: order.confirmedAt || order.createdAt,
    })),
  ]
    .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
    .slice(0, 6);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow={copy.eyebrow}
        title={`${copy.hello}, ${session.fullName}`}
        body={copy.body}
        actions={
          <Link
            href={`${base}/quotes/new`}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-semibold text-white hover:bg-orange-500"
          >
            <FilePlus2 aria-hidden="true" size={19} />
            {copy.newQuote}
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                <Icon aria-hidden="true" size={20} />
              </div>
              <p className="mt-5 text-2xl font-semibold sm:text-3xl">
                {metric.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {metric.label}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{copy.activity}</h2>
        {activities.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={activity.href}
                className="focus-ring rounded-lg border border-stone-200 p-4 transition hover:border-orange-300"
              >
                <strong className="block">{activity.label}</strong>
                <span className="mt-1 block text-sm text-slate-600">
                  {activity.detail} · {formatDate(activity.at)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{copy.noActivity}</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">{copy.quick}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: `${base}/catalog`,
              label: copy.findProduct,
              detail: copy.findProductDetail,
              icon: Boxes,
            },
            {
              href: `${base}/customers/new`,
              label: copy.createCustomer,
              detail: copy.createCustomerDetail,
              icon: Users,
            },
            {
              href: `${base}/quotes/new`,
              label: copy.createQuote,
              detail: copy.createQuoteDetail,
              icon: FilePlus2,
            },
            {
              href: `${base}/reservations`,
              label: copy.reviewReservations,
              detail: copy.reviewReservationsDetail,
              icon: PackageCheck,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring group flex min-h-24 items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-orange-300"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#062f33] text-white">
                  <Icon aria-hidden="true" size={21} />
                </span>
                <span className="min-w-0">
                  <strong className="block">{item.label}</strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {item.detail}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  size={18}
                  className="ml-auto shrink-0 text-slate-400 group-hover:text-orange-600"
                />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 p-5">
            <h2 className="text-lg font-semibold">{copy.recentQuotes}</h2>
            <Link
              href={`${base}/quotes`}
              className="focus-ring rounded-md px-2 py-2 text-sm font-semibold text-orange-700"
            >
              {copy.viewAll}
            </Link>
          </div>
          {data.recentQuotes.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{copy.number}</th>
                    <th className="px-5 py-3">{copy.customer}</th>
                    <th className="px-5 py-3">{copy.date}</th>
                    <th className="px-5 py-3">{copy.total}</th>
                    <th className="px-5 py-3">{copy.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.recentQuotes.map((quote) => (
                    <tr key={quote.id}>
                      <td className="px-5 py-4">
                        <Link
                          href={`${base}/quotes/${quote.id}`}
                          className="font-semibold text-orange-700"
                        >
                          {quote.number}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        {quote.customer.companyOrName}
                      </td>
                      <td className="px-5 py-4">{formatDate(quote.createdAt)}</td>
                      <td className="px-5 py-4 font-semibold">
                        {formatCurrency(quote.total)}
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
            <p className="p-6 text-sm text-slate-500">{copy.noQuotes}</p>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{copy.inventoryAlerts}</h2>
          <div className="mt-4 space-y-3">
            {data.inventoryAlerts.length ? (
              data.inventoryAlerts.map((alert) => {
                const product = data.lowStockProducts.find(
                  (item) => item.id === alert.productId,
                );
                return (
                  <div
                    key={alert.id}
                    className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950"
                  >
                    <TriangleAlert
                      aria-hidden="true"
                      size={18}
                      className="mt-1 shrink-0"
                    />
                    <span>
                      {product
                        ? `${product.mpn}: ${copy.currentAvailability} ${product.availability.availableQuantity}.`
                        : alert.message}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">{copy.noAlerts}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
