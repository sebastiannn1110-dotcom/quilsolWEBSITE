import type { Metadata } from "next";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ProductCard } from "@/components/catalog/ProductCard";
import { StatusPanel } from "@/components/catalog/StatusPanel";
import { locales, type Locale } from "@/lib/constants";
import { getCatalogFacets, searchCatalogProducts } from "@/lib/catalog/search";
import { getDictionary, isLocale } from "@/lib/dictionary";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const item = params[key];
  return Array.isArray(item) ? item[0] : item;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";

  return createPageMetadata({
    locale,
    path: "/catalog",
    title: "Quicksol Global Catalog",
    description:
      "Search published electronic components by MPN, SKU, brand, category and availability.",
  });
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const dict = getDictionary(locale);
  const queryParams = await searchParams;
  const page = Number(value(queryParams, "page") || "1");
  const filters = {
    locale,
    query: value(queryParams, "q"),
    brand: value(queryParams, "brand"),
    category: value(queryParams, "category"),
    availability: value(queryParams, "availability"),
    condition: value(queryParams, "condition"),
    sort: value(queryParams, "sort"),
    page: Number.isFinite(page) ? page : 1,
  };
  const [result, facets] = await Promise.all([
    searchCatalogProducts(filters),
    getCatalogFacets(),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.count / result.pageSize));

  if (result.error) {
    console.error("Catalog load failed", result.error);
  }

  return (
    <>
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="container-page space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
            {dict.common.nav.brands}
          </p>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950 md:text-4xl">
                {locale === "es"
                  ? "Catálogo de componentes electrónicos"
                  : "Electronic components catalog"}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {locale === "es"
                  ? "Explora 500 referencias reales de fabricantes líderes. Los precios unitarios son estimaciones de mercado y se confirman mediante cotización."
                  : "Explore 500 real manufacturer references. Unit prices are market estimates and are confirmed by quotation."}
              </p>
            </div>
            <p className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              {result.count} {locale === "es" ? "resultados" : "results"}
            </p>
          </div>
        </div>
      </section>
      <section className="section-y bg-slate-50 pt-8">
        <div className="container-page space-y-8">
          <CatalogFilters
            query={filters.query}
            brand={filters.brand}
            category={filters.category}
            availability={filters.availability}
            condition={filters.condition}
            sort={filters.sort}
            brands={facets.brands}
            categories={facets.categories}
          />

          {!result.configured ? (
            <StatusPanel
              title="Supabase catalog is not configured"
              body="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Render to read published products. No demo products are shown in production."
            />
          ) : result.error ? (
            <StatusPanel
              tone="error"
              title="Catalog could not be loaded"
              body="The catalog service is temporarily unavailable. Try again or send an RFQ with the exact manufacturer part number."
            />
          ) : result.products.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                  />
                ))}
              </div>
              <CatalogPagination
                locale={locale}
                currentPage={result.page}
                totalPages={totalPages}
                searchParams={queryParams}
              />
            </>
          ) : (
            <StatusPanel
              title="No published products match this search"
              body="Try clearing filters or submit an RFQ for the exact manufacturer part number."
            />
          )}
        </div>
      </section>
    </>
  );
}
