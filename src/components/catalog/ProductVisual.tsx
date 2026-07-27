import {
  Cpu,
  Database,
  Gauge,
  MemoryStick,
  Microchip,
  Radio,
  Zap,
} from "lucide-react";

function categoryIcon(category: string, className: string) {
  const value = category.toLocaleLowerCase();

  if (value.includes("memory") || value.includes("flash") || value.includes("ddr")) {
    return <MemoryStick aria-hidden="true" className={className} />;
  }

  if (value.includes("processor") || value.includes("microcontroller")) {
    return <Cpu aria-hidden="true" className={className} />;
  }

  if (value.includes("power") || value.includes("voltage") || value.includes("dc-")) {
    return <Zap aria-hidden="true" className={className} />;
  }

  if (value.includes("interface") || value.includes("transceiver") || value.includes("can")) {
    return <Radio aria-hidden="true" className={className} />;
  }

  if (value.includes("converter") || value.includes("amplifier")) {
    return <Gauge aria-hidden="true" className={className} />;
  }

  if (value.includes("storage") || value.includes("database")) {
    return <Database aria-hidden="true" className={className} />;
  }

  return <Microchip aria-hidden="true" className={className} />;
}

export function ProductVisual({
  mpn,
  category,
  compact = false,
}: {
  mpn: string;
  category?: string | null;
  compact?: boolean;
}) {
  const iconClassName = compact ? "h-7 w-7" : "h-10 w-10";

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_right,_#cffafe,_transparent_45%),linear-gradient(135deg,#f8fafc,#e2e8f0)] px-5 text-center">
      <div
        className={`flex items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 shadow-lg ${
          compact ? "h-14 w-14" : "h-20 w-20"
        }`}
      >
        {categoryIcon(category || "", iconClassName)}
      </div>
      <p
        className={`max-w-full truncate font-mono font-bold tracking-tight text-slate-950 ${
          compact ? "mt-4 text-base" : "mt-6 text-2xl"
        }`}
      >
        {mpn}
      </p>
      <p className="mt-2 max-w-full truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {category || "Electronic component"}
      </p>
    </div>
  );
}
