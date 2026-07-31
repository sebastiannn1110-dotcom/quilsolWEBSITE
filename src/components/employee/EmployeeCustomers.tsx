"use client";

import Link from "next/link";
import { Building2, Mail, MapPin, Plus, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { employeeCopy } from "@/lib/platform-api/employee-i18n";
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
  const copy = employeeCopy(locale, {
    es: {
      eyebrow: "Clientes",
      title: "Directorio comercial",
      body: "Consulta clientes, direcciones de entrega y contactos registrados.",
      newCustomer: "Nuevo cliente",
      search: "Buscar cliente",
      placeholder: "Buscar empresa, contacto, email o ciudad…",
      edit: "Editar",
      quote: "Cotizar",
      noResults: "Sin resultados",
      noResultsBody: "Prueba con otro nombre, contacto o ubicación.",
    },
    en: {
      eyebrow: "Customers",
      title: "Commercial directory",
      body: "Review registered customers, delivery addresses and contacts.",
      newCustomer: "New customer",
      search: "Search customers",
      placeholder: "Search company, contact, email or city…",
      edit: "Edit",
      quote: "Create quote",
      noResults: "No results",
      noResultsBody: "Try a different name, contact or location.",
    },
    zh: {
      eyebrow: "客户",
      title: "客户目录",
      body: "查看已登记的客户、交付地址和联系人。",
      newCustomer: "新建客户",
      search: "搜索客户",
      placeholder: "搜索公司、联系人、邮箱或城市…",
      edit: "编辑",
      quote: "创建报价",
      noResults: "没有结果",
      noResultsBody: "请尝试其他名称、联系人或地点。",
    },
  });
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
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        actions={
          <Link
            href={`/${locale}/employee/customers/new`}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-semibold text-white hover:bg-orange-500"
          >
            <Plus aria-hidden="true" size={19} />
            {copy.newCustomer}
          </Link>
        }
      />

      <label className="relative block max-w-2xl">
        <span className="sr-only">{copy.search}</span>
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.placeholder}
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
                  {copy.edit}
                </Link>
                <Link
                  href={`/${locale}/employee/quotes/new?customer=${encodeURIComponent(
                    customer.id,
                  )}`}
                  onClick={() => draft.setCustomerId(customer.id)}
                  className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border border-orange-300 bg-orange-50 px-3 text-center text-sm font-semibold text-orange-800"
                >
                  {copy.quote}
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
          <h2 className="mt-4 text-lg font-semibold">{copy.noResults}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {copy.noResultsBody}
          </p>
        </div>
      )}
    </div>
  );
}
