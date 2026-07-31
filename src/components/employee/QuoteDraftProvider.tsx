"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "@/lib/platform-api/types";
import {
  parseDemoDraft,
  serializeDemoDraft,
} from "@/lib/platform-api/demo-draft";

export type DraftQuoteItem = {
  productId: string;
  mpn: string;
  manufacturer: string;
  description: string;
  authorizedUnitPrice: number;
  availableQuantity: number;
  availabilityRevision: number;
  quantity: number;
  discountPercent: number;
};

type DraftContextValue = {
  items: DraftQuoteItem[];
  customerId: string;
  requiresReconfirmation: boolean;
  setCustomerId: (customerId: string) => void;
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setDiscount: (productId: string, discount: number) => void;
  reconcileInventory: (products: Product[]) => void;
  confirmInventory: () => void;
  clear: () => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);
const draftStorageKey = "quiksol-commerce-demo-draft-v2";

export function QuoteDraftProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DraftQuoteItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [requiresReconfirmation, setRequiresReconfirmation] = useState(false);

  useEffect(() => {
    let restored = { items: [] as DraftQuoteItem[], customerId: "" };
    try {
      restored = parseDemoDraft<DraftQuoteItem>(
        sessionStorage.getItem(draftStorageKey) ||
          sessionStorage.getItem("quiksol-commerce-draft-v1"),
      );
    } catch {
      sessionStorage.removeItem(draftStorageKey);
    }
    const restoreTimer = window.setTimeout(() => {
      setItems(restored.items);
      setCustomerId(restored.customerId);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(
      draftStorageKey,
      serializeDemoDraft({ items, customerId }),
    );
  }, [customerId, hydrated, items]);

  const value = useMemo<DraftContextValue>(
    () => ({
      items,
      customerId,
      requiresReconfirmation,
      setCustomerId,
      addProduct(product) {
        setItems((current) => {
          if (current.some((item) => item.productId === product.id)) {
            return current.map((item) =>
              item.productId === product.id
                ? {
                    ...item,
                    quantity: Math.min(
                      item.quantity + product.minimumOrderQuantity,
                      Math.max(product.availability.availableQuantity, 1),
                    ),
                  }
                : item,
            );
          }
          return [
            ...current,
            {
              productId: product.id,
              mpn: product.mpn,
              manufacturer: product.manufacturer,
              description: product.description,
              authorizedUnitPrice: product.authorizedUnitPrice,
              availableQuantity: product.availability.availableQuantity,
              availabilityRevision: product.availability.revision,
              quantity: product.minimumOrderQuantity,
              discountPercent: 0,
            },
          ];
        });
      },
      removeProduct(productId) {
        setItems((current) =>
          current.filter((item) => item.productId !== productId),
        );
      },
      setQuantity(productId, quantity) {
        setItems((current) =>
          current.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: Math.max(
                    1,
                    Math.min(Math.trunc(quantity || 1), 100_000),
                  ),
                }
              : item,
          ),
        );
      },
      setDiscount(productId, discountPercent) {
        setItems((current) =>
          current.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  discountPercent: Math.max(
                    0,
                    Math.min(Number(discountPercent || 0), 100),
                  ),
                }
              : item,
          ),
        );
      },
      reconcileInventory(products) {
        const byId = new Map(products.map((product) => [product.id, product]));
        let changed = false;
        setItems((current) =>
          current.map((item) => {
            const product = byId.get(item.productId);
            if (!product) return item;
            if (
              product.availability.revision !== item.availabilityRevision ||
              product.availability.availableQuantity !== item.availableQuantity
            ) {
              changed = true;
              return {
                ...item,
                availableQuantity: product.availability.availableQuantity,
                availabilityRevision: product.availability.revision,
              };
            }
            return item;
          }),
        );
        if (changed) setRequiresReconfirmation(true);
      },
      confirmInventory() {
        setRequiresReconfirmation(false);
      },
      clear() {
        setItems([]);
        setCustomerId("");
        setRequiresReconfirmation(false);
        sessionStorage.removeItem(draftStorageKey);
        sessionStorage.removeItem("quiksol-commerce-draft-v1");
      },
    }),
    [customerId, items, requiresReconfirmation],
  );

  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
}

export function useQuoteDraft() {
  const value = useContext(DraftContext);
  if (!value) {
    throw new Error("useQuoteDraft must be used inside QuoteDraftProvider");
  }
  return value;
}
