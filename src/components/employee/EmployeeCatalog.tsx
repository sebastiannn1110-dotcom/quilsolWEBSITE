"use client";

import {
  Boxes,
  Grid2X2,
  List,
  LoaderCircle,
  PackagePlus,
  RefreshCw,
  Search,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { commerceClient } from "@/lib/platform-api/client";
import type {
  InventoryStatus,
  PaginatedResponse,
  Product,
} from "@/lib/platform-api/types";
import { EmployeePageHeader, StatusBadge } from "./EmployeeShell";
import { useQuoteDraft } from "./QuoteDraftProvider";

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

const statusLabels: Record<InventoryStatus, string> = {
  available: "Disponible",
  low_stock: "Stock bajo",
  partially_reserved: "Parcialmente reservado",
  temporarily_reserved: "Temporalmente reservado",
  unavailable: "Sin disponibilidad",
  updating: "Actualizando inventario",
};

export function EmployeeCatalog({
  initial,
}: {
  initial: PaginatedResponse<Product>;
}) {
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
          setNotice("Disponibilidad actualizada.");
          window.setTimeout(() => setNotice(""), 4500);
        }
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el catálogo.",
        );
      } finally {
        requestRunning.current = false;
        setLoading(false);
      }
    },
    [draft, filters],
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

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow="Catálogo comercial"
        title="Encuentra el componente correcto"
        body="Busca por MPN, descripción, fabricante o categoría. La cantidad visible llega del backend y se reconfirma al apartar."
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
            Actualizar
          </button>
        }
      />

      {draft.requiresReconfirmation ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          La disponibilidad de uno o más productos de tu borrador cambió.
          Revisa las cantidades antes de apartar.
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
          <span className="sr-only">Buscar catálogo</span>
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
            placeholder="Buscar MPN, fabricante, descripción o categoría…"
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
            aria-label="Fabricante"
          >
            <option value="">Todos los fabricantes</option>
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
            aria-label="Categoría"
          >
            <option value="">Todas las categorías</option>
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
            aria-label="Disponibilidad"
          >
            <option value="">Toda disponibilidad</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
            aria-label="Orden"
          >
            <option value="availability">Mayor disponibilidad</option>
            <option value="mpn">MPN A–Z</option>
            <option value="price_asc">Precio menor</option>
            <option value="price_desc">Precio mayor</option>
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
            Buscar
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          {result.total} productos sintéticos
        </p>
        <div className="flex rounded-lg border border-stone-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("cards")}
            aria-label="Vista en tarjetas"
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
            aria-label="Vista en tabla"
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
            {result.data.map((product) => (
              <article
                key={product.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#062f33] to-[#0f4a4f] p-4 text-white">
                  <div className="text-center">
                    <Boxes
                      aria-hidden="true"
                      className="mx-auto text-orange-300"
                      size={30}
                    />
                    <p className="mt-3 font-mono text-xs font-bold sm:text-sm">
                      {product.mpn}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="truncate text-[10px] font-bold uppercase tracking-wide text-cyan-800 sm:text-xs">
                    {product.manufacturer}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 sm:text-base">
                    {product.description}
                  </h2>
                  <p className="mt-2 hidden text-xs text-slate-500 sm:block">
                    {product.category}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge status={product.availability.status} />
                    <span className="text-xs font-semibold text-slate-600">
                      {product.availability.availableQuantity} disponibles
                    </span>
                  </div>
                  <div className="mt-auto pt-4">
                    <p className="text-base font-semibold">
                      {money(product.authorizedUnitPrice)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Precio de venta autorizado
                    </p>
                    <button
                      type="button"
                      disabled={product.availability.availableQuantity <= 0}
                      onClick={() => {
                        draft.addProduct(product);
                        setNotice(`${product.mpn} agregado a la cotización.`);
                      }}
                      className="focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-2 text-xs font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-sm"
                    >
                      <PackagePlus aria-hidden="true" size={17} />
                      Agregar
                    </button>
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
                  <th className="px-4 py-4">MPN</th>
                  <th className="px-4 py-4">Descripción</th>
                  <th className="px-4 py-4">Fabricante</th>
                  <th className="px-4 py-4">Disponibilidad</th>
                  <th className="px-4 py-4">Precio</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {result.data.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-4 font-mono font-semibold">
                      {product.mpn}
                    </td>
                    <td className="max-w-sm px-4 py-4">
                      {product.description}
                    </td>
                    <td className="px-4 py-4">{product.manufacturer}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={product.availability.status} />
                      <span className="ml-2 text-xs">
                        {product.availability.availableQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {money(product.authorizedUnitPrice)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={product.availability.availableQuantity <= 0}
                        onClick={() => draft.addProduct(product)}
                        className="focus-ring min-h-11 rounded-lg bg-orange-600 px-4 font-semibold text-white disabled:bg-slate-300"
                      >
                        Agregar
                      </button>
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
          <h2 className="mt-4 text-lg font-semibold">No encontramos productos</h2>
          <p className="mt-2 text-sm text-slate-500">
            Ajusta la búsqueda o elimina alguno de los filtros.
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
            {loading ? "Cargando…" : "Cargar más productos"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
