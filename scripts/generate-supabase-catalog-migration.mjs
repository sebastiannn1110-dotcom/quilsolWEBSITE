#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const catalogFile = resolve(process.cwd(), "src/data/catalog-products.json");
const migrationFile = resolve(
  process.cwd(),
  "supabase/migrations/202607270001_seed_500_catalog_products.sql",
);
const catalog = JSON.parse(await readFile(catalogFile, "utf8"));
const products = catalog.products;

if (!Array.isArray(products) || products.length !== 500) {
  throw new Error(`Expected exactly 500 products, found ${products?.length}`);
}

const brands = uniqueBy(
  products.map((product) => ({
    slug: product.brand_slug,
    name: product.brand_name,
  })),
  (brand) => brand.slug,
);
const categories = uniqueBy(
  products.map((product) => ({
    slug: product.category_slug,
    name: product.category_name,
  })),
  (category) => category.slug,
);

const brandValues = brands
  .map(
    (brand) =>
      `  (${sqlText(brand.slug)}, ${sqlText(brand.name)}, 'active')`,
  )
  .join(",\n");
const categoryValues = categories
  .map(
    (category, index) =>
      `  (${sqlText(category.slug)}, ${sqlText(category.name)}, 'active', ${index})`,
  )
  .join(",\n");
const productValues = products
  .map((product) => {
    const specifications = {
      ...(product.specifications || {}),
      price_is_estimate: true,
    };

    return [
      "  (",
      [
        sqlText(product.id),
        sqlText(product.sku),
        sqlText(product.mpn),
        sqlText(product.slug),
        sqlText(product.title),
        sqlText(product.short_description),
        sqlText(product.description),
        `(select id from public.brands where slug = ${sqlText(product.brand_slug)})`,
        `(select id from public.categories where slug = ${sqlText(product.category_slug)})`,
        sqlText(product.manufacturer_name),
        "'published'",
        "'public'",
        product.featured ? "true" : "false",
        sqlText(product.currency || "USD"),
        sqlNumber(product.price, 4),
        "'public'",
        product.price_is_estimate ? "true" : "false",
        sqlInteger(product.stock_quantity),
        sqlText(product.stock_status),
        sqlInteger(product.minimum_order_quantity),
        sqlInteger(product.lead_time_min_days),
        sqlInteger(product.lead_time_max_days),
        sqlText(product.condition),
        sqlText(product.packaging),
        sqlText(product.country_of_origin),
        sqlText(product.datasheet_url),
        `${sqlText(JSON.stringify(specifications))}::jsonb`,
        sqlText(product.updated_at || catalog.generated_at),
        sqlText(product.updated_at || catalog.generated_at),
      ].join(", "),
      ")",
    ].join("");
  })
  .join(",\n");

const sql = `-- Generated from src/data/catalog-products.json.
-- Product references are real; public prices are market estimates and require RFQ confirmation.

begin;

alter table public.products
  add column if not exists price_is_estimate boolean not null default false;

insert into public.brands (slug, name, status)
values
${brandValues}
on conflict (slug) do update set
  name = excluded.name,
  status = 'active',
  updated_at = now();

insert into public.categories (slug, name, status, sort_order)
values
${categoryValues}
on conflict (slug) do update set
  name = excluded.name,
  status = 'active',
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id,
  sku,
  mpn,
  slug,
  title,
  short_description,
  description,
  brand_id,
  category_id,
  manufacturer_name,
  status,
  visibility,
  featured,
  currency,
  price,
  price_visibility,
  price_is_estimate,
  stock_quantity,
  stock_status,
  minimum_order_quantity,
  lead_time_min_days,
  lead_time_max_days,
  condition,
  packaging,
  country_of_origin,
  datasheet_url,
  specifications,
  published_at,
  updated_at
)
values
${productValues}
on conflict (sku) do update set
  mpn = excluded.mpn,
  slug = excluded.slug,
  title = excluded.title,
  short_description = excluded.short_description,
  description = excluded.description,
  brand_id = excluded.brand_id,
  category_id = excluded.category_id,
  manufacturer_name = excluded.manufacturer_name,
  status = 'published',
  visibility = 'public',
  featured = excluded.featured,
  currency = excluded.currency,
  price = excluded.price,
  price_visibility = 'public',
  price_is_estimate = true,
  stock_quantity = excluded.stock_quantity,
  stock_status = excluded.stock_status,
  minimum_order_quantity = excluded.minimum_order_quantity,
  lead_time_min_days = excluded.lead_time_min_days,
  lead_time_max_days = excluded.lead_time_max_days,
  condition = excluded.condition,
  packaging = excluded.packaging,
  country_of_origin = excluded.country_of_origin,
  datasheet_url = excluded.datasheet_url,
  specifications = excluded.specifications,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at,
  archived_at = null,
  deleted_at = null,
  embedding_status = 'pending',
  embedding_error = null;

create or replace view public.public_catalog_products as
select
  p.id,
  p.sku,
  p.mpn,
  p.slug,
  p.title,
  p.short_description,
  p.description,
  b.name as brand_name,
  b.slug as brand_slug,
  c.name as category_name,
  c.slug as category_slug,
  p.manufacturer_name,
  p.status,
  p.visibility,
  p.featured,
  p.currency,
  case when p.price_visibility = 'public' then p.price else null end as price,
  case when p.price_visibility = 'public' then p.price else null end as public_price_sort,
  p.price_visibility,
  p.stock_quantity,
  p.stock_status,
  p.minimum_order_quantity,
  p.lead_time_min_days,
  p.lead_time_max_days,
  p.condition,
  p.packaging,
  p.country_of_origin,
  p.datasheet_url,
  p.specifications,
  p.sku_normalized,
  p.mpn_normalized,
  img.public_url as primary_image_url,
  img.alt_text as primary_image_alt,
  p.published_at,
  p.updated_at,
  p.price_is_estimate
from public.products p
left join public.brands b on b.id = p.brand_id
left join public.categories c on c.id = p.category_id
left join lateral (
  select public_url, alt_text
  from public.product_images
  where product_id = p.id
  order by is_primary desc, sort_order asc, created_at asc
  limit 1
) img on true
where p.status = 'published'
  and p.visibility = 'public'
  and p.archived_at is null
  and p.deleted_at is null;

commit;
`;

await writeFile(migrationFile, sql, "utf8");
console.log(`Generated Supabase migration with ${products.length} products.`);

function uniqueBy(items, keyFor) {
  const seen = new Set();

  return items.filter((item) => {
    const key = keyFor(item);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sqlText(value) {
  if (value == null || value === "") {
    return "null";
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.trunc(number)) : "null";
}

function sqlNumber(value, decimals) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(decimals) : "null";
}
