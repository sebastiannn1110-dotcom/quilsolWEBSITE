#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SOURCE_BASE_URL = "https://jlcsearch.tscircuit.com";
const PRODUCTS_PER_BRAND = 50;
const OUTPUT_FILE = resolve(
  process.cwd(),
  "src/data/catalog-products.json",
);

const brands = [
  { query: "Texas Instruments", name: "Texas Instruments" },
  { query: "STMicroelectronics", name: "STMicroelectronics" },
  { query: "NXP Semicon", name: "NXP Semiconductors" },
  { query: "Microchip Tech", name: "Microchip Technology" },
  { query: "Analog Devices", name: "Analog Devices" },
  { query: "onsemi", name: "onsemi" },
  { query: "Micron Tech", name: "Micron Technology" },
  { query: "Winbond", name: "Winbond Electronics" },
  { query: "Intel Altera", name: "Intel / Altera" },
  { query: "AMD Xilinx", name: "AMD / Xilinx" },
];

const generatedAt = new Date().toISOString();
const products = [];
const seenReferences = new Set();

for (const brand of brands) {
  const url = new URL("/components/list.json", SOURCE_BASE_URL);
  url.searchParams.set("search", brand.query);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Quicksol-Catalog-Snapshot/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Catalog source returned ${response.status} for ${brand.name}`,
    );
  }

  const payload = await response.json();
  const candidates = Array.isArray(payload.components)
    ? payload.components
    : [];
  let addedForBrand = 0;

  for (const item of candidates) {
    if (addedForBrand >= PRODUCTS_PER_BRAND) {
      break;
    }

    const mpn = clean(item.mfr);
    const lcsc = Number(item.lcsc);

    if (!mpn || !Number.isFinite(lcsc)) {
      continue;
    }

    const referenceKey = `${brand.name}:${mpn}`.toUpperCase();

    if (seenReferences.has(referenceKey)) {
      continue;
    }

    const priceBreaks = parsePriceBreaks(item.price);
    const unitPrice = priceBreaks[0]?.price;

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      continue;
    }

    const categoryName =
      clean(item.subcategory) || clean(item.category) || "Electronic Components";
    const broadCategory = clean(item.category) || categoryName;
    const packageName = clean(item.package);
    const stockQuantity = Math.max(0, Math.trunc(Number(item.stock) || 0));
    const brandSlug = slugify(brand.name);
    const categorySlug = slugify(categoryName);
    const sku = `QS-C${lcsc}`;
    const slug = slugify(`${brand.name}-${mpn}-c${lcsc}`);
    const sourceUrl = `${SOURCE_BASE_URL}/components/list?search=C${lcsc}`;
    const productId = deterministicUuid(`${brand.name}:${mpn}:${lcsc}`);
    const shortDescription = [
      `${categoryName} de ${brand.name}`,
      packageName ? `en encapsulado ${packageName}` : null,
      "con disponibilidad y precio de referencia verificados al generar el catalogo",
    ]
      .filter(Boolean)
      .join(" ");

    products.push({
      id: productId,
      sku,
      sku_normalized: normalizeReference(sku),
      mpn,
      mpn_normalized: normalizeReference(mpn),
      slug,
      title: mpn,
      short_description: `${shortDescription}.`,
      description:
        `Componente real ${mpn} de ${brand.name}. ` +
        "El precio publicado es una estimacion unitaria basada en una captura de mercado y debe confirmarse mediante RFQ.",
      brand_name: brand.name,
      brand_slug: brandSlug,
      category_name: categoryName,
      category_slug: categorySlug,
      manufacturer_name: brand.name,
      status: "published",
      visibility: "public",
      featured: addedForBrand < 2,
      currency: "USD",
      price: roundPrice(unitPrice),
      price_visibility: "public",
      price_is_estimate: true,
      stock_quantity: stockQuantity,
      stock_status: stockQuantity >= 1000 ? "in_stock" : "limited",
      minimum_order_quantity: Math.max(
        1,
        Math.trunc(Number(priceBreaks[0]?.qFrom) || 1),
      ),
      lead_time_min_days: 3,
      lead_time_max_days: 7,
      condition: "new",
      packaging: packageName || null,
      country_of_origin: null,
      datasheet_url: null,
      primary_image_url: null,
      primary_image_alt: `${brand.name} ${mpn}`,
      specifications: {
        category: broadCategory,
        subcategory: categoryName,
        package: packageName || "Not specified",
        source_catalog_number: `C${lcsc}`,
        source: "JLCPCB/LCSC market listing via jlcsearch",
        source_url: sourceUrl,
        pricing_basis: "Single-unit market reference; taxes and freight excluded",
        price_snapshot_at: generatedAt,
        price_breaks: priceBreaks.slice(0, 6),
      },
      source_url: sourceUrl,
      updated_at: generatedAt,
    });

    seenReferences.add(referenceKey);
    addedForBrand += 1;
  }

  if (addedForBrand !== PRODUCTS_PER_BRAND) {
    throw new Error(
      `Expected ${PRODUCTS_PER_BRAND} valid products for ${brand.name}, found ${addedForBrand}`,
    );
  }
}

if (products.length !== 500) {
  throw new Error(`Expected exactly 500 products, generated ${products.length}`);
}

await mkdir(dirname(OUTPUT_FILE), { recursive: true });
await writeFile(
  OUTPUT_FILE,
  `${JSON.stringify(
    {
      generated_at: generatedAt,
      currency: "USD",
      price_disclaimer:
        "Estimated unit prices from a market snapshot; confirm stock and final price by RFQ.",
      products,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Generated ${products.length} products at ${OUTPUT_FILE}`);

function parsePriceBreaks(value) {
  if (Array.isArray(value)) {
    return normalizePriceBreaks(value);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    return normalizePriceBreaks(JSON.parse(value));
  } catch {
    return [];
  }
}

function normalizePriceBreaks(items) {
  return items
    .map((item) => ({
      qFrom: Math.max(1, Math.trunc(Number(item.qFrom) || 1)),
      qTo:
        item.qTo == null || !Number.isFinite(Number(item.qTo))
          ? null
          : Math.trunc(Number(item.qTo)),
      price: roundPrice(Number(item.price)),
    }))
    .filter((item) => Number.isFinite(item.price) && item.price > 0)
    .sort((a, b) => a.qFrom - b.qFrom);
}

function roundPrice(value) {
  return Number(Number(value).toFixed(value < 1 ? 6 : 4));
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function normalizeReference(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

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
