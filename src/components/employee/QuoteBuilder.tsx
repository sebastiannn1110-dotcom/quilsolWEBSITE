"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  FileDown,
  LoaderCircle,
  Minus,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { commerceClient } from "@/lib/platform-api/client";
import { maximumDiscountByRole } from "@/lib/platform-api/permissions";
import type { Customer, EmployeeSession } from "@/lib/platform-api/types";
import { EmployeePageHeader } from "./EmployeeShell";
import { useQuoteDraft } from "./QuoteDraftProvider";

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function QuoteBuilder({
  customers,
  session,
  locale,
  initialValidUntil,
}: {
  customers: Customer[];
  session: EmployeeSession;
  locale: string;
  initialValidUntil: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draft = useQuoteDraft();
  const customerId =
    draft.customerId ||
    searchParams.get("customer") ||
    customers[0]?.id ||
    "";
  const [validUntil, setValidUntil] = useState(initialValidUntil);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "Pago y entrega sujetos a confirmación de la plataforma.",
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const maxDiscount = maximumDiscountByRole[session.role];

  const totals = useMemo(() => {
    const subtotal = draft.items.reduce(
      (sum, item) =>
        sum +
        item.authorizedUnitPrice *
          item.quantity *
          (1 - item.discountPercent / 100),
      0,
    );
    const tax = subtotal * 0.07;
    return { subtotal, tax, total: subtotal + tax };
  }, [draft.items]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!navigator.onLine) {
      setMessage(
        "Sin conexión: puedes conservar el borrador, pero no guardarlo como cotización.",
      );
      return;
    }
    if (!customerId || !draft.items.length) {
      setMessage("Selecciona un cliente y agrega al menos un producto.");
      return;
    }
    if (
      draft.items.some(
        (item) =>
          item.quantity < 1 ||
          item.quantity > 100_000 ||
          item.discountPercent > maxDiscount,
      )
    ) {
      setMessage(
        `Revisa cantidades y descuentos. Tu límite es ${maxDiscount}%.`,
      );
      return;
    }

    setPending(true);
    setMessage("");
    try {
      const quote = await commerceClient.createQuote({
        customerId,
        items: draft.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discountPercent: item.discountPercent,
        })),
        validUntil,
        notes,
        commercialTerms: terms,
      });
      draft.clear();
      router.push(`/${locale}/employee/quotes/${quote.id}`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible guardar la cotización.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow="Constructor B2B"
        title="Nueva cotización"
        body="El total visible es una previsualización. El servidor vuelve a validar precio, descuento, impuestos y disponibilidad."
        actions={
          <Link
            href={`/${locale}/employee/catalog`}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 font-semibold"
          >
            <Plus aria-hidden="true" size={19} />
            Agregar productos
          </Link>
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                Cliente
                <select
                  value={customerId}
                  onChange={(event) =>
                    draft.setCustomerId(event.target.value)
                  }
                  required
                  className="focus-ring min-h-12 rounded-lg border border-slate-300 bg-white px-4 font-normal"
                >
                  <option value="">Selecciona un cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyOrName} — {customer.contact}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Vigencia
                <input
                  type="date"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                  required
                  className="focus-ring min-h-12 rounded-lg border border-slate-300 px-4 font-normal"
                />
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 p-5">
              <div>
                <h2 className="text-lg font-semibold">Productos</h2>
                <p className="mt-1 text-sm text-slate-500">
                  MPN se conserva como texto, incluidos ceros y guiones.
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold">
                {draft.items.length}
              </span>
            </div>
            {draft.items.length ? (
              <div className="divide-y divide-stone-100">
                {draft.items.map((item) => {
                  const line =
                    item.authorizedUnitPrice *
                    item.quantity *
                    (1 - item.discountPercent / 100);
                  return (
                    <article
                      key={item.productId}
                      className={`grid gap-4 p-4 sm:p-5 xl:grid-cols-[1fr_150px_130px_130px_48px] xl:items-center ${
                        item.quantity > item.availableQuantity
                          ? "bg-amber-50"
                          : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold text-cyan-800">
                          {item.mpn}
                        </p>
                        <h3 className="mt-1 font-semibold">
                          {item.description}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.manufacturer} · {item.availableQuantity} visibles
                        </p>
                        {item.quantity > item.availableQuantity ? (
                          <p className="mt-2 flex gap-2 text-xs font-semibold text-amber-900">
                            <AlertTriangle size={15} />
                            Cantidad superior a la disponibilidad visible.
                          </p>
                        ) : null}
                      </div>
                      <label className="grid gap-1 text-xs font-semibold text-slate-500">
                        Cantidad
                        <span className="flex">
                          <button
                            type="button"
                            onClick={() =>
                              draft.setQuantity(
                                item.productId,
                                item.quantity - 1,
                              )
                            }
                            className="focus-ring flex h-11 w-11 items-center justify-center rounded-l-lg border border-slate-300"
                            aria-label={`Reducir ${item.mpn}`}
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={100000}
                            value={item.quantity}
                            onChange={(event) =>
                              draft.setQuantity(
                                item.productId,
                                Number(event.target.value),
                              )
                            }
                            className="focus-ring h-11 w-16 border-y border-slate-300 text-center"
                            aria-label={`Cantidad ${item.mpn}`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              draft.setQuantity(
                                item.productId,
                                item.quantity + 1,
                              )
                            }
                            className="focus-ring flex h-11 w-11 items-center justify-center rounded-r-lg border border-slate-300"
                            aria-label={`Aumentar ${item.mpn}`}
                          >
                            <Plus size={16} />
                          </button>
                        </span>
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-slate-500">
                        Descuento (máx. {maxDiscount}%)
                        <input
                          type="number"
                          min={0}
                          max={maxDiscount}
                          step={0.5}
                          value={item.discountPercent}
                          onChange={(event) =>
                            draft.setDiscount(
                              item.productId,
                              Number(event.target.value),
                            )
                          }
                          className="focus-ring h-11 rounded-lg border border-slate-300 px-3 text-slate-950"
                        />
                      </label>
                      <div>
                        <p className="text-xs text-slate-500">
                          {money(item.authorizedUnitPrice)} c/u
                        </p>
                        <p className="mt-1 font-semibold">{money(line)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => draft.removeProduct(item.productId)}
                        className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 text-red-700"
                        aria-label={`Eliminar ${item.mpn}`}
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center">
                <ShoppingCart
                  aria-hidden="true"
                  className="mx-auto text-slate-300"
                  size={42}
                />
                <h2 className="mt-4 font-semibold">Cotización vacía</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Agrega productos desde el catálogo comercial.
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Notas
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                maxLength={2000}
                className="focus-ring rounded-lg border border-slate-300 p-4 font-normal"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Términos comerciales
              <textarea
                value={terms}
                onChange={(event) => setTerms(event.target.value)}
                rows={4}
                maxLength={3000}
                className="focus-ring rounded-lg border border-slate-300 p-4 font-normal"
              />
            </label>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5 shadow-sm 2xl:sticky 2xl:top-24">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Vendedor</dt>
              <dd className="text-right font-semibold">{session.fullName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Moneda</dt>
              <dd className="font-semibold">USD</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-stone-100 pt-3">
              <dt>Subtotal</dt>
              <dd className="font-semibold">{money(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Impuestos estimados (7%)</dt>
              <dd className="font-semibold">{money(totals.tax)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-stone-200 pt-4 text-lg">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold">{money(totals.total)}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            Esta cotización no garantiza disponibilidad de inventario hasta que
            los productos sean apartados.
          </div>
          {draft.requiresReconfirmation ? (
            <button
              type="button"
              onClick={draft.confirmInventory}
              className="focus-ring mt-4 min-h-11 w-full rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-950"
            >
              Revisé los cambios de inventario
            </button>
          ) : null}
          {message ? (
            <p
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              role="alert"
            >
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || !draft.items.length}
            className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-semibold text-white disabled:bg-slate-300"
          >
            {pending ? (
              <LoaderCircle className="animate-spin" size={19} />
            ) : (
              <Save size={19} />
            )}
            {pending ? "Validando…" : "Guardar borrador"}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 text-sm font-semibold"
              onClick={() =>
                setMessage(
                  "Previsualización lista. Guarda el borrador para generar el PDF.",
                )
              }
            >
              <Eye size={17} />
              Vista previa
            </button>
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 text-sm font-semibold text-slate-400"
              title="Disponible después de guardar"
            >
              <FileDown size={17} />
              PDF
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}
