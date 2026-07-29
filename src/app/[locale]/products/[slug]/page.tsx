import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FileText, Share2, ShoppingCart } from "lucide-react";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { StatusPanel } from "@/components/catalog/StatusPanel";
import { PageHero } from "@/components/sections/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { catalogImageSrc } from "@/lib/catalog/image";
import { getCatalogProductBySlug } from "@/lib/catalog/search";
import { getCommerceCopy } from "@/lib/commerce-copy";
import { locales, type Locale } from "@/lib/constants";
import { isLocale, localizedPath } from "@/lib/dictionary";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function priceLabel(
  price: number | null,
  currency: string,
  locale: Locale,
  quoteLabel: string,
) {
  if (price == null) {
    return quoteLabel;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 4 : 2,
  }).format(price);
}

function specificationValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "qFrom" in item &&
          "price" in item
        ) {
          const tier = item as { qFrom: unknown; price: unknown };
          return `${tier.qFrom}+: $${tier.price}`;
        }

        return String(item);
      })
      .join(" · ");
  }

  return String(value);
}

function translatedCatalogValue(
  value: string | null,
  copy: ReturnType<typeof getCommerceCopy>["catalog"]["filters"],
  fallback: string,
) {
  const labels: Record<string, string> = {
    in_stock: copy.inStock,
    limited: copy.limited,
    quote: copy.quote,
    new: copy.new,
    refurbished: copy.refurbished,
    surplus: copy.surplus,
  };

  return value ? labels[value.toLowerCase()] || value : fallback;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, slug: "placeholder" }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const copy = getCommerceCopy(locale).product;
  const { product } = await getCatalogProductBySlug(slug, locale);

  return createPageMetadata({
    locale,
    path: `/products/${slug}`,
    title: product ? `${product.title} | Quicksol Global` : copy.product,
    description:
      locale === "en"
        ? product?.short_description || copy.publishedProduct
        : copy.publishedProduct,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const commerce = getCommerceCopy(locale);
  const copy = commerce.product;
  const { product, configured, error } = await getCatalogProductBySlug(
    slug,
    locale,
  );

  if (!configured) {
    return (
      <section className="section-y bg-slate-50">
        <div className="container-page">
          <StatusPanel
            title={copy.configuredTitle}
            body={copy.configuredBody}
          />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-y bg-slate-50">
        <div className="container-page">
          <StatusPanel
            tone="error"
            title={copy.errorTitle}
            body={copy.configuredBody}
          />
        </div>
      </section>
    );
  }

  if (!product) {
    notFound();
  }

  const specs = Object.entries(product.specifications || {}).filter(
    ([key]) => key !== "source_url",
  );

  return (
    <>
      <PageHero
        eyebrow={product.brand_name || product.manufacturer_name || copy.product}
        title={product.title}
        body={
          locale === "en"
            ? product.short_description || copy.publishedProduct
            : copy.publishedProduct
        }
        locale={locale}
        primaryLabel={copy.requestQuote}
        secondaryLabel={copy.contactTeam}
      />
      <section className="section-y bg-white">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
              {product.primary_image_url ? (
                <>
                  <Image
                    src={catalogImageSrc(product.primary_image_url)}
                    alt={product.primary_image_alt || product.title}
                    fill
                    unoptimized
                    loading="eager"
                    fetchPriority="high"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-contain p-8"
                  />
                  {product.specifications?.image_is_representative === true ? (
                    <span className="absolute bottom-4 left-4 rounded bg-slate-950/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                      {copy.referencePhoto}
                    </span>
                  ) : null}
                </>
              ) : (
                <ProductVisual
                  mpn={product.mpn}
                  category={product.category_name}
                />
              )}
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-semibold text-slate-950">
                {copy.technicalSpecifications}
              </h2>
              {specs.length ? (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {specs.map(([key, item]) => (
                    <div key={key} className="rounded-md bg-white p-4">
                      <dt className="text-xs font-semibold uppercase text-slate-500">
                        {key.replaceAll("_", " ")}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-800">
                        {specificationValue(item)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {copy.specificationsPending}
                </p>
              )}
            </div>
          </div>
          <aside>
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 border-b border-slate-100 pb-5">
                <p className="text-3xl font-semibold text-slate-950">
                  {priceLabel(
                    product.price,
                    product.currency,
                    locale,
                    copy.priceByQuote,
                  )}
                </p>
                {product.price_is_estimate ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {copy.estimatedPriceBody}
                  </p>
                ) : null}
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["MPN", product.mpn],
                  ["SKU", product.sku],
                  [
                    copy.stock,
                    translatedCatalogValue(
                      product.stock_status,
                      commerce.catalog.filters,
                      copy.verify,
                    ),
                  ],
                  ["MOQ", product.minimum_order_quantity || "RFQ"],
                  [
                    copy.condition,
                    translatedCatalogValue(
                      product.condition,
                      commerce.catalog.filters,
                      copy.verify,
                    ),
                  ],
                  [copy.packaging, product.packaging || copy.verify],
                  [copy.origin, product.country_of_origin || copy.verify],
                  [
                    copy.leadTime,
                    product.lead_time_min_days && product.lead_time_max_days
                      ? `${product.lead_time_min_days}-${product.lead_time_max_days} ${copy.days}`
                      : "RFQ",
                  ],
                ].map(([label, item]) => (
                  <div key={label}>
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="font-semibold text-slate-950">{item}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 grid gap-3">
                <ButtonLink
                  href={localizedPath(locale, `/cart?product=${product.slug}`)}
                  icon={<ShoppingCart aria-hidden="true" className="h-4 w-4" />}
                >
                  {copy.addToCart}
                </ButtonLink>
                <ButtonLink
                  href={localizedPath(locale, `/rfq?product=${product.slug}`)}
                  variant="secondary"
                >
                  {copy.requestQuote}
                </ButtonLink>
                {product.datasheet_url ? (
                  <ButtonLink href={product.datasheet_url} variant="secondary">
                    <FileText aria-hidden="true" className="h-4 w-4" />
                    {copy.datasheet}
                  </ButtonLink>
                ) : null}
                {product.source_url ? (
                  <ButtonLink href={product.source_url} variant="secondary">
                    <FileText aria-hidden="true" className="h-4 w-4" />
                    {copy.viewSource}
                  </ButtonLink>
                ) : null}
                <ButtonLink href="#" variant="secondary">
                  <Share2 aria-hidden="true" className="h-4 w-4" />
                  {copy.share}
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
