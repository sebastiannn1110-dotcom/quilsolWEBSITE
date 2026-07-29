"use client";

import Link from "next/link";
import { Menu, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CartIconLink } from "@/components/cart/CartIconLink";
import { getCommerceCopy } from "@/lib/commerce-copy";
import { navItems, type Locale } from "@/lib/constants";
import { localizedPath, type Dictionary } from "@/lib/dictionary";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

export function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = dict.common.nav;
  const cartCopy = getCommerceCopy(locale).cart;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071314]/95 backdrop-blur-xl">
      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2"
      >
        {dict.common.skip}
      </a>
      <div className="container-page flex min-h-20 items-center justify-between gap-4">
        <Logo href={localizedPath(locale, "/")} label={dict.common.brand} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navItems.map((item) => {
            const href = localizedPath(locale, item.href);
            const active =
              item.href === "/"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={item.key}
                href={href}
                className={`focus-ring rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-orange-600/16 text-orange-200"
                    : "text-stone-200 hover:bg-white/8 hover:text-white"
                }`}
              >
                {nav[item.key]}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher
            currentLocale={locale}
            label={dict.common.language.label}
          />
          <Link
            href={localizedPath(locale, "/portal")}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/15 bg-white/8 text-white transition hover:bg-white/12"
            aria-label={nav.portal}
          >
            <UserRound aria-hidden="true" size={18} />
          </Link>
          <CartIconLink
            href={localizedPath(locale, "/cart")}
            label={cartCopy.label}
          />
          <Link
            href={localizedPath(locale, "/rfq")}
            className="focus-ring rounded-md bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            {nav.rfq}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher
            currentLocale={locale}
            label={dict.common.language.mobileLabel}
          />
          <CartIconLink
            href={localizedPath(locale, "/cart")}
            label={cartCopy.label}
          />
          <button
            type="button"
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/15 bg-white/8 text-white"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#071314] lg:hidden">
          <nav className="container-page grid gap-2 py-4" aria-label="Mobile">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={localizedPath(locale, item.href)}
                onClick={() => setOpen(false)}
                className="focus-ring rounded-md px-3 py-3 text-base font-semibold text-stone-100 hover:bg-white/8"
              >
                {nav[item.key]}
              </Link>
            ))}
            <Link
              href={localizedPath(locale, "/rfq")}
              onClick={() => setOpen(false)}
              className="focus-ring mt-2 rounded-md bg-orange-600 px-4 py-3 text-center text-base font-semibold text-white"
            >
              {nav.rfq}
            </Link>
            <Link
              href={localizedPath(locale, "/portal")}
              onClick={() => setOpen(false)}
              className="focus-ring rounded-md px-3 py-3 text-base font-semibold text-stone-100 hover:bg-white/8"
            >
              {nav.portal}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
