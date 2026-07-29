import Link from "next/link";
import type { CommerceCopy } from "@/lib/commerce-copy";
import type { Locale } from "@/lib/constants";
import { localizedPath } from "@/lib/dictionary";

type SearchParams = Record<string, string | string[] | undefined>;

function pageNumbers(current: number, total: number) {
  const pages = new Set([1, total]);

  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page > 0 && page <= total) {
      pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export function CatalogPagination({
  locale,
  currentPage,
  totalPages,
  searchParams,
  copy,
}: {
  locale: Locale;
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
  copy: CommerceCopy["catalog"]["pagination"];
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();

    for (const [key, rawValue] of Object.entries(searchParams)) {
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

      if (value && key !== "page") {
        params.set(key, value);
      }
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const query = params.toString();
    return `${localizedPath(locale, "/catalog")}${query ? `?${query}` : ""}`;
  };

  const pages = pageNumbers(currentPage, totalPages);

  return (
    <nav
      aria-label={copy.label}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <Link
        href={hrefFor(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`focus-ring rounded-md border px-4 py-2 text-sm font-semibold ${
          currentPage === 1
            ? "pointer-events-none border-slate-100 text-slate-300"
            : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        {copy.previous}
      </Link>
      {pages.map((page, index) => {
        const previous = pages[index - 1];
        const showGap = previous && page - previous > 1;

        return (
          <span key={page} className="contents">
            {showGap ? <span className="px-1 text-slate-400">…</span> : null}
            <Link
              href={hrefFor(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`focus-ring min-w-10 rounded-md border px-3 py-2 text-center text-sm font-semibold ${
                page === currentPage
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}
      <Link
        href={hrefFor(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`focus-ring rounded-md border px-4 py-2 text-sm font-semibold ${
          currentPage === totalPages
            ? "pointer-events-none border-slate-100 text-slate-300"
            : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        {copy.next}
      </Link>
    </nav>
  );
}
