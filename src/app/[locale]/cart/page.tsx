import type { Metadata } from "next";
import { CartCheckout } from "@/components/cart/CartCheckout";
import { catalogImageSrc } from "@/lib/catalog/image";
import { getCatalogProductBySlug } from "@/lib/catalog/search";
import type { CartItem } from "@/lib/cart";
import { getCommerceCopy } from "@/lib/commerce-copy";
import type { Locale } from "@/lib/constants";
import { isLocale } from "@/lib/dictionary";
import { createPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const copy = getCommerceCopy(locale).cart;

  return {
    ...createPageMetadata({
      locale,
      path: "/cart",
      title: `${copy.title} | Quicksol Global`,
      description: copy.body,
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CartPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "en") as Locale;
  const copy = getCommerceCopy(locale).cart;
  const query = await searchParams;
  const productParam = Array.isArray(query.product)
    ? query.product[0]
    : query.product;
  let initialProduct: CartItem | null = null;

  if (productParam) {
    const { product } = await getCatalogProductBySlug(productParam, locale);

    if (product) {
      const minimumOrderQuantity = Math.max(
        product.minimum_order_quantity || 1,
        1,
      );

      initialProduct = {
        id: product.id,
        slug: product.slug,
        title: product.title,
        mpn: product.mpn,
        sku: product.sku,
        brand:
          product.brand_name || product.manufacturer_name || "Quicksol",
        imageUrl: product.primary_image_url
          ? catalogImageSrc(product.primary_image_url, { thumbnail: true })
          : null,
        imageAlt: product.primary_image_alt || product.title,
        price: product.price,
        currency: product.currency || "USD",
        priceVisibility: product.price_visibility,
        minimumOrderQuantity,
        quantity: minimumOrderQuantity,
      };
    }
  }

  return (
    <CartCheckout
      locale={locale}
      copy={copy}
      initialProduct={initialProduct}
    />
  );
}
