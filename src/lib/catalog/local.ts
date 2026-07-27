import catalogSnapshot from "../../data/catalog-products.json";
import type {
  CatalogFilters,
  CatalogProduct,
  CatalogResult,
} from "./types";

export const bundledCatalogPageSize = 24;

const products = catalogSnapshot.products as CatalogProduct[];

function catalogCardProduct(product: CatalogProduct): CatalogProduct {
  return {
    ...product,
    description: undefined,
    source_url: undefined,
    specifications: null,
  };
}

function comparableText(product: CatalogProduct) {
  return [
    product.title,
    product.short_description,
    product.manufacturer_name,
    product.brand_name,
    product.category_name,
    product.sku,
    product.mpn,
    product.sku_normalized,
    product.mpn_normalized,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function searchBundledCatalogProducts(
  filters: CatalogFilters,
): CatalogResult {
  const query = filters.query?.trim().toLocaleLowerCase();
  let matches = products.filter((product) => {
    if (query && !comparableText(product).includes(query)) {
      const normalizedQuery = query.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const normalizedMatch =
        product.sku_normalized?.includes(normalizedQuery) ||
        product.mpn_normalized?.includes(normalizedQuery);

      if (!normalizedMatch) {
        return false;
      }
    }

    return (
      (!filters.brand || product.brand_slug === filters.brand) &&
      (!filters.category || product.category_slug === filters.category) &&
      (!filters.availability ||
        product.stock_status === filters.availability) &&
      (!filters.condition || product.condition === filters.condition)
    );
  });

  if (filters.sort === "alpha") {
    matches = matches.sort((a, b) => a.title.localeCompare(b.title));
  } else if (filters.sort === "price") {
    matches = matches.sort(
      (a, b) => (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE),
    );
  } else {
    matches = matches.sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (b.stock_quantity || 0) - (a.stock_quantity || 0),
    );
  }

  const page = Math.max(filters.page || 1, 1);
  const from = (page - 1) * bundledCatalogPageSize;

  return {
    products: matches
      .slice(from, from + bundledCatalogPageSize)
      .map(catalogCardProduct),
    count: matches.length,
    page,
    pageSize: bundledCatalogPageSize,
    configured: true,
  };
}

export function getBundledCatalogProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug) || null;
}

export function getBundledCatalogFacets() {
  const brands = new Map<string, string>();
  const categories = new Map<string, string>();

  for (const product of products) {
    if (product.brand_slug && product.brand_name) {
      brands.set(product.brand_slug, product.brand_name);
    }

    if (product.category_slug && product.category_name) {
      categories.set(product.category_slug, product.category_name);
    }
  }

  return {
    brands: [...brands].map(([slug, name]) => ({ slug, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    categories: [...categories]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    configured: true,
  };
}

export function getBundledCatalogMetadata() {
  return {
    generatedAt: catalogSnapshot.generated_at,
    disclaimer: catalogSnapshot.price_disclaimer,
    count: products.length,
  };
}
