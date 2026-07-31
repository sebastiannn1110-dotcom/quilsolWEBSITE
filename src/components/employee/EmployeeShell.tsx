"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { commerceClient } from "@/lib/platform-api/client";
import { can } from "@/lib/platform-api/permissions";
import type { EmployeeSession } from "@/lib/platform-api/types";
import { PwaRegister } from "./PwaRegister";
import { QuoteDraftProvider, useQuoteDraft } from "./QuoteDraftProvider";

const roleLabels = {
  admin: "Administrador",
  manager: "Manager",
  employee: "Empleado",
} as const;

function ShellContent({
  session,
  locale,
  children,
}: {
  session: EmployeeSession;
  locale: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const draft = useQuoteDraft();
  const { items } = draft;
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const base = `/${locale}/employee`;
  const navigation = [
    { href: base, label: "Inicio", icon: Home },
    { href: `${base}/catalog`, label: "Catálogo", icon: Boxes },
    { href: `${base}/customers`, label: "Clientes", icon: Users },
    { href: `${base}/quotes`, label: "Cotizaciones", icon: FileText },
    {
      href: `${base}/reservations`,
      label: "Reservas",
      icon: ClipboardList,
    },
    { href: `${base}/orders`, label: "Pedidos", icon: ShoppingBag },
  ];

  async function logout() {
    await commerceClient.logout().catch(() => undefined);
    router.replace(`${base}/login`);
    router.refresh();
  }

  async function resetDemo() {
    if (
      !window.confirm(
        "Se reiniciarán catálogo, clientes, cotizaciones, reservas, pedidos y el borrador de esta demostración.",
      )
    ) {
      return;
    }
    await commerceClient.resetDemo();
    draft.clear();
    router.push(base);
    router.refresh();
  }

  const demoMode = session.provider === "mock";

  return (
    <div className="employee-portal-root min-h-dvh bg-[#f5f3ef] text-slate-950">
      <PwaRegister />
      {!online ? (
        <div className="fixed inset-x-0 top-0 z-[80] flex min-h-11 items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          <WifiOff aria-hidden="true" size={17} />
          Sin conexión. La disponibilidad debe verificarse antes de confirmar.
        </div>
      ) : null}

      <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-64 flex-col bg-[#062f33] text-white lg:flex">
        <div className="flex min-h-20 items-center border-b border-white/10 px-6">
          <Image
            src="/logos/quicksol-logo.svg"
            alt="Quiksol"
            width={170}
            height={43}
            priority
            className="brightness-0 invert"
          />
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Área comercial">
          {navigation.map((item) => {
            const active =
              item.href === base
                ? pathname === base
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                  active
                    ? "bg-orange-600 text-white"
                    : "text-teal-50/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon aria-hidden="true" size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {can(session.role, "stock_alerts:read") ? (
          <div className="mx-4 mb-3 rounded-xl border border-orange-300/20 bg-orange-400/10 p-4 text-xs leading-5 text-orange-100">
            <strong>Vista de equipo activa</strong>
            <br />
            Puedes revisar alertas y conflictos.
          </div>
        ) : null}
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-semibold">{session.fullName}</p>
          <p className="mt-1 text-xs text-teal-100/65">
            {roleLabels[session.role]}
          </p>
          <button
            type="button"
            onClick={resetDemo}
            className="focus-ring mt-3 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-orange-200 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw aria-hidden="true" size={18} />
            Reiniciar datos de demostración
          </button>
          <button
            type="button"
            onClick={logout}
            className="focus-ring mt-4 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
          >
            <LogOut aria-hidden="true" size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header
          className={`sticky z-40 border-b border-stone-200 bg-white/95 backdrop-blur ${
            online ? "top-0" : "top-11"
          }`}
        >
          <div className="flex min-h-18 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-stone-200 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu aria-hidden="true" />
              </button>
              <Image
                src="/logos/quicksol-logo.svg"
                alt="Quiksol"
                width={135}
                height={34}
                className="lg:hidden"
              />
              <div className="hidden sm:block">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-700">
                  Área comercial
                </p>
                <p className="text-sm text-slate-500">
                  {session.fullName} · {roleLabels[session.role]}
                </p>
              </div>
            </div>
            <Link
              href={`${base}/quotes/new`}
              className="focus-ring relative inline-flex min-h-11 items-center gap-2 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-500"
            >
              <PackageCheck aria-hidden="true" size={19} />
              <span className="hidden sm:inline">Cotización</span>
              {items.length ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-orange-700">
                  {items.length}
                </span>
              ) : null}
            </Link>
            {demoMode ? (
              <button
                type="button"
                onClick={resetDemo}
                className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-700"
                aria-label="Reiniciar datos de demostración"
                title="Reiniciar datos de demostración"
              >
                <RotateCcw aria-hidden="true" size={18} />
              </button>
            ) : null}
          </div>
        </header>

        <main className="min-h-[calc(100dvh-72px)] pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col bg-[#062f33] p-4 text-white shadow-2xl">
            <div className="flex min-h-14 items-center justify-between">
              <Image
                src="/logos/quicksol-logo.svg"
                alt="Quiksol"
                width={155}
                height={39}
                className="brightness-0 invert"
              />
              <button
                onClick={() => setOpen(false)}
                className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/10"
                aria-label="Cerrar menú"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-5 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="focus-ring flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold hover:bg-white/10"
                  >
                    <Icon aria-hidden="true" size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={resetDemo}
              className="focus-ring mt-auto flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold text-orange-200 hover:bg-white/10"
            >
              <RotateCcw aria-hidden="true" size={20} />
              Reiniciar datos de demostración
            </button>
            <button
              onClick={logout}
              className="focus-ring flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold hover:bg-white/10"
            >
              <LogOut aria-hidden="true" size={20} />
              Cerrar sesión
            </button>
          </aside>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,.08)] lg:hidden"
        aria-label="Navegación rápida"
      >
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active =
            item.href === base
              ? pathname === base
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold ${
                active ? "text-orange-700" : "text-slate-500"
              }`}
            >
              <Icon aria-hidden="true" size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function EmployeeShell(props: {
  session: EmployeeSession;
  locale: string;
  children: ReactNode;
}) {
  return (
    <QuoteDraftProvider>
      <ShellContent {...props} />
    </QuoteDraftProvider>
  );
}

export function EmployeePageHeader({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">{body}</p>
      </div>
      {actions}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const positive = ["available", "active", "confirmed", "paid", "sent"].includes(
    status,
  );
  const warning = [
    "low_stock",
    "partially_reserved",
    "temporarily_reserved",
    "pending",
    "pending_confirmation",
    "draft",
  ].includes(status);
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        positive
          ? "bg-emerald-100 text-emerald-800"
          : warning
            ? "bg-amber-100 text-amber-900"
            : "bg-slate-200 text-slate-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
