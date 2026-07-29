import { Search } from "lucide-react";
import type { CommerceCopy } from "@/lib/commerce-copy";

export function CatalogFilters({
  query,
  brand,
  category,
  availability,
  condition,
  sort,
  brands,
  categories,
  copy,
}: {
  query?: string;
  brand?: string;
  category?: string;
  availability?: string;
  condition?: string;
  sort?: string;
  brands: Array<{ slug: string; name: string }>;
  categories: Array<{ slug: string; name: string }>;
  copy: CommerceCopy["catalog"]["filters"];
}) {
  return (
    <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,1fr)_auto]">
        <label className="relative">
          <span className="sr-only">{copy.searchLabel}</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            name="q"
            defaultValue={query}
            placeholder={copy.searchPlaceholder}
            className="focus-ring h-12 w-full rounded-md border border-slate-200 pl-10 pr-4 text-sm"
          />
        </label>
        <select
          name="brand"
          defaultValue={brand || ""}
          className="focus-ring h-12 rounded-md border border-slate-200 px-3 text-sm"
          aria-label={copy.brand}
        >
          <option value="">{copy.allBrands}</option>
          {brands.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category || ""}
          className="focus-ring h-12 rounded-md border border-slate-200 px-3 text-sm"
          aria-label={copy.category}
        >
          <option value="">{copy.allCategories}</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="availability"
          defaultValue={availability || ""}
          className="focus-ring h-12 rounded-md border border-slate-200 px-3 text-sm"
          aria-label={copy.availability}
        >
          <option value="">{copy.anyStock}</option>
          <option value="in_stock">{copy.inStock}</option>
          <option value="limited">{copy.limited}</option>
          <option value="quote">{copy.quote}</option>
        </select>
        <select
          name="condition"
          defaultValue={condition || ""}
          className="focus-ring h-12 rounded-md border border-slate-200 px-3 text-sm"
          aria-label={copy.condition}
        >
          <option value="">{copy.anyCondition}</option>
          <option value="new">{copy.new}</option>
          <option value="refurbished">{copy.refurbished}</option>
          <option value="surplus">{copy.surplus}</option>
        </select>
        <select
          name="sort"
          defaultValue={sort || "relevance"}
          className="focus-ring h-12 rounded-md border border-slate-200 px-3 text-sm"
          aria-label={copy.sort}
        >
          <option value="relevance">{copy.relevance}</option>
          <option value="alpha">{copy.alphabetical}</option>
          <option value="price">{copy.price}</option>
        </select>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <button
            type="submit"
            className="focus-ring min-h-12 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            {copy.search}
          </button>
          <a
            href="?"
            className="focus-ring flex min-h-12 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          >
            {copy.clear}
          </a>
        </div>
      </div>
    </form>
  );
}
