import type { Metadata } from "next";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { ProductCard } from "@/components/catalog/ProductCard";
import { StatusPanel } from "@/components/catalog/StatusPanel";
import { getCatalogFacets, searchCatalogProducts } from "@/lib/catalog/search";
import { getCommerceCopy } from "@/lib/commerce-copy";
import { locales, type Locale } from "@/lib/constants";
import { isLocale } from "@/lib/dictionary";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function value(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
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
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const copy = getCommerceCopy(locale).catalog;

  return createPageMetadata({
    locale,
    path: "/catalog",
    title: copy.metaTitle,
    description: copy.metaDescription,
  });
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const copy = getCommerceCopy(locale);
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
            {copy.catalog.eyebrow}
          </p>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950 md:text-4xl">
                {copy.catalog.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {copy.catalog.body}
              </p>
            </div>
            <p className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              {result.count} {copy.catalog.results}
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
            copy={copy.catalog.filters}
          />

          {!result.configured ? (
            <StatusPanel
              title={copy.catalog.configuredTitle}
              body={copy.catalog.configuredBody}
            />
          ) : result.error ? (
            <StatusPanel
              tone="error"
              title={copy.catalog.errorTitle}
              body={copy.catalog.errorBody}
            />
          ) : result.products.length ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {result.products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    priority={index < 4}
                    copy={copy.product}
                    statusCopy={copy.catalog.filters}
                  />
                ))}
              </div>
              <CatalogPagination
                locale={locale}
                currentPage={result.page}
                totalPages={totalPages}
                searchParams={queryParams}
                copy={copy.catalog.pagination}
              />
            </>
          ) : (
            <StatusPanel
              title={copy.catalog.emptyTitle}
              body={copy.catalog.emptyBody}
            />
          )}
        </div>
      </section>
    </>
  );
}
