import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  FilePlus2,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  TriangleAlert,
  Users,
} from "lucide-react";
import type {
  EmployeeDashboard as DashboardData,
  EmployeeSession,
} from "@/lib/platform-api/types";
import {
  EmployeePageHeader,
  StatusBadge,
} from "./EmployeeShell";

function date(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function currency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

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
  const metrics = [
    {
      label: "Cotizaciones del mes",
      value: data.metrics.quotesThisMonth,
      icon: FilePlus2,
    },
    {
      label: "Reservas activas",
      value: data.metrics.activeReservations,
      icon: ClipboardCheck,
    },
    {
      label: "Pedidos confirmados",
      value: data.metrics.confirmedOrders,
      icon: ShoppingBag,
    },
    {
      label: "Conversión",
      value: `${data.metrics.conversionRate}%`,
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow="Panel del vendedor"
        title={`Hola, ${session.fullName}`}
        body="Revisa el movimiento comercial, prepara una cotización y confirma la disponibilidad antes de cada reserva."
        actions={
          <Link
            href={`${base}/quotes/new`}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-semibold text-white hover:bg-orange-500"
          >
            <FilePlus2 aria-hidden="true" size={19} />
            Nueva cotización
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-40" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-600" />
          </span>
          <span>
            <strong>{data.platform.label}</strong> · último chequeo{" "}
            {new Intl.DateTimeFormat("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(data.platform.checkedAt))}
          </span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
          {data.platform.mode === "mock" ? "Prueba local" : "Conectado"}
        </span>
      </div>

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

      <section>
        <h2 className="text-xl font-semibold">Accesos rápidos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: `${base}/catalog`,
              label: "Buscar producto",
              detail: "MPN, fabricante o categoría",
              icon: Boxes,
            },
            {
              href: `${base}/customers/new`,
              label: "Crear cliente",
              detail: "Registro comercial sintético",
              icon: Users,
            },
            {
              href: `${base}/quotes/new`,
              label: "Crear cotización",
              detail: "Precios autorizados",
              icon: FilePlus2,
            },
            {
              href: `${base}/reservations`,
              label: "Revisar reservas",
              detail: "Disponibilidad compartida",
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
            <h2 className="text-lg font-semibold">Cotizaciones recientes</h2>
            <Link
              href={`${base}/quotes`}
              className="focus-ring rounded-md px-2 py-2 text-sm font-semibold text-orange-700"
            >
              Ver todas
            </Link>
          </div>
          {data.recentQuotes.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Número</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Estado</th>
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
                      <td className="px-5 py-4">{date(quote.createdAt)}</td>
                      <td className="px-5 py-4 font-semibold">
                        {currency(quote.total)}
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
            <p className="p-6 text-sm text-slate-500">
              Todavía no hay cotizaciones para mostrar.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Alertas de inventario</h2>
            <RefreshCw aria-hidden="true" size={18} className="text-slate-400" />
          </div>
          <div className="mt-4 space-y-3">
            {data.inventoryAlerts.length ? (
              data.inventoryAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950"
                >
                  <TriangleAlert
                    aria-hidden="true"
                    size={18}
                    className="mt-1 shrink-0"
                  />
                  <span>{alert.message}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Sin alertas visibles para tu rol.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
