import { describe, expect, it } from "vitest";
import { addCartProduct, cartItemCount, type CartItem } from "./cart";

const product: CartItem = {
  id: "product-1",
  slug: "product-1",
  title: "Product 1",
  mpn: "MPN-1",
  sku: "SKU-1",
  brand: "Quicksol",
  imageUrl: null,
  imageAlt: "Product 1",
  price: 1.25,
  currency: "USD",
  priceVisibility: "public",
  minimumOrderQuantity: 5,
  quantity: 5,
};

describe("cart helpers", () => {
  it("adds a new product with its minimum quantity", () => {
    expect(addCartProduct([], product)).toEqual([product]);
  });

  it("increases quantity when the same product is added again", () => {
    const items = addCartProduct([product], product);

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(10);
    expect(cartItemCount(items)).toBe(10);
  });
});
