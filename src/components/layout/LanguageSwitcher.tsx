"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  localeFlags,
  localeNames,
  locales,
  type Locale,
} from "@/lib/constants";

function switchLocalePath(pathname: string, targetLocale: Locale) {
  const parts = pathname.split("/").filter(Boolean);

  if (locales.includes(parts[0] as Locale)) {
    parts[0] = targetLocale;
  } else {
    parts.unshift(targetLocale);
  }

  return `/${parts.join("/")}`;
}

export function LanguageSwitcher({
  currentLocale,
  label,
}: {
  currentLocale: Locale;
  label: string;
}) {
  const pathname = usePathname();

  return (
    <div className="relative">
      <details className="group">
        <summary
          className="focus-ring flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-white/15 bg-white/8 text-white transition hover:border-orange-400 hover:bg-white/12"
          title={`${label}: ${localeNames[currentLocale]}`}
        >
          <Image
            src={localeFlags[currentLocale]}
            alt=""
            width={28}
            height={19}
            className="rounded-[2px] border border-white/20 object-cover shadow-sm"
          />
          <span className="sr-only">
            {label}: {localeNames[currentLocale]}
          </span>
        </summary>
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl shadow-slate-950/12">
          {locales.map((locale) => (
            <Link
              key={locale}
              href={switchLocalePath(pathname, locale)}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-cyan-50 ${
                locale === currentLocale
                  ? "font-semibold text-orange-700"
                  : "text-slate-700"
              }`}
              hrefLang={locale}
              aria-current={locale === currentLocale ? "page" : undefined}
            >
              <Image
                src={localeFlags[locale]}
                alt=""
                width={24}
                height={16}
                className="rounded-[2px] border border-slate-200 object-cover shadow-sm"
              />
              <span>{localeNames[locale]}</span>
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
