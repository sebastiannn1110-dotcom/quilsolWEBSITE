import Link from "next/link";
import type { ReactNode } from "react";

const variants = {
  primary:
    "bg-orange-600 text-white shadow-lg shadow-orange-950/25 hover:bg-orange-500",
  secondary:
    "border border-stone-300 bg-white text-stone-950 hover:border-orange-500 hover:text-orange-700",
  dark: "border border-white/20 bg-white/10 text-white hover:bg-white/18",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  icon,
  compact = false,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`focus-ring inline-flex items-center justify-center rounded-md font-semibold transition duration-200 ${
        compact
          ? "min-h-10 gap-1 px-2 py-2 text-xs sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
          : "min-h-12 gap-2 px-5 py-3 text-sm"
      } ${variants[variant]}`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
