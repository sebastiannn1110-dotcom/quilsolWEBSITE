"use client";

import Image from "next/image";
import {
  Boxes,
  Grid2X2,
  List,
  LoaderCircle,
  PackagePlus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { commerceClient } from "@/lib/platform-api/client";
import { catalogImageSrc } from "@/lib/catalog/image";
import {
  employeeCopy,
  employeeIntlLocale,
  employeeProductText,
  employeeStatusLabel,
} from "@/lib/platform-api/employee-i18n";
import type {
  InventoryStatus,
  PaginatedResponse,
  Product,
} from "@/lib/platform-api/types";
import { EmployeePageHeader, StatusBadge } from "./EmployeeShell";
import { useQuoteDraft } from "./QuoteDraftProvider";

function money(value: number, locale: string) {
  return new Intl.NumberFormat(employeeIntlLocale(locale), {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function EmployeeCatalog({
  initial,
  locale,
}: {
  initial: PaginatedResponse<Product>;
  locale: string;
}) {
  const router = useRouter();
  const draft = useQuoteDraft();
  const [result, setResult] = useState(initial);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    manufacturer: "",
    category: "",
    status: "",
    sort: "availability",
  });
  const requestRunning = useRef(false);
  const copy = employeeCopy(locale, {
    es: {
      updated: "Disponibilidad actualizada.",
      updateError: "No se pudo actualizar el catálogo.",
      eyebrow: "Catálogo comercial",
      title: "Encuentra el componente correcto",
      body: "Busca por MPN, descripción, fabricante o categoría. La disponibilidad se reconfirma al reservar.",
      update: "Actualizar",
      inventoryChanged:
        "La disponibilidad de uno o más productos de tu cotización cambió. Revisa las cantidades antes de reservar.",
      searchCatalog: "Buscar catálogo",
      placeholder: "Buscar MPN, fabricante, descripción o categoría…",
      allManufacturers: "Todos los fabricantes",
      allCategories: "Todas las categorías",
      allAvailability: "Toda disponibilidad",
      availability: "Disponibilidad",
      manufacturer: "Fabricante",
      category: "Categoría",
      order: "Orden",
      mostAvailable: "Mayor disponibilidad",
      lowestPrice: "Precio menor",
      highestPrice: "Precio mayor",
      search: "Buscar",
      products: "productos",
      cardView: "Vista en tarjetas",
      tableView: "Vista en tabla",
      image: "Imagen",
      availableUnits: "disponibles",
      authorizedPrice: "Precio de venta autorizado",
      add: "Agregar",
      buyWithAi: "Comprar con IA",
      added: "agregado a la cotización.",
      description: "Descripción",
      price: "Precio",
      noProducts: "No encontramos productos",
      noProductsBody: "Ajusta la búsqueda o elimina alguno de los filtros.",
      loadingMore: "Cargando…",
      loadMore: "Cargar más productos",
    },
    en: {
      updated: "Availability updated.",
      updateError: "Unable to update the catalog.",
      eyebrow: "Commercial catalog",
      title: "Find the right component",
      body: "Search by MPN, description, manufacturer or category. Availability is reconfirmed when reserving.",
      update: "Refresh",
      inventoryChanged:
        "Availability changed for one or more quote items. Review quantities before reserving.",
      searchCatalog: "Search catalog",
      placeholder: "Search MPN, manufacturer, description or category…",
      allManufacturers: "All manufacturers",
      allCategories: "All categories",
      allAvailability: "All availability",
      availability: "Availability",
      manufacturer: "Manufacturer",
      category: "Category",
      order: "Sort",
      mostAvailable: "Highest availability",
      lowestPrice: "Lowest price",
      highestPrice: "Highest price",
      search: "Search",
      products: "products",
      cardView: "Card view",
      tableView: "Table view",
      image: "Image",
      availableUnits: "available",
      authorizedPrice: "Authorized sales price",
      add: "Add",
      buyWithAi: "Buy with AI",
      added: "added to the quote.",
      description: "Description",
      price: "Price",
      noProducts: "No products found",
      noProductsBody: "Adjust your search or remove a filter.",
      loadingMore: "Loading…",
      loadMore: "Load more products",
    },
    zh: {
      updated: "库存已更新。",
      updateError: "无法更新产品目录。",
      eyebrow: "商务产品目录",
      title: "查找合适的元器件",
      body: "可按 MPN、描述、制造商或类别搜索。预留时将再次确认库存。",
      update: "更新",
      inventoryChanged: "报价中一个或多个产品的库存已变化。预留前请检查数量。",
      searchCatalog: "搜索产品目录",
      placeholder: "搜索 MPN、制造商、描述或类别…",
      allManufacturers: "所有制造商",
      allCategories: "所有类别",
      allAvailability: "所有库存状态",
      availability: "库存",
      manufacturer: "制造商",
      category: "类别",
      order: "排序",
      mostAvailable: "库存从高到低",
      lowestPrice: "价格从低到高",
      highestPrice: "价格从高到低",
      search: "搜索",
      products: "件产品",
      cardView: "卡片视图",
      tableView: "表格视图",
      image: "图片",
      availableUnits: "可用",
      authorizedPrice: "授权销售价格",
      add: "添加",
      buyWithAi: "AI 购买",
      added: "已加入报价。",
      description: "描述",
      price: "价格",
      noProducts: "未找到产品",
      noProductsBody: "请调整搜索或移除筛选条件。",
      loadingMore: "正在加载…",
      loadMore: "加载更多产品",
    },
  });

  const manufacturers = useMemo(
    () => [...new Set(initial.data.map((item) => item.manufacturer))].sort(),
    [initial.data],
  );
  const categories = useMemo(
    () => [...new Set(initial.data.map((item) => item.category))].sort(),
    [initial.data],
  );

  const refresh = useCallback(
    async (options?: { silent?: boolean; page?: number; append?: boolean }) => {
      if (requestRunning.current) return;
      requestRunning.current = true;
      if (!options?.silent) setLoading(true);
      try {
        const next = await commerceClient.catalog({
          query: filters.query || undefined,
          manufacturer: filters.manufacturer || undefined,
          category: filters.category || undefined,
          status: (filters.status || undefined) as InventoryStatus | undefined,
          sort: filters.sort as
            | "availability"
            | "mpn"
            | "price_asc"
            | "price_desc",
          page: options?.page || 1,
          pageSize: 24,
        });
        setResult((current) =>
          options?.append
            ? { ...next, data: [...current.data, ...next.data] }
            : next,
        );
        draft.reconcileInventory(next.data);
        if (options?.silent) {
          setNotice(copy.updated);
          window.setTimeout(() => setNotice(""), 4500);
        }
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : copy.updateError,
        );
      } finally {
        requestRunning.current = false;
        setLoading(false);
      }
    },
    [copy.updateError, copy.updated, draft, filters],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void refresh({ silent: true });
      }
    }, 20_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  function search(event: FormEvent) {
    event.preventDefault();
    void refresh();
  }

  function buyWithAi(product: Product) {
    draft.addProduct(product);
    router.push(`/${locale}/employee/quotes/new?assistant=1`);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        actions={
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 font-semibold text-slate-700 disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            {copy.update}
          </button>
        }
      />

      {draft.requiresReconfirmation ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          {copy.inventoryChanged}
        </div>
      ) : null}
      {notice ? (
        <div
          className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-950"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <form
        onSubmit={search}
        className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <label className="relative block">
          <span className="sr-only">{copy.searchCatalog}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                query: event.target.value,
              }))
            }
            placeholder={copy.placeholder}
            className="focus-ring h-14 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-base"
          />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <select
            value={filters.manufacturer}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                manufacturer: event.target.value,
              }))
            }
            className="focus-ring min-h-12 rounded-lg border border-slate-300 bg-white px-3"
            aria-label={copy.manufacturer}
          >
            <option value="">{copy.allManufacturers}</option>
            {manufacturers.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
            className="focus-ring min-h-12 rounded-lg border border-slate-300 bg-white px-3"
            aria-label={copy.category}
          >
            <option value="">{copy.allCategories}</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className="focus-ring min-h-12 rounded-lg border border-slate-300 bg-white px-3"
            aria-label={copy.availability}
          >
            <option value="">{copy.allAvailability}</option>
            {(
              [
                "available",
                "low_stock",
                "partially_reserved",
                "temporarily_reserved",
                "unavailable",
                "updating",
              ] as InventoryStatus[]
            ).map((value) => (
              <option key={value} value={value}>
                {employeeStatusLabel(locale, value)}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sort: event.target.value,
              }))
            }
            className="focus-ring min-h-12 rounded-lg border border-slate-300 bg-white px-3"
            aria-label={copy.order}
          >
            <option value="availability">{copy.mostAvailable}</option>
            <option value="mpn">MPN A–Z</option>
            <option value="price_asc">{copy.lowestPrice}</option>
            <option value="price_desc">{copy.highestPrice}</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#062f33] px-4 font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Search size={18} />
            )}
            {copy.search}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          {result.total} {copy.products}
        </p>
        <div className="flex rounded-lg border border-stone-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("cards")}
            aria-label={copy.cardView}
            aria-pressed={view === "cards"}
            className={`focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md ${
              view === "cards" ? "bg-[#062f33] text-white" : "text-slate-600"
            }`}
          >
            <Grid2X2 aria-hidden="true" size={19} />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-label={copy.tableView}
            aria-pressed={view === "table"}
            className={`focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md ${
              view === "table" ? "bg-[#062f33] text-white" : "text-slate-600"
            }`}
          >
            <List aria-hidden="true" size={20} />
          </button>
        </div>
      </div>

      {loading && !result.data.length ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-xl bg-stone-200"
            />
          ))}
        </div>
      ) : result.data.length ? (
        view === "cards" ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
            {result.data.map((product, index) => (
              <article
                key={product.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] border-b border-stone-100 bg-white">
                  {product.imageUrl ? (
                    <Image
                      src={catalogImageSrc(product.imageUrl, {
                        thumbnail: true,
                      })}
                      alt={`${product.manufacturer} ${product.mpn}`}
                      fill
                      unoptimized
                      loading={index < 4 ? "eager" : "lazy"}
                      fetchPriority={index < 4 ? "high" : "auto"}
                      sizes="(min-width: 1536px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-contain p-2 sm:p-4"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#062f33] to-[#0f4a4f] p-4 text-white">
                      <Boxes aria-hidden="true" size={30} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="truncate font-mono text-[10px] font-bold text-slate-500 sm:text-xs">
                    {product.mpn}
                  </p>
                  <p className="truncate text-[10px] font-bold uppercase tracking-wide text-cyan-800 sm:text-xs">
                    {product.manufacturer}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 sm:text-base">
                    {employeeProductText(locale, product.description)}
                  </h2>
                  <p className="mt-2 hidden text-xs text-slate-500 sm:block">
                    {employeeProductText(locale, product.category)}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={product.availability.status}
                      locale={locale}
                    />
                    <span className="text-xs font-semibold text-slate-600">
                      {product.availability.availableQuantity}{" "}
                      {copy.availableUnits}
                    </span>
                  </div>
                  <div className="mt-auto pt-4">
                    <p className="text-base font-semibold">
                      {money(product.authorizedUnitPrice, locale)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {copy.authorizedPrice}
                    </p>
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        disabled={product.availability.availableQuantity <= 0}
                        onClick={() => {
                          draft.addProduct(product);
                          setNotice(`${product.mpn} ${copy.added}`);
                        }}
                        className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-2 text-xs font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-sm"
                      >
                        <PackagePlus aria-hidden="true" size={17} />
                        {copy.add}
                      </button>
                      <button
                        type="button"
                        disabled={product.availability.availableQuantity <= 0}
                        onClick={() => buyWithAi(product)}
                        className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#062f33] px-2 text-xs font-semibold text-white hover:bg-[#0f4a4f] disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-sm"
                      >
                        <Sparkles aria-hidden="true" size={17} />
                        {copy.buyWithAi}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[#062f33] text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-4">{copy.image}</th>
                  <th className="px-4 py-4">MPN</th>
                  <th className="px-4 py-4">{copy.description}</th>
                  <th className="px-4 py-4">{copy.manufacturer}</th>
                  <th className="px-4 py-4">{copy.availability}</th>
                  <th className="px-4 py-4">{copy.price}</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {result.data.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      {product.imageUrl ? (
                        <Image
                          src={catalogImageSrc(product.imageUrl, {
                            thumbnail: true,
                          })}
                          alt={`${product.manufacturer} ${product.mpn}`}
                          width={64}
                          height={48}
                          unoptimized
                          loading="lazy"
                          className="h-12 w-16 rounded-md border border-stone-200 bg-white object-contain p-1"
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-mono font-semibold">
                      {product.mpn}
                    </td>
                    <td className="max-w-sm px-4 py-4">
                      {employeeProductText(locale, product.description)}
                    </td>
                    <td className="px-4 py-4">{product.manufacturer}</td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        status={product.availability.status}
                        locale={locale}
                      />
                      <span className="ml-2 text-xs">
                        {product.availability.availableQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {money(product.authorizedUnitPrice, locale)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={product.availability.availableQuantity <= 0}
                          onClick={() => draft.addProduct(product)}
                          className="focus-ring min-h-11 rounded-lg bg-orange-600 px-4 font-semibold text-white disabled:bg-slate-300"
                        >
                          {copy.add}
                        </button>
                        <button
                          type="button"
                          disabled={product.availability.availableQuantity <= 0}
                          onClick={() => buyWithAi(product)}
                          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#062f33] px-4 font-semibold text-white disabled:bg-slate-300"
                        >
                          <Sparkles aria-hidden="true" size={17} />
                          {copy.buyWithAi}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <Boxes aria-hidden="true" className="mx-auto text-slate-300" size={42} />
          <h2 className="mt-4 text-lg font-semibold">{copy.noProducts}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {copy.noProductsBody}
          </p>
        </div>
      )}

      {result.page < result.totalPages ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() =>
              refresh({ page: result.page + 1, append: true })
            }
            disabled={loading}
            className="focus-ring min-h-12 rounded-lg border border-stone-300 bg-white px-6 font-semibold"
          >
            {loading ? copy.loadingMore : copy.loadMore}
          </button>
        </div>
      ) : null}
    </div>
  );
}
