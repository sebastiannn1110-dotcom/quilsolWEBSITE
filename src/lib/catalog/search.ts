import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import {
  getBundledCatalogFacets,
  getBundledCatalogProductBySlug,
  getBundledCatalogProductBySku,
  searchBundledCatalogProducts,
} from "./local";
import type { CatalogFilters, CatalogProduct, CatalogResult } from "./types";

const pageSize = 12;
const catalogCacheTag = "public-catalog";

type CatalogProductLookup = {
  product: CatalogProduct | null;
  configured: boolean;
  error?: string;
};

type PublicCatalogFilters = Omit<CatalogFilters, "locale">;

function bundledCatalogEnabled() {
  return process.env.CATALOG_SOURCE !== "supabase";
}

export function normalizePartReference(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function catalogProductFromData(data: unknown) {
  const product = data as CatalogProduct;
  const sourceUrl = product.specifications?.source_url;
  const bundledProduct = getBundledCatalogProductBySku(product.sku);

  return {
    ...product,
    primary_image_url:
      product.primary_image_url || bundledProduct?.primary_image_url || null,
    primary_image_alt:
      product.primary_image_alt ||
      bundledProduct?.primary_image_alt ||
      `${product.brand_name || product.manufacturer_name || ""} ${product.mpn}`.trim(),
    specifications: {
      ...(bundledProduct?.specifications || {}),
      ...(product.specifications || {}),
    },
    source_url:
      product.source_url ||
      (typeof sourceUrl === "string" ? sourceUrl : undefined),
  };
}

function catalogCardProductFromData(data: unknown) {
  const product = catalogProductFromData(data);
  const isRepresentative =
    product.specifications?.image_is_representative === true;

  return {
    ...product,
    description: undefined,
    source_url: undefined,
    specifications: isRepresentative
      ? { image_is_representative: true }
      : null,
  };
}

const searchSupabaseCatalog = unstable_cache(
  async (filters: PublicCatalogFilters): Promise<CatalogResult> => {
    const supabase = createPublicSupabaseClient();

    if (!supabase) {
      return searchBundledCatalogProducts({ ...filters, locale: "en" });
    }

    const page = Math.max(filters.page || 1, 1);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("public_catalog_products")
      .select("*", { count: "exact" })
      .eq("status", "published")
      .eq("visibility", "public");

    if (filters.query) {
      const normalized = normalizePartReference(filters.query);
      query = query.or(
        [
          `title.ilike.%${filters.query}%`,
          `short_description.ilike.%${filters.query}%`,
          `manufacturer_name.ilike.%${filters.query}%`,
          `sku.ilike.%${filters.query}%`,
          `mpn.ilike.%${filters.query}%`,
          `sku_normalized.eq.${normalized}`,
          `mpn_normalized.eq.${normalized}`,
        ].join(","),
      );
    }

    if (filters.brand) {
      query = query.eq("brand_slug", filters.brand);
    }

    if (filters.category) {
      query = query.eq("category_slug", filters.category);
    }

    if (filters.availability) {
      query = query.eq("stock_status", filters.availability);
    }

    if (filters.condition) {
      query = query.eq("condition", filters.condition);
    }

    if (filters.sort === "alpha") {
      query = query.order("title", { ascending: true });
    } else if (filters.sort === "price") {
      query = query.order("public_price_sort", {
        ascending: true,
        nullsFirst: false,
      });
    } else {
      query = query
        .order("featured", { ascending: false })
        .order("updated_at", { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return {
        products: [],
        count: 0,
        page,
        pageSize,
        configured: true,
        error: error.message,
      };
    }

    return {
      products: (data || []).map(catalogCardProductFromData),
      count: count || 0,
      page,
      pageSize,
      configured: true,
    };
  },
  ["public-catalog-search-v1"],
  { revalidate: 300, tags: [catalogCacheTag] },
);

const getSupabaseProductBySlug = unstable_cache(
  async (slug: string): Promise<CatalogProductLookup> => {
    const supabase = createPublicSupabaseClient();

    if (!supabase) {
      return {
        product: getBundledCatalogProductBySlug(slug),
        configured: true,
      };
    }

    const { data, error } = await supabase
      .from("public_catalog_products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("visibility", "public")
      .maybeSingle();

    if (error) {
      return { product: null, configured: true, error: error.message };
    }

    return {
      product: data ? catalogProductFromData(data) : null,
      configured: true,
    };
  },
  ["public-catalog-product-v1"],
  { revalidate: 300, tags: [catalogCacheTag] },
);

const getSupabaseFacets = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient();

    if (!supabase) {
      return getBundledCatalogFacets();
    }

    const [brands, categories] = await Promise.all([
      supabase
        .from("brands")
        .select("slug,name")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("categories")
        .select("slug,name")
        .eq("status", "active")
        .order("sort_order"),
    ]);

    return {
      brands: brands.data || [],
      categories: categories.data || [],
      configured: true,
    };
  },
  ["public-catalog-facets-v1"],
  { revalidate: 3600, tags: [catalogCacheTag] },
);

export async function searchCatalogProducts(
  filters: CatalogFilters,
): Promise<CatalogResult> {
  if (bundledCatalogEnabled()) {
    return searchBundledCatalogProducts(filters);
  }

  const publicFilters: PublicCatalogFilters = {
    query: filters.query,
    brand: filters.brand,
    category: filters.category,
    availability: filters.availability,
    condition: filters.condition,
    sort: filters.sort,
    page: filters.page,
  };
  return searchSupabaseCatalog(publicFilters);
}

export async function getCatalogProductBySlug(slug: string, locale: string) {
  if (bundledCatalogEnabled()) {
    return {
      product: getBundledCatalogProductBySlug(slug),
      configured: true,
      locale,
    };
  }

  return {
    ...(await getSupabaseProductBySlug(slug)),
    locale,
  };
}

export async function getCatalogFacets() {
  if (bundledCatalogEnabled()) {
    return getBundledCatalogFacets();
  }

  return getSupabaseFacets();
}
