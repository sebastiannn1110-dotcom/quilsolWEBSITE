import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getBundledCatalogFacets,
  getBundledCatalogProductBySlug,
  searchBundledCatalogProducts,
} from "./local";
import type { CatalogFilters, CatalogProduct, CatalogResult } from "./types";

const pageSize = 12;

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

  return {
    ...product,
    source_url:
      product.source_url ||
      (typeof sourceUrl === "string" ? sourceUrl : undefined),
  };
}

export async function searchCatalogProducts(
  filters: CatalogFilters,
): Promise<CatalogResult> {
  if (bundledCatalogEnabled()) {
    return searchBundledCatalogProducts(filters);
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return searchBundledCatalogProducts(filters);
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
    query = query.order("public_price_sort", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("featured", { ascending: false }).order("updated_at", {
      ascending: false,
    });
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
    products: (data || []).map(catalogProductFromData),
    count: count || 0,
    page,
    pageSize,
    configured: true,
  };
}

export async function getCatalogProductBySlug(slug: string, locale: string) {
  if (bundledCatalogEnabled()) {
    return {
      product: getBundledCatalogProductBySlug(slug),
      configured: true,
      locale,
    };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      product: getBundledCatalogProductBySlug(slug),
      configured: true,
      locale,
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
    locale,
  };
}

export async function getCatalogFacets() {
  if (bundledCatalogEnabled()) {
    return getBundledCatalogFacets();
  }

  const supabase = await createServerSupabaseClient();

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
}
