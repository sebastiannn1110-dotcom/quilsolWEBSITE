import { describe, expect, it } from "vitest";
import catalogSnapshot from "../../data/catalog-products.json";
import {
  getBundledCatalogProductBySlug,
  searchBundledCatalogProducts,
} from "./local";

describe("bundled Quicksol catalog", () => {
  it("contains exactly 500 unique, priced products", () => {
    const products = catalogSnapshot.products;

    expect(products).toHaveLength(500);
    expect(new Set(products.map((product) => product.id)).size).toBe(500);
    expect(new Set(products.map((product) => product.slug)).size).toBe(500);
    expect(products.every((product) => product.price > 0)).toBe(true);
    expect(products.every((product) => product.stock_quantity > 0)).toBe(true);
  });

  it("paginates without sending the full dataset", () => {
    const firstPage = searchBundledCatalogProducts({ locale: "es", page: 1 });
    const secondPage = searchBundledCatalogProducts({ locale: "es", page: 2 });

    expect(firstPage.count).toBe(500);
    expect(firstPage.products).toHaveLength(24);
    expect(secondPage.products).toHaveLength(24);
    expect(
      secondPage.products.some((product) =>
        firstPage.products.some((first) => first.id === product.id),
      ),
    ).toBe(false);
  });

  it("supports exact part search and product detail lookup", () => {
    const result = searchBundledCatalogProducts({
      locale: "es",
      query: "NE555DR",
    });

    expect(result.count).toBe(1);
    expect(result.products[0]?.mpn).toBe("NE555DR");
    expect(
      getBundledCatalogProductBySlug(result.products[0]?.slug || "")?.mpn,
    ).toBe("NE555DR");
  });

  it("returns all 50 products for a selected manufacturer", () => {
    const result = searchBundledCatalogProducts({
      locale: "es",
      brand: "micron-technology",
    });

    expect(result.count).toBe(50);
    expect(
      result.products.every(
        (product) => product.brand_name === "Micron Technology",
      ),
    ).toBe(true);
  });
});
