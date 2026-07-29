"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  cartItemCount,
  readCart,
} from "@/lib/cart";

export function CartIconLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refreshCount = () => setCount(cartItemCount(readCart()));
    const refreshFromStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) refreshCount();
    };

    refreshCount();
    window.addEventListener(CART_UPDATED_EVENT, refreshCount);
    window.addEventListener("storage", refreshFromStorage);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refreshCount);
      window.removeEventListener("storage", refreshFromStorage);
    };
  }, []);

  return (
    <Link
      href={href}
      className="focus-ring relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/8 text-white transition hover:bg-white/12"
      aria-label={`${label}${count ? ` (${count})` : ""}`}
    >
      <ShoppingCart aria-hidden="true" size={18} />
      {count ? (
        <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white shadow">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
