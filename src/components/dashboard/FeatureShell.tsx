import type { ReactNode } from "react";
import { StatusPanel } from "@/components/catalog/StatusPanel";

export function FeatureShell({
  title,
  body,
  children,
  eyebrow = "Quicksol Platform",
  emptyTitle = "Supabase authentication required",
  emptyBody = "This area is wired for server-side protection and will activate after Supabase Auth and RLS policies are configured in Render.",
}: {
  title: string;
  body: string;
  children?: ReactNode;
  eyebrow?: string;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  return (
    <section className="section-y bg-slate-50">
      <div className="container-page space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-700">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950 md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
            {body}
          </p>
        </div>
        {children || (
          <StatusPanel
            tone="protected"
            title={emptyTitle}
            body={emptyBody}
          />
        )}
      </div>
    </section>
  );
}
