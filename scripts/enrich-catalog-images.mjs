#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const catalogFile = resolve(process.cwd(), "src/data/catalog-products.json");
const imageDirectory = resolve(process.cwd(), "public/images/catalog");
const thumbnailDirectory = resolve(imageDirectory, "thumbnails");
const catalog = JSON.parse(await readFile(catalogFile, "utf8"));
const products = catalog.products;
const concurrency = Math.max(
  1,
  Math.min(8, Number(process.env.CATALOG_IMAGE_CONCURRENCY) || 4),
);
const refresh = process.argv.includes("--refresh");

if (!Array.isArray(products) || products.length !== 500) {
  throw new Error(`Expected exactly 500 products, found ${products?.length}`);
}

await mkdir(imageDirectory, { recursive: true });
await mkdir(thumbnailDirectory, { recursive: true });

let cursor = 0;
let completed = 0;
let downloaded = 0;
const exactProducts = [];
const missingProducts = [];

async function worker() {
  while (cursor < products.length) {
    const index = cursor;
    cursor += 1;
    const product = products[index];
    const catalogNumber = product.specifications?.source_catalog_number;
    const publicPath = `/images/catalog/${catalogNumber?.toLowerCase()}.webp`;
    const filePath = resolve(
      imageDirectory,
      `${catalogNumber?.toLowerCase()}.webp`,
    );

    try {
      if (!catalogNumber) {
        throw new Error("missing LCSC catalog number");
      }

      if (!refresh && product.primary_image_url === publicPath) {
        exactProducts.push(product);
        continue;
      }

      const sourceUrl = `https://jlcpcb.com/partdetail/${catalogNumber}`;
      const page = await fetchText(sourceUrl);
      const imageUrl = primarySignedImageUrl(page, catalogNumber);

      if (!imageUrl) {
        missingProducts.push(product);
        continue;
      }

      const imageResponse = await fetchWithRetries(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const metadata = await sharp(imageBuffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error("downloaded file is not a valid product image");
      }

      await sharp(imageBuffer)
        .rotate()
        .resize(720, 720, {
          fit: "inside",
          withoutEnlargement: false,
        })
        .flatten({ background: "#ffffff" })
        .webp({ quality: 82, effort: 4 })
        .toFile(filePath);

      product.primary_image_url = publicPath;
      product.primary_image_alt =
        `${product.brand_name || product.manufacturer_name} ${product.mpn} product photo`;
      product.specifications = {
        ...(product.specifications || {}),
        image_source: "JLCPCB product photography",
        image_source_url: sourceUrl,
        image_is_representative: false,
      };
      exactProducts.push(product);
      downloaded += 1;
    } catch (error) {
      console.warn(
        `${product.sku}: ${error instanceof Error ? error.message : String(error)}`,
      );
      missingProducts.push(product);
    } finally {
      completed += 1;

      if (completed % 25 === 0 || completed === products.length) {
        console.log(
          `Processed ${completed}/${products.length}; exact ${exactProducts.length}; pending ${missingProducts.length}`,
        );
      }
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

for (const product of missingProducts) {
  const representative = bestRepresentative(product, exactProducts);

  if (!representative?.primary_image_url) {
    throw new Error(`No real package photo available for ${product.sku}`);
  }

  product.primary_image_url = representative.primary_image_url;
  product.primary_image_alt =
    `Representative real ${product.packaging || "component"} package photo for ` +
    `${product.brand_name || product.manufacturer_name} ${product.mpn}`;
  product.specifications = {
    ...(product.specifications || {}),
    image_source: representative.specifications?.image_source,
    image_source_url: representative.specifications?.image_source_url,
    image_is_representative: true,
    image_reference_mpn: representative.mpn,
  };
}

await writeFile(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

const uniqueImagePaths = [
  ...new Set(
    products
      .map((product) => product.primary_image_url)
      .filter((value) => value?.startsWith("/images/catalog/")),
  ),
];

for (const publicPath of uniqueImagePaths) {
  const filename = publicPath.split("/").at(-1);

  if (!filename) {
    continue;
  }

  await sharp(resolve(process.cwd(), "public", publicPath.slice(1)))
    .resize(480, 480, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 76, effort: 4 })
    .toFile(resolve(thumbnailDirectory, filename));
}

console.log(
  `Saved ${downloaded} optimized WebP photos, ${uniqueImagePaths.length} thumbnails, and assigned ${missingProducts.length} transparent package references.`,
);

async function fetchText(url) {
  const response = await fetchWithRetries(url, {
    Accept: "text/html",
  });

  return response.text();
}

async function fetchWithRetries(url, extraHeaders = {}) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Quicksol-Catalog-Image-Enrichment/1.0",
          ...extraHeaders,
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(`source returned ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, attempt * 750),
        );
      }
    }
  }

  throw lastError;
}

function primarySignedImageUrl(html, catalogNumber) {
  const pattern =
    /https:\/\/jlc-prod-smt\.oss-eu-central-1\.aliyuncs\.com\/[^"\\<\s]+?\.(?:jpg|jpeg|png|webp)\?x-oss-date=[^"<\s]+?x-oss-signature=[0-9a-f]{64}/gi;
  const candidateUrls = [...html.matchAll(pattern)]
    .map(([value]) => decodeHtml(value))
    .filter((value) => imageBelongsToProduct(value, catalogNumber));
  const uniqueUrls = [...new Set(candidateUrls)];

  return (
    uniqueUrls.find((value) => isFrontImage(value)) ||
    uniqueUrls.find((value) => !isBackImage(value)) ||
    null
  );
}

function imageBelongsToProduct(value, catalogNumber) {
  const path = new URL(value).pathname.toUpperCase();
  const productCode = catalogNumber.toUpperCase();

  return (
    path.includes(`-${productCode}-`) ||
    path.includes(`/${productCode}-`) ||
    path.includes(`-${productCode}/`) ||
    path.includes(`/${productCode}/`)
  );
}

function isFrontImage(value) {
  const lower = value.toLowerCase();

  return (
    lower.includes("-front.") ||
    lower.includes("_front.") ||
    lower.includes("%e6%ad%a3%e9%9d%a2")
  );
}

function isBackImage(value) {
  const lower = value.toLowerCase();

  return (
    lower.includes("-back.") ||
    lower.includes("_back.") ||
    lower.includes("%e5%8f%8d%e9%9d%a2")
  );
}

function decodeHtml(value) {
  let decoded = String(value).replaceAll("\\u0026", "&");

  for (let index = 0; index < 2; index += 1) {
    decoded = decoded.replaceAll("&amp;", "&");
  }

  return decoded;
}

function bestRepresentative(product, candidates) {
  return candidates
    .map((candidate) => ({
      candidate,
      score:
        Number(candidate.packaging === product.packaging) * 12 +
        Number(candidate.brand_slug === product.brand_slug) * 6 +
        Number(candidate.category_slug === product.category_slug) * 3 +
        Number(
          candidate.specifications?.category ===
            product.specifications?.category,
        ),
    }))
    .sort((a, b) => b.score - a.score)[0]?.candidate;
}
