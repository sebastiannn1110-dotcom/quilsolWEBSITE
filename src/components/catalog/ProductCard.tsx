import Image from "next/image";
import { BarChart3, Heart, ShoppingCart } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { catalogImageSrc } from "@/lib/catalog/image";
import type { CatalogProduct } from "@/lib/catalog/types";
import type { CommerceCopy } from "@/lib/commerce-copy";
import type { Locale } from "@/lib/constants";
import { localizedPath } from "@/lib/dictionary";
import { ProductVisual } from "./ProductVisual";

function priceLabel(
  product: CatalogProduct,
  locale: Locale,
  copy: CommerceCopy["product"],
) {
  if (
    product.price_visibility === "quote_only" ||
    product.price_visibility === "authenticated" ||
    product.price == null
  ) {
    return copy.priceByQuote;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: product.currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: product.price < 1 ? 4 : 2,
  }).format(product.price);
}

function translatedCatalogValue(
  value: string | null,
  copy: CommerceCopy["catalog"]["filters"],
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

export function ProductCard({
  product,
  locale,
  priority = false,
  copy,
  statusCopy,
}: {
  product: CatalogProduct;
  locale: Locale;
  priority?: boolean;
  copy: CommerceCopy["product"];
  statusCopy: CommerceCopy["catalog"]["filters"];
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-square bg-slate-100 sm:aspect-[4/3]">
        {product.primary_image_url ? (
          <>
            <Image
              src={catalogImageSrc(product.primary_image_url, {
                thumbnail: true,
              })}
              alt={product.primary_image_alt || product.title}
              fill
              unoptimized
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 50vw"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03] sm:p-5"
            />
            {product.specifications?.image_is_representative === true ? (
              <span className="absolute bottom-2 left-2 rounded bg-slate-950/80 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-white sm:bottom-3 sm:left-3 sm:text-[10px]">
                {copy.referencePhoto}
              </span>
            ) : null}
          </>
        ) : (
          <ProductVisual
            mpn={product.mpn}
            category={product.category_name}
            compact
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-cyan-700 sm:text-xs sm:tracking-[0.14em]">
              {product.brand_name || product.manufacturer_name || "Quicksol"}
            </p>
            <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950 sm:mt-2 sm:text-lg">
              {product.title}
            </h2>
          </div>
          {product.featured ? (
            <span className="hidden rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 sm:inline-flex">
              {copy.featured}
            </span>
          ) : null}
        </div>
        <p className="mt-3 hidden text-sm leading-6 text-slate-600 sm:line-clamp-3">
          {locale === "en"
            ? product.short_description || copy.fallbackDescription
            : copy.fallbackDescription}
        </p>
        <dl className="mt-4 hidden grid-cols-2 gap-3 text-sm sm:grid">
          <div>
            <dt className="text-slate-500">MPN</dt>
            <dd className="font-semibold text-slate-950">{product.mpn}</dd>
          </div>
          <div>
            <dt className="text-slate-500">SKU</dt>
            <dd className="font-semibold text-slate-950">{product.sku}</dd>
          </div>
          <div>
            <dt className="text-slate-500">MOQ</dt>
            <dd className="font-semibold text-slate-950">
              {product.minimum_order_quantity || "RFQ"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{copy.stock}</dt>
            <dd className="font-semibold text-slate-950">
              {translatedCatalogValue(
                product.stock_status,
                statusCopy,
                copy.verify,
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:mt-5 sm:pt-4">
          <div>
            <p className="text-sm font-semibold text-slate-950 sm:text-base">
              {priceLabel(product, locale, copy)}
            </p>
            {product.price_is_estimate ? (
              <p className="mt-0.5 hidden text-[11px] font-medium text-slate-500 sm:block">
                {copy.estimatedPrice}
              </p>
            ) : null}
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700"
              aria-label={copy.saveFavorite}
            >
              <Heart aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700"
              aria-label={copy.compare}
            >
              <BarChart3 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
          <ButtonLink
            href={localizedPath(locale, `/products/${product.slug}`)}
            variant="secondary"
            compact
          >
            {copy.view}
          </ButtonLink>
          <ButtonLink
            href={localizedPath(locale, `/cart?product=${product.slug}`)}
            icon={<ShoppingCart aria-hidden="true" className="h-4 w-4" />}
            compact
          >
            {copy.add}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
