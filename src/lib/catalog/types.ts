import type { Locale } from "@/lib/constants";

export type ProductPriceVisibility = "public" | "authenticated" | "quote_only";

export type CatalogProduct = {
  id: string;
  sku: string;
  sku_normalized?: string | null;
  mpn: string;
  mpn_normalized?: string | null;
  slug: string;
  title: string;
  short_description: string | null;
  description?: string | null;
  brand_name: string | null;
  brand_slug?: string | null;
  category_name: string | null;
  category_slug?: string | null;
  manufacturer_name: string | null;
  status: "draft" | "published" | "archived";
  visibility: "public" | "authenticated";
  featured: boolean;
  currency: string;
  price: number | null;
  price_visibility: ProductPriceVisibility;
  price_is_estimate?: boolean;
  stock_quantity: number | null;
  stock_status: string | null;
  minimum_order_quantity: number | null;
  lead_time_min_days: number | null;
  lead_time_max_days: number | null;
  condition: string | null;
  packaging: string | null;
  country_of_origin: string | null;
  datasheet_url: string | null;
  primary_image_url: string | null;
  primary_image_alt: string | null;
  source_url?: string | null;
  specifications: Record<string, unknown> | null;
  updated_at: string | null;
};

export type CatalogFilters = {
  query?: string;
  brand?: string;
  category?: string;
  availability?: string;
  condition?: string;
  sort?: string;
  page?: number;
  locale: Locale;
};

export type CatalogResult = {
  products: CatalogProduct[];
  count: number;
  page: number;
  pageSize: number;
  configured: boolean;
  error?: string;
};
