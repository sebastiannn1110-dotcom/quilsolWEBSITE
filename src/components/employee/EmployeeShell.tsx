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
  ShoppingBag,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { commerceClient } from "@/lib/platform-api/client";
import {
  employeeCopy,
  employeeStatusLabel,
} from "@/lib/platform-api/employee-i18n";
import { can } from "@/lib/platform-api/permissions";
import type { EmployeeSession } from "@/lib/platform-api/types";
import { EmployeeAutoRefresh } from "./EmployeeAutoRefresh";
import { EmployeeLanguageSwitcher } from "./EmployeeLanguageSwitcher";
import { PwaRegister } from "./PwaRegister";
import { QuoteDraftProvider, useQuoteDraft } from "./QuoteDraftProvider";

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
  const { items } = useQuoteDraft();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const copy = employeeCopy(locale, {
    es: {
      home: "Inicio",
      catalog: "Catálogo",
      customers: "Clientes",
      quotes: "Cotizaciones",
      reservations: "Reservas",
      orders: "Pedidos",
      area: "Área comercial",
      teamView: "Vista de equipo activa",
      teamBody: "Puedes revisar alertas y conflictos.",
      admin: "Administrador",
      manager: "Manager",
      employee: "Empleado",
      quote: "Cotización",
      offline:
        "Sin conexión. La disponibilidad debe verificarse antes de confirmar.",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      logout: "Cerrar sesión",
      quickNav: "Navegación rápida",
    },
    en: {
      home: "Home",
      catalog: "Catalog",
      customers: "Customers",
      quotes: "Quotes",
      reservations: "Reservations",
      orders: "Orders",
      area: "Commercial workspace",
      teamView: "Team view active",
      teamBody: "You can review alerts and conflicts.",
      admin: "Administrator",
      manager: "Manager",
      employee: "Employee",
      quote: "Quote",
      offline: "Offline. Availability must be verified before confirming.",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      logout: "Sign out",
      quickNav: "Quick navigation",
    },
    zh: {
      home: "首页",
      catalog: "产品目录",
      customers: "客户",
      quotes: "报价",
      reservations: "预留",
      orders: "订单",
      area: "商务工作区",
      teamView: "团队视图已启用",
      teamBody: "您可以查看提醒和冲突。",
      admin: "管理员",
      manager: "经理",
      employee: "员工",
      quote: "报价",
      offline: "当前离线。确认前必须核实库存。",
      openMenu: "打开菜单",
      closeMenu: "关闭菜单",
      logout: "退出登录",
      quickNav: "快捷导航",
    },
  });
  const roleLabels = {
    admin: copy.admin,
    manager: copy.manager,
    employee: copy.employee,
  };
  const base = `/${locale}/employee`;
  const navigation = [
    { href: base, label: copy.home, icon: Home },
    { href: `${base}/catalog`, label: copy.catalog, icon: Boxes },
    { href: `${base}/customers`, label: copy.customers, icon: Users },
    { href: `${base}/quotes`, label: copy.quotes, icon: FileText },
    {
      href: `${base}/reservations`,
      label: copy.reservations,
      icon: ClipboardList,
    },
    { href: `${base}/orders`, label: copy.orders, icon: ShoppingBag },
  ];

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

  async function logout() {
    await commerceClient.logout().catch(() => undefined);
    router.replace(`${base}/login`);
    router.refresh();
  }

  function navigationLinks(onNavigate?: () => void) {
    return navigation.map((item) => {
      const active =
        item.href === base
          ? pathname === base
          : pathname.startsWith(item.href);
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
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
    });
  }

  return (
    <div className="employee-portal-root min-h-dvh bg-[#f5f3ef] text-slate-950">
      <PwaRegister />
      <EmployeeAutoRefresh />
      {!online ? (
        <div className="fixed inset-x-0 top-0 z-[80] flex min-h-11 items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          <WifiOff aria-hidden="true" size={17} />
          {copy.offline}
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
        <nav className="flex-1 space-y-1 p-4" aria-label={copy.area}>
          {navigationLinks()}
        </nav>
        {can(session.role, "stock_alerts:read") ? (
          <div className="mx-4 mb-3 rounded-xl border border-orange-300/20 bg-orange-400/10 p-4 text-xs leading-5 text-orange-100">
            <strong>{copy.teamView}</strong>
            <br />
            {copy.teamBody}
          </div>
        ) : null}
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-semibold">{session.fullName}</p>
          <p className="mt-1 truncate text-xs text-teal-100/65">
            {session.email}
          </p>
          <p className="mt-1 text-xs text-teal-100/65">
            {roleLabels[session.role]}
          </p>
          <button
            type="button"
            onClick={logout}
            className="focus-ring mt-4 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"
          >
            <LogOut aria-hidden="true" size={18} />
            {copy.logout}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header
          className={`sticky z-40 border-b border-stone-200 bg-white/95 backdrop-blur ${
            online ? "top-0" : "top-11"
          }`}
        >
          <div className="flex min-h-18 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label={copy.openMenu}
              >
                <Menu aria-hidden="true" />
              </button>
              <Image
                src="/logos/quicksol-logo.svg"
                alt="Quiksol"
                width={135}
                height={34}
                className="hidden sm:block lg:hidden"
              />
              <div className="hidden lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-700">
                  {copy.area}
                </p>
                <p className="text-sm text-slate-500">
                  {session.fullName} · {roleLabels[session.role]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <EmployeeLanguageSwitcher locale={locale} />
              <Link
                href={`${base}/quotes/new`}
                className="focus-ring relative inline-flex min-h-11 items-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white hover:bg-orange-500 sm:px-4"
              >
                <PackageCheck aria-hidden="true" size={19} />
                <span className="hidden sm:inline">{copy.quote}</span>
                {items.length ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-orange-700">
                    {items.length}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100dvh-72px)] pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setOpen(false)}
            aria-label={copy.closeMenu}
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
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/10"
                aria-label={copy.closeMenu}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-5 space-y-2">
              {navigationLinks(() => setOpen(false))}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="focus-ring mt-auto flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold hover:bg-white/10"
            >
              <LogOut aria-hidden="true" size={20} />
              {copy.logout}
            </button>
          </aside>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,.08)] lg:hidden"
        aria-label={copy.quickNav}
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

export function StatusBadge({
  status,
  locale = "es",
}: {
  status: string;
  locale?: string;
}) {
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
      {employeeStatusLabel(locale, status)}
    </span>
  );
}
