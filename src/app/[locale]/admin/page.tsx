import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Badge,
  Boxes,
  FileText,
  Image,
  MessageSquare,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";
import { FeatureShell } from "@/components/dashboard/FeatureShell";
import { StatusPanel } from "@/components/catalog/StatusPanel";
import { createCheckedAdminClient } from "@/lib/admin/access";
import type { Locale } from "@/lib/constants";
import { localizedPath } from "@/lib/dictionary";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = { params: Promise<{ locale: string }> };

async function countRows(
  supabase: SupabaseClient,
  table: string,
  filters: Array<{ column: string; value: string }> = [],
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }

  const { count } = await query;

  return count || 0;
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  const { supabase, access } = await createCheckedAdminClient();
  const counts =
    supabase && access.allowed
      ? await Promise.all([
          countRows(supabase, "products"),
          countRows(supabase, "products", [{ column: "status", value: "published" }]),
          countRows(supabase, "products", [{ column: "status", value: "draft" }]),
          countRows(supabase, "products", [{ column: "status", value: "archived" }]),
          countRows(supabase, "rfq_requests", [{ column: "status", value: "new" }]),
          countRows(supabase, "contact_requests", [{ column: "status", value: "new" }]),
          countRows(supabase, "profiles", [{ column: "role", value: "customer" }]),
          countRows(supabase, "orders"),
        ])
      : [0, 0, 0, 0, 0, 0, 0, 0];
  const [
    products,
    published,
    draft,
    archived,
    rfqs,
    contacts,
    customers,
    orders,
  ] = counts;
  const cards = [
    { title: "Products", href: "/admin/products", body: `${published} published · ${draft} draft · ${archived} archived`, count: products, icon: Package },
    { title: "New product", href: "/admin/products/new", body: "Create SKU, MPN, pricing, stock and technical fields.", icon: Plus },
    { title: "Categories", href: "/admin/categories", body: "Organize catalog taxonomy and active public filters.", icon: Tags },
    { title: "Brands", href: "/admin/brands", body: "Manage manufacturer and brand metadata.", icon: Badge },
    { title: "Images and videos", href: "/admin/media", body: "Storage buckets and product media controls.", icon: Image },
    { title: "RFQs", href: "/admin/rfqs", body: "Review quote requests and product lines.", count: rfqs, icon: FileText },
    { title: "Contact requests", href: "/admin/contacts", body: "Read contact submissions and notification state.", count: contacts, icon: MessageSquare },
    { title: "Customers", href: "/admin/customers", body: "Profiles, roles, status and activity.", count: customers, icon: Users },
    { title: "Orders", href: "/admin/orders", body: "RFQ-mode order records. Checkout remains quote-based.", count: orders, icon: ShoppingBag },
    { title: "Settings", href: "/admin/settings", body: "Server-managed operational configuration.", icon: Settings },
  ];

  return (
    <FeatureShell
      title="Admin workspace"
      body="Manage products, categories, brands, prices, inventory, media, RFQs, orders, LinkedIn content and audit logs."
    >
      {!access.configured ? (
        <StatusPanel
          title="Supabase is not configured"
          body="Admin modules require Supabase Auth, profiles and RLS policies before any administrative query is executed."
        />
      ) : !access.allowed ? (
        <StatusPanel
          tone="protected"
          title="Admin access required"
          body="Access is validated on the server from the profiles table. Client-provided roles are ignored."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => {
            const Icon = item.icon || Boxes;

            return (
            <Link key={item.title} href={localizedPath(locale as Locale, item.href)} className="rounded-md border border-slate-200 bg-white p-6 shadow-sm transition hover:border-orange-300">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-orange-50 text-orange-700">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                {typeof item.count === "number" ? (
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {item.count}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.body}
              </p>
            </Link>
            );
          })}
        </div>
      )}
    </FeatureShell>
  );
}
