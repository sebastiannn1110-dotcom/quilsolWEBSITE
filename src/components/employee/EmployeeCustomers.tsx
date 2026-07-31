"use client";

import Link from "next/link";
import { Building2, Mail, MapPin, Plus, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer } from "@/lib/platform-api/types";
import { EmployeePageHeader } from "./EmployeeShell";
import { useQuoteDraft } from "./QuoteDraftProvider";

export function EmployeeCustomers({
  customers,
  locale,
}: {
  customers: Customer[];
  locale: string;
}) {
  const draft = useQuoteDraft();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return customers;
    return customers.filter((customer) =>
      [
        customer.companyOrName,
        customer.contact,
        customer.email,
        customer.city,
        customer.country,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [customers, query]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow="Clientes"
        title="Directorio comercial"
        body="Selecciona un cliente reciente o registra uno nuevo. En esta fase todos los registros son sintéticos."
        actions={
          <Link
            href={`/${locale}/employee/customers/new`}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-semibold text-white hover:bg-orange-500"
          >
            <Plus aria-hidden="true" size={19} />
            Nuevo cliente
          </Link>
        }
      />

      <label className="relative block max-w-2xl">
        <span className="sr-only">Buscar cliente</span>
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar empresa, contacto, email o ciudad…"
          className="focus-ring h-14 w-full rounded-xl border border-stone-200 bg-white pl-12 pr-4 shadow-sm"
        />
      </label>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer) => (
            <article
              key={customer.id}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#062f33] text-white">
                  <Building2 aria-hidden="true" size={22} />
                </span>
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-lg font-semibold">
                    {customer.companyOrName}
                  </h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <UserRound aria-hidden="true" size={15} />
                    {customer.contact}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3 border-t border-stone-100 pt-4 text-sm text-slate-600">
                <p className="flex items-start gap-2">
                  <Mail aria-hidden="true" size={16} className="mt-0.5" />
                  <span className="break-all">{customer.email}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin aria-hidden="true" size={16} className="mt-0.5" />
                  {customer.city}, {customer.country}
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  href={`/${locale}/employee/customers/${customer.id}`}
                  className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-300 px-3 text-sm font-semibold text-slate-700"
                >
                  Editar
                </Link>
                <Link
                  href={`/${locale}/employee/quotes/new?customer=${encodeURIComponent(
                    customer.id,
                  )}`}
                  onClick={() => draft.setCustomerId(customer.id)}
                  className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border border-orange-300 bg-orange-50 px-3 text-center text-sm font-semibold text-orange-800"
                >
                  Cotizar
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <Building2
            aria-hidden="true"
            className="mx-auto text-slate-300"
            size={42}
          />
          <h2 className="mt-4 text-lg font-semibold">Sin resultados</h2>
          <p className="mt-2 text-sm text-slate-500">
            Prueba con otro nombre, contacto o ubicación.
          </p>
        </div>
      )}
    </div>
  );
}
