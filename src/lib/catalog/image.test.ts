import { describe, expect, it } from "vitest";
import { catalogImageSrc } from "./image";

describe("catalog image delivery", () => {
  it("uses versioned direct WebP thumbnails for catalog cards", () => {
    expect(
      catalogImageSrc("/images/catalog/c7512.webp", { thumbnail: true }),
    ).toBe("/images/catalog/thumbnails/c7512.webp?v=20260729");
  });

  it("uses the versioned full image on product details", () => {
    expect(catalogImageSrc("/images/catalog/c7512.webp")).toBe(
      "/images/catalog/c7512.webp?v=20260729",
    );
  });

  it("leaves external admin images unchanged", () => {
    const url = "https://example.supabase.co/storage/v1/object/public/item.webp";

    expect(catalogImageSrc(url, { thumbnail: true })).toBe(url);
  });
});
