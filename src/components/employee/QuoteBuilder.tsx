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
  Sparkles,
  Trash2,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { commerceClient } from "@/lib/platform-api/client";
import {
  employeeCopy,
  employeeIntlLocale,
  employeeProductText,
} from "@/lib/platform-api/employee-i18n";
import { maximumDiscountByRole } from "@/lib/platform-api/permissions";
import type { Customer, EmployeeSession } from "@/lib/platform-api/types";
import { EmployeePageHeader } from "./EmployeeShell";
import { useQuoteDraft } from "./QuoteDraftProvider";

function money(value: number, locale: string) {
  return new Intl.NumberFormat(employeeIntlLocale(locale), {
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
  const copy = employeeCopy(locale, {
    es: {
      defaultTerms: "Pago y entrega sujetos a confirmación.",
      offline: "Sin conexión: el borrador se conserva, pero no puede guardarse.",
      missing: "Selecciona un cliente y agrega al menos un producto.",
      limits: "Revisa cantidades y descuentos. Tu límite es",
      saveError: "No fue posible guardar la cotización.",
      eyebrow: "Cotizaciones",
      title: "Nueva cotización",
      body: "Prepara la propuesta comercial. Precio, descuento, impuestos y disponibilidad se validan al guardar.",
      addProducts: "Agregar productos",
      customer: "Cliente",
      selectCustomer: "Selecciona un cliente",
      validity: "Vigencia",
      products: "Productos",
      mpnHelp: "El MPN se conserva como texto, incluidos ceros y guiones.",
      visible: "visibles",
      stockWarning: "Cantidad superior a la disponibilidad visible.",
      quantity: "Cantidad",
      reduce: "Reducir",
      increase: "Aumentar",
      discount: "Descuento",
      max: "máx.",
      each: "c/u",
      remove: "Eliminar",
      empty: "Cotización vacía",
      emptyBody: "Agrega productos desde el catálogo comercial.",
      notes: "Notas",
      terms: "Términos comerciales",
      summary: "Resumen",
      seller: "Vendedor",
      sellerEmail: "Correo",
      currency: "Moneda",
      subtotal: "Subtotal",
      taxes: "Impuestos estimados (7%)",
      total: "Total",
      availability:
        "La disponibilidad se confirma cuando los productos son reservados.",
      reviewed: "Revisé los cambios de inventario",
      validating: "Validando…",
      save: "Guardar cotización",
      previewReady: "Vista previa lista. Guarda la cotización para generar el PDF.",
      preview: "Vista previa",
      afterSave: "Disponible después de guardar",
      assistantTitle: "Compra asistida por IA",
      assistantBody:
        "El producto fue agregado con su cantidad mínima recomendada. Selecciona el cliente y revisa la disponibilidad para completar la compra.",
    },
    en: {
      defaultTerms: "Payment and delivery subject to confirmation.",
      offline: "Offline: the draft is preserved, but it cannot be saved.",
      missing: "Select a customer and add at least one product.",
      limits: "Review quantities and discounts. Your limit is",
      saveError: "Unable to save the quote.",
      eyebrow: "Quotes",
      title: "New quote",
      body: "Prepare the commercial proposal. Pricing, discounts, taxes and availability are validated when saving.",
      addProducts: "Add products",
      customer: "Customer",
      selectCustomer: "Select a customer",
      validity: "Valid until",
      products: "Products",
      mpnHelp: "MPNs are preserved as text, including leading zeros and hyphens.",
      visible: "available",
      stockWarning: "Quantity exceeds visible availability.",
      quantity: "Quantity",
      reduce: "Decrease",
      increase: "Increase",
      discount: "Discount",
      max: "max.",
      each: "each",
      remove: "Remove",
      empty: "Empty quote",
      emptyBody: "Add products from the commercial catalog.",
      notes: "Notes",
      terms: "Commercial terms",
      summary: "Summary",
      seller: "Seller",
      sellerEmail: "Email",
      currency: "Currency",
      subtotal: "Subtotal",
      taxes: "Estimated tax (7%)",
      total: "Total",
      availability: "Availability is confirmed when products are reserved.",
      reviewed: "I reviewed the inventory changes",
      validating: "Validating…",
      save: "Save quote",
      previewReady: "Preview ready. Save the quote to generate the PDF.",
      preview: "Preview",
      afterSave: "Available after saving",
      assistantTitle: "AI-assisted purchase",
      assistantBody:
        "The product was added with its recommended minimum quantity. Select the customer and review availability to complete the purchase.",
    },
    zh: {
      defaultTerms: "付款和交付须经确认。",
      offline: "当前离线：草稿会保留，但无法保存。",
      missing: "请选择客户并至少添加一件产品。",
      limits: "请检查数量和折扣。您的上限为",
      saveError: "无法保存报价。",
      eyebrow: "报价",
      title: "新建报价",
      body: "准备商务报价。保存时将验证价格、折扣、税费和库存。",
      addProducts: "添加产品",
      customer: "客户",
      selectCustomer: "选择客户",
      validity: "有效期",
      products: "产品",
      mpnHelp: "MPN 按文本保留，包括前导零和连字符。",
      visible: "可用",
      stockWarning: "数量超过当前可用库存。",
      quantity: "数量",
      reduce: "减少",
      increase: "增加",
      discount: "折扣",
      max: "最高",
      each: "每件",
      remove: "删除",
      empty: "报价为空",
      emptyBody: "请从商务产品目录添加产品。",
      notes: "备注",
      terms: "商务条款",
      summary: "汇总",
      seller: "销售人员",
      sellerEmail: "电子邮箱",
      currency: "币种",
      subtotal: "小计",
      taxes: "预估税费 (7%)",
      total: "合计",
      availability: "产品预留时确认库存。",
      reviewed: "我已检查库存变化",
      validating: "正在验证…",
      save: "保存报价",
      previewReady: "预览已准备。保存报价后可生成 PDF。",
      preview: "预览",
      afterSave: "保存后可用",
      assistantTitle: "AI 辅助采购",
      assistantBody:
        "产品已按建议的最低数量添加。请选择客户并检查库存以完成采购。",
    },
  });
  const customerId =
    draft.customerId ||
    searchParams.get("customer") ||
    customers[0]?.id ||
    "";
  const [validUntil, setValidUntil] = useState(initialValidUntil);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    copy.defaultTerms,
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const maxDiscount = maximumDiscountByRole[session.role];
  const assistedPurchase = searchParams.get("assistant") === "1";

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
        copy.offline,
      );
      return;
    }
    if (!customerId || !draft.items.length) {
      setMessage(copy.missing);
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
        `${copy.limits} ${maxDiscount}%.`,
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
          : copy.saveError,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        actions={
          <Link
            href={`/${locale}/employee/catalog`}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 font-semibold"
          >
            <Plus aria-hidden="true" size={19} />
            {copy.addProducts}
          </Link>
        }
      />

      {assistedPurchase ? (
        <section className="flex gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
          <Sparkles aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
          <div>
            <strong className="block">{copy.assistantTitle}</strong>
            <span>{copy.assistantBody}</span>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                {copy.customer}
                <select
                  value={customerId}
                  onChange={(event) =>
                    draft.setCustomerId(event.target.value)
                  }
                  required
                  className="focus-ring min-h-12 rounded-lg border border-slate-300 bg-white px-4 font-normal"
                >
                  <option value="">{copy.selectCustomer}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyOrName} — {customer.contact}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                {copy.validity}
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
                <h2 className="text-lg font-semibold">{copy.products}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {copy.mpnHelp}
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
                          {employeeProductText(locale, item.description)}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.manufacturer} · {item.availableQuantity}{" "}
                          {copy.visible}
                        </p>
                        {item.quantity > item.availableQuantity ? (
                          <p className="mt-2 flex gap-2 text-xs font-semibold text-amber-900">
                            <AlertTriangle size={15} />
                            {copy.stockWarning}
                          </p>
                        ) : null}
                      </div>
                      <label className="grid gap-1 text-xs font-semibold text-slate-500">
                        {copy.quantity}
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
                            aria-label={`${copy.reduce} ${item.mpn}`}
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
                            aria-label={`${copy.quantity} ${item.mpn}`}
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
                            aria-label={`${copy.increase} ${item.mpn}`}
                          >
                            <Plus size={16} />
                          </button>
                        </span>
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-slate-500">
                        {copy.discount} ({copy.max} {maxDiscount}%)
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
                          {money(item.authorizedUnitPrice, locale)} {copy.each}
                        </p>
                        <p className="mt-1 font-semibold">
                          {money(line, locale)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => draft.removeProduct(item.productId)}
                        className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 text-red-700"
                        aria-label={`${copy.remove} ${item.mpn}`}
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
                <h2 className="mt-4 font-semibold">{copy.empty}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {copy.emptyBody}
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              {copy.notes}
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                maxLength={2000}
                className="focus-ring rounded-lg border border-slate-300 p-4 font-normal"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              {copy.terms}
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
          <h2 className="text-lg font-semibold">{copy.summary}</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{copy.seller}</dt>
              <dd className="text-right font-semibold">{session.fullName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{copy.sellerEmail}</dt>
              <dd className="break-all text-right text-xs font-semibold">
                {session.email}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{copy.currency}</dt>
              <dd className="font-semibold">USD</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-stone-100 pt-3">
              <dt>{copy.subtotal}</dt>
              <dd className="font-semibold">
                {money(totals.subtotal, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{copy.taxes}</dt>
              <dd className="font-semibold">{money(totals.tax, locale)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-stone-200 pt-4 text-lg">
              <dt className="font-semibold">{copy.total}</dt>
              <dd className="font-bold">{money(totals.total, locale)}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            {copy.availability}
          </div>
          {draft.requiresReconfirmation ? (
            <button
              type="button"
              onClick={draft.confirmInventory}
              className="focus-ring mt-4 min-h-11 w-full rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-950"
            >
              {copy.reviewed}
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
            {pending ? copy.validating : copy.save}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 text-sm font-semibold"
              onClick={() =>
                setMessage(
                  copy.previewReady,
                )
              }
            >
              <Eye size={17} />
              {copy.preview}
            </button>
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 text-sm font-semibold text-slate-400"
              title={copy.afterSave}
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
