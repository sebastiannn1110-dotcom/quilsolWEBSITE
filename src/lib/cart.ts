export const CART_STORAGE_KEY = "quicksol-cart-v1";
export const CHECKOUT_STORAGE_KEY = "quicksol-checkout-draft-v1";
export const PENDING_ORDER_STORAGE_KEY = "quicksol-pending-order-v1";
export const CART_UPDATED_EVENT = "quicksol-cart-updated";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  mpn: string;
  sku: string;
  brand: string;
  imageUrl: string | null;
  imageAlt: string;
  price: number | null;
  currency: string;
  priceVisibility: "public" | "authenticated" | "quote_only";
  minimumOrderQuantity: number;
  quantity: number;
};

export function readCart() {
  if (typeof window === "undefined") return [] as CartItem[];

  try {
    const value = JSON.parse(
      window.localStorage.getItem(CART_STORAGE_KEY) || "[]",
    );

    if (!Array.isArray(value)) return [] as CartItem[];

    return value.filter(
      (item): item is CartItem =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.slug === "string" &&
        typeof item.quantity === "number",
    );
  } catch {
    return [] as CartItem[];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function cartItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function addCartProduct(items: CartItem[], product: CartItem) {
  if (!items.some((item) => item.id === product.id)) {
    return [...items, product];
  }

  return items.map((item) =>
    item.id === product.id
      ? {
          ...item,
          quantity: item.quantity + product.minimumOrderQuantity,
        }
      : item,
  );
}
