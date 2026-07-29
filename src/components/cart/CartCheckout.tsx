"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/constants";
import type { CommerceCopy } from "@/lib/commerce-copy";
import {
  CHECKOUT_STORAGE_KEY,
  PENDING_ORDER_STORAGE_KEY,
  type CartItem,
  addCartProduct,
  cartItemCount,
  readCart,
  writeCart,
} from "@/lib/cart";
import { localizedPath } from "@/lib/dictionary";

type CheckoutDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
};

const emptyDraft: CheckoutDraft = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  country: "",
  address: "",
  city: "",
  postalCode: "",
  notes: "",
};

function readCheckoutDraft() {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(CHECKOUT_STORAGE_KEY) || "{}",
    );
    return { ...emptyDraft, ...value } as CheckoutDraft;
  } catch {
    return emptyDraft;
  }
}

function formatMoney(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

export function CartCheckout({
  locale,
  copy,
  initialProduct,
}: {
  locale: Locale;
  copy: CommerceCopy["cart"];
  initialProduct: CartItem | null;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [draft, setDraft] = useState<CheckoutDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const timer = window.setTimeout(() => {
      let nextItems = readCart();

      if (initialProduct) {
        nextItems = addCartProduct(nextItems, initialProduct);
        writeCart(nextItems);
        setAdded(true);
        window.history.replaceState({}, "", localizedPath(locale, "/cart"));
      }

      setItems(nextItems);
      setDraft(readCheckoutDraft());
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialProduct, locale]);

  const itemCount = cartItemCount(items);
  const pricedItems = items.filter(
    (item) => item.price != null && item.priceVisibility === "public",
  );
  const quoteRequired = pricedItems.length !== items.length;
  const totals = useMemo(() => {
    const values = new Map<string, number>();

    for (const item of pricedItems) {
      const currency = item.currency || "USD";
      values.set(
        currency,
        (values.get(currency) || 0) + (item.price || 0) * item.quantity,
      );
    }

    return [...values.entries()];
  }, [pricedItems]);

  const updateItems = (nextItems: CartItem[]) => {
    setItems(nextItems);
    writeCart(nextItems);
    setSaved(false);
  };

  const updateQuantity = (id: string, quantity: number) => {
    updateItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(
                item.minimumOrderQuantity || 1,
                Math.floor(quantity),
              ),
            }
          : item,
      ),
    );
  };

  const updateDraft = (field: keyof CheckoutDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const submitOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(draft));
    window.localStorage.setItem(
      PENDING_ORDER_STORAGE_KEY,
      JSON.stringify({
        customer: draft,
        items,
        createdAt: new Date().toISOString(),
        paymentStatus: "stripe_pending_configuration",
      }),
    );
    setSaved(true);
  };

  return (
    <section className="section-y bg-slate-50">
      <div className="container-page space-y-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-700">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950 md:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
            {copy.body}
          </p>
        </div>

        {added ? (
          <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            {copy.added}
          </div>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-slate-700">
                {itemCount} {itemCount === 1 ? copy.item : copy.items}
              </p>
              <Link
                href={localizedPath(locale, "/catalog")}
                className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-orange-500 hover:text-orange-700"
              >
                {copy.continueShopping}
              </Link>
            </div>

            {!ready ? (
              <div className="h-40 animate-pulse rounded-md bg-slate-200" />
            ) : items.length ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[112px_1fr_auto] sm:items-center"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.imageAlt}
                          fill
                          unoptimized
                          sizes="112px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <ShoppingBag aria-hidden="true" className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                        {item.brand}
                      </p>
                      <h2 className="mt-1 line-clamp-2 font-semibold text-slate-950">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-xs text-slate-500">
                        MPN {item.mpn} · SKU {item.sku}
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.price != null && item.priceVisibility === "public"
                          ? formatMoney(item.price, item.currency, locale)
                          : copy.quoteRequired}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <div>
                        <span className="mb-1 block text-xs text-slate-500">
                          {copy.quantity}
                        </span>
                        <div className="flex items-center rounded-md border border-slate-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="focus-ring flex h-10 w-10 items-center justify-center text-slate-700"
                            aria-label={`${copy.quantity} -`}
                          >
                            <Minus aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min={item.minimumOrderQuantity || 1}
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(item.id, Number(event.target.value))
                            }
                            className="h-10 w-16 border-x border-slate-200 text-center text-sm font-semibold"
                            aria-label={copy.quantity}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="focus-ring flex h-10 w-10 items-center justify-center text-slate-700"
                            aria-label={`${copy.quantity} +`}
                          >
                            <Plus aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateItems(items.filter((entry) => entry.id !== item.id))
                        }
                        className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                        {copy.remove}
                      </button>
                    </div>
                  </article>
                ))}

                <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    {copy.estimatedSubtotal}
                  </p>
                  {totals.length ? (
                    <div className="mt-2 space-y-1">
                      {totals.map(([currency, total]) => (
                        <p
                          key={currency}
                          className="text-2xl font-semibold text-slate-950"
                        >
                          {formatMoney(total, currency, locale)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {quoteRequired ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {copy.quoteRequired}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
                <ShoppingBag
                  aria-hidden="true"
                  className="mx-auto h-10 w-10 text-slate-400"
                />
                <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                  {copy.emptyTitle}
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-600">
                  {copy.emptyBody}
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={submitOrder}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <h2 className="text-2xl font-semibold text-slate-950">
              {copy.formTitle}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {copy.formBody}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["firstName", copy.firstName, "text", true],
                  ["lastName", copy.lastName, "text", true],
                  ["email", copy.email, "email", true],
                  ["phone", copy.phone, "tel", true],
                  ["company", copy.company, "text", false],
                  ["country", copy.country, "text", true],
                  ["address", copy.address, "text", true],
                  ["city", copy.city, "text", true],
                  ["postalCode", copy.postalCode, "text", false],
                ] as const
              ).map(([field, label, type, required]) => (
                <label
                  key={field}
                  className={field === "address" ? "sm:col-span-2" : ""}
                >
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    {label}
                  </span>
                  <input
                    type={type}
                    required={required}
                    value={draft[field]}
                    onChange={(event) =>
                      updateDraft(field, event.target.value)
                    }
                    className="focus-ring h-12 w-full rounded-md border border-slate-200 px-3 text-sm"
                    autoComplete={field}
                  />
                </label>
              ))}
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {copy.notes}
                </span>
                <textarea
                  value={draft.notes}
                  onChange={(event) => updateDraft("notes", event.target.value)}
                  rows={4}
                  className="focus-ring w-full rounded-md border border-slate-200 p-3 text-sm"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={!items.length}
              className="focus-ring mt-5 min-h-12 w-full rounded-md bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {copy.submit}
            </button>
            {saved ? (
              <p className="mt-4 flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-800">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0"
                />
                {copy.success}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
