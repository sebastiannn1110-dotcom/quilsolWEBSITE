"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { employeeLocale } from "@/lib/platform-api/employee-i18n";

const languages = [
  { locale: "es", label: "Español" },
  { locale: "en", label: "English" },
  { locale: "zh", label: "中文" },
] as const;

function FlagIcon({ locale }: { locale: "es" | "en" | "zh" }) {
  if (locale === "es") {
    return (
      <svg
        viewBox="0 0 30 20"
        aria-hidden="true"
        className="h-5 w-7 rounded-sm shadow-sm"
      >
        <path fill="#AA151B" d="M0 0h30v20H0z" />
        <path fill="#F1BF00" d="M0 5h30v10H0z" />
      </svg>
    );
  }
  if (locale === "en") {
    return (
      <svg
        viewBox="0 0 30 20"
        aria-hidden="true"
        className="h-5 w-7 rounded-sm shadow-sm"
      >
        <path fill="#fff" d="M0 0h30v20H0z" />
        {[0, 3, 6, 9, 12, 15, 18].map((y) => (
          <path key={y} fill="#B22234" d={`M0 ${y}h30v2H0z`} />
        ))}
        <path fill="#3C3B6E" d="M0 0h13v11H0z" />
        {[2, 5, 8, 11].flatMap((x) =>
          [2, 5, 8].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r=".65" fill="#fff" />
          )),
        )}
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 30 20"
      aria-hidden="true"
      className="h-5 w-7 rounded-sm shadow-sm"
    >
      <path fill="#DE2910" d="M0 0h30v20H0z" />
      <path
        fill="#FFDE00"
        d="m6 2 1 2.2 2.4.2-1.8 1.7.5 2.4L6 7.3 3.9 8.5l.5-2.4-1.8-1.7 2.4-.2z"
      />
    </svg>
  );
}

export function EmployeeLanguageSwitcher({
  locale,
  inverse = false,
}: {
  locale: string;
  inverse?: boolean;
}) {
  const pathname = usePathname();
  const activeLocale = employeeLocale(locale);

  return (
    <nav
      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white/95 p-1 shadow-sm"
      aria-label="Language / Idioma / 语言"
    >
      {languages.map((language) => {
        const href = pathname.replace(/^\/[^/]+/, `/${language.locale}`);
        const active = language.locale === activeLocale;
        return (
          <Link
            key={language.locale}
            href={href}
            hrefLang={language.locale}
            lang={language.locale}
            aria-label={language.label}
            title={language.label}
            aria-current={active ? "page" : undefined}
            className={`focus-ring inline-flex h-9 min-w-10 items-center justify-center rounded-md px-2 transition ${
              active
                ? "bg-orange-600 text-white"
                : inverse
                  ? "text-slate-800 hover:bg-stone-100"
                  : "text-slate-700 hover:bg-stone-100"
            }`}
          >
            <FlagIcon locale={language.locale} />
          </Link>
        );
      })}
    </nav>
  );
}
