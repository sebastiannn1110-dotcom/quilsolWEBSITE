import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FileText, Share2, ShoppingCart } from "lucide-react";
import { StatusPanel } from "@/components/catalog/StatusPanel";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { PageHero } from "@/components/sections/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { locales, type Locale } from "@/lib/constants";
import { getCatalogProductBySlug } from "@/lib/catalog/search";
import { isLocale, localizedPath } from "@/lib/dictionary";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function priceLabel(
  price: number | null,
  currency: string,
  locale: Locale,
) {
  if (price == null) {
    return locale === "es" ? "Solicitar cotización" : "Request quote";
  }

  return new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", {
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
          const tier = item as { qFrom: unknown; qTo?: unknown; price: unknown };
          return `${tier.qFrom}+ units: $${tier.price}`;
        }

        return String(item);
      })
      .join(" · ");
  }

  return String(value);
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, slug: "placeholder" }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const { product } = await getCatalogProductBySlug(slug, locale);

  return createPageMetadata({
    locale,
    path: `/products/${slug}`,
    title: product ? `${product.title} | Quicksol Global` : "Product",
    description:
      product?.short_description ||
      "Published Quicksol Global product detail page.",
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const { product, configured, error } = await getCatalogProductBySlug(
    slug,
    locale,
  );

  if (!configured) {
    return (
      <section className="section-y bg-slate-50">
        <div className="container-page">
          <StatusPanel
            title="Supabase catalog is not configured"
            body="Product detail pages read from Supabase when catalog credentials are configured."
          />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-y bg-slate-50">
        <div className="container-page">
          <StatusPanel tone="error" title="Product could not be loaded" body={error} />
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
        eyebrow={product.brand_name || product.manufacturer_name || "Product"}
        title={product.title}
        body={product.short_description || "Published catalog product."}
        locale={locale}
        primaryLabel="Request quote"
        secondaryLabel="Contact team"
      />
      <section className="section-y bg-white">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
              {product.primary_image_url ? (
                <Image
                  src={product.primary_image_url}
                  alt={product.primary_image_alt || product.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <ProductVisual
                  mpn={product.mpn}
                  category={product.category_name}
                />
              )}
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Technical specifications
              </h2>
              {specs.length ? (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {specs.map(([key, item]) => (
                    <div key={key} className="rounded-md bg-white p-4">
                      <dt className="text-xs font-semibold uppercase text-slate-500">
                        {key}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-800">
                        {specificationValue(item)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Specifications are not published yet. Request a quote for
                  verified technical details.
                </p>
              )}
            </div>
          </div>
          <aside className="space-y-5">
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 border-b border-slate-100 pb-5">
                <p className="text-3xl font-semibold text-slate-950">
                  {priceLabel(product.price, product.currency, locale)}
                </p>
                {product.price_is_estimate ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {locale === "es"
                      ? "Precio unitario estimado en USD. Confirma precio final, stock y envío mediante RFQ."
                      : "Estimated USD unit price. Confirm final price, stock and freight by RFQ."}
                  </p>
                ) : null}
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["MPN", product.mpn],
                  ["SKU", product.sku],
                  ["Stock", product.stock_status || "Verify"],
                  ["MOQ", product.minimum_order_quantity || "RFQ"],
                  ["Condition", product.condition || "Verify"],
                  ["Packaging", product.packaging || "Verify"],
                  ["Origin", product.country_of_origin || "Verify"],
                  [
                    "Lead time",
                    product.lead_time_min_days && product.lead_time_max_days
                      ? `${product.lead_time_min_days}-${product.lead_time_max_days} days`
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
                  Add to cart draft
                </ButtonLink>
                <ButtonLink
                  href={localizedPath(locale, `/rfq?product=${product.slug}`)}
                  variant="secondary"
                >
                  Request quote
                </ButtonLink>
                {product.datasheet_url ? (
                  <ButtonLink href={product.datasheet_url} variant="secondary">
                    <FileText aria-hidden="true" className="h-4 w-4" />
                    Datasheet
                  </ButtonLink>
                ) : null}
                {product.source_url ? (
                  <ButtonLink href={product.source_url} variant="secondary">
                    <FileText aria-hidden="true" className="h-4 w-4" />
                    {locale === "es" ? "Ver fuente del producto" : "View product source"}
                  </ButtonLink>
                ) : null}
                <ButtonLink href="#" variant="secondary">
                  <Share2 aria-hidden="true" className="h-4 w-4" />
                  Share
                </ButtonLink>
              </div>
            </div>
            <StatusPanel
              title="AI assistant is server-gated"
              body="The assistant will use product tools only after OPENAI_API_KEY and catalog credentials are configured."
            />
          </aside>
        </div>
      </section>
    </>
  );
}
