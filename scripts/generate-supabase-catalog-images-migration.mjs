#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const catalogFile = resolve(process.cwd(), "src/data/catalog-products.json");
const migrationFile = resolve(
  process.cwd(),
  "supabase/migrations/202607280001_add_catalog_product_images.sql",
);
const catalog = JSON.parse(await readFile(catalogFile, "utf8"));
const products = catalog.products;

if (!Array.isArray(products) || products.length !== 500) {
  throw new Error(`Expected exactly 500 products, found ${products?.length}`);
}

if (products.some((product) => !product.primary_image_url)) {
  throw new Error("Every catalog product must have a primary image");
}

const values = products
  .map((product) => {
    const catalogNumber =
      product.specifications?.source_catalog_number || product.sku;
    const imageId = deterministicUuid(`catalog-image:${product.sku}`);

    return `  (${[
      sqlText(imageId),
      sqlText(product.id),
      sqlText(`bundled-catalog/${String(catalogNumber).toLowerCase()}.webp`),
      sqlText(product.primary_image_url),
      sqlText(product.primary_image_alt),
      "0",
      "true",
    ].join(", ")})`;
  })
  .join(",\n");

const sql = `-- Real product photography for the bundled 500-product catalog.
-- Exact product photos are used when published by the source. Products without
-- a stable source photo use a real representative package photo and disclose
-- that status in the product specifications and alt text.

begin;

insert into public.product_images (
  id,
  product_id,
  storage_path,
  public_url,
  alt_text,
  sort_order,
  is_primary
)
values
${values}
on conflict (id) do update set
  public_url = excluded.public_url,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order,
  is_primary = excluded.is_primary,
  updated_at = now();

commit;
`;

await writeFile(migrationFile, sql, "utf8");
console.log(`Generated Supabase image migration with ${products.length} rows.`);

function deterministicUuid(value) {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20),
  ].join("-");
}

function sqlText(value) {
  if (value == null || value === "") {
    return "null";
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}
