export const locales = ["en", "es", "zh", "fr", "de", "ja", "ko"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  zh: "简体中文",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  ko: "한국어",
};

export const localeFlags: Record<Locale, string> = {
  en: "/flags/us.svg",
  es: "/flags/es.svg",
  zh: "/flags/cn.svg",
  fr: "/flags/fr.svg",
  de: "/flags/de.svg",
  ja: "/flags/jp.svg",
  ko: "/flags/kr.svg",
};

export const navItems = [
  { key: "home", href: "/" },
  { key: "brands", href: "/catalog" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "quality", href: "/quality" },
  { key: "global", href: "/global-presence" },
  { key: "insights", href: "/market-insights" },
  { key: "contact", href: "/contact" },
] as const;

export const footerGroups = [
  {
    key: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "global", href: "/global-presence" },
      { key: "partners", href: "/partners" },
      { key: "careers", href: "/careers" },
    ],
  },
  {
    key: "solutions",
    links: [
      { key: "services", href: "/services" },
      { key: "valueAdded", href: "/value-added-services" },
      { key: "brands", href: "/brands" },
      { key: "quality", href: "/quality" },
    ],
  },
  {
    key: "resources",
    links: [
      { key: "insights", href: "/market-insights" },
      { key: "rfq", href: "/rfq" },
      { key: "portal", href: "/portal" },
      { key: "contact", href: "/contact" },
    ],
  },
  {
    key: "legal",
    links: [
      { key: "terms", href: "/legal/terms" },
      { key: "privacy", href: "/legal/privacy" },
      { key: "cookies", href: "/legal/cookies" },
    ],
  },
] as const;

export const siteBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://quicksolglobal.com";

export const publicPages = [
  "",
  "/catalog",
  "/about",
  "/services",
  "/market-insights",
  "/brands",
  "/quality",
  "/value-added-services",
  "/global-presence",
  "/partners",
  "/careers",
  "/contact",
  "/rfq",
  "/portal",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
] as const;

export const privatePages = [
  "/admin",
  "/portal",
  "/cart",
  "/favorites",
  "/quotes",
  "/orders",
] as const;

export const allowedBomTypes = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const maxBomFileSize = 10 * 1024 * 1024;
