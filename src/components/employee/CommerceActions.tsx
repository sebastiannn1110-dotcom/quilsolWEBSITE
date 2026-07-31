"use client";

import {
  Copy,
  LoaderCircle,
  PackageCheck,
  Send,
  RefreshCw,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CommerceClientError } from "@/lib/platform-api/client";
import { employeeCopy } from "@/lib/platform-api/employee-i18n";
import type { Quote, Reservation } from "@/lib/platform-api/types";
import { useQuoteDraft } from "./QuoteDraftProvider";

function actionsCopy(locale: string) {
  return employeeCopy(locale, {
    es: {
      duplicate: "Duplicar",
      offlineReserve: "Sin conexión. Verifica la disponibilidad antes de confirmar.",
      reserveError: "No fue posible solicitar la reserva.",
      verifying: "Verificando…",
      reserve: "Reservar productos",
      affected: "Productos afectados",
      refreshInventory: "Actualizar inventario",
      sendError: "No fue posible enviar la cotización.",
      sending: "Enviando…",
      markSent: "Marcar como enviada",
      offlineOrder: "Sin conexión: no se puede confirmar un pedido.",
      orderError: "No fue posible confirmar el pedido.",
      confirming: "Confirmando…",
      confirmOrder: "Confirmar pedido",
      cancelError: "No fue posible cancelar la reserva.",
      cancelling: "Cancelando…",
      cancelReservation: "Cancelar reserva",
    },
    en: {
      duplicate: "Duplicate",
      offlineReserve: "Offline. Verify availability before confirming.",
      reserveError: "Unable to request the reservation.",
      verifying: "Verifying…",
      reserve: "Reserve products",
      affected: "Affected products",
      refreshInventory: "Refresh inventory",
      sendError: "Unable to send the quote.",
      sending: "Sending…",
      markSent: "Mark as sent",
      offlineOrder: "Offline: the order cannot be confirmed.",
      orderError: "Unable to confirm the order.",
      confirming: "Confirming…",
      confirmOrder: "Confirm order",
      cancelError: "Unable to cancel the reservation.",
      cancelling: "Cancelling…",
      cancelReservation: "Cancel reservation",
    },
    zh: {
      duplicate: "复制",
      offlineReserve: "当前离线。确认前请核实库存。",
      reserveError: "无法申请预留。",
      verifying: "正在验证…",
      reserve: "预留产品",
      affected: "受影响的产品",
      refreshInventory: "更新库存",
      sendError: "无法发送报价。",
      sending: "正在发送…",
      markSent: "标记为已发送",
      offlineOrder: "当前离线：无法确认订单。",
      orderError: "无法确认订单。",
      confirming: "正在确认…",
      confirmOrder: "确认订单",
      cancelError: "无法取消预留。",
      cancelling: "正在取消…",
      cancelReservation: "取消预留",
    },
  });
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/employee${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new CommerceClientError(
      response.status,
      payload.error?.code || `HTTP_${response.status}`,
      payload.error?.message || "No fue posible completar la operación.",
      payload.error?.details,
    );
  }
  return payload as T;
}

export function DuplicateQuoteButton({
  quote,
  locale,
}: {
  quote: Quote;
  locale: string;
}) {
  const router = useRouter();
  const draft = useQuoteDraft();
  const copy = actionsCopy(locale);

  function duplicate() {
    draft.clear();
    quote.items.forEach((item) =>
      draft.addProduct({
        id: item.productId,
        mpn: item.mpn,
        manufacturer: item.manufacturer,
        description: item.description,
        category: "Producto de cotización",
        imageUrl: null,
        authorizedUnitPrice: item.authorizedUnitPrice,
        currency: "USD",
        minimumOrderQuantity: 1,
        availability: {
          availableQuantity: item.quantity,
          status: "updating",
          updatedAt: new Date().toISOString(),
          revision: item.availabilityRevision,
        },
      }),
    );
    router.push(
      `/${locale}/employee/quotes/new?customer=${encodeURIComponent(
        quote.customer.id,
      )}`,
    );
  }

  return (
    <button
      type="button"
      onClick={duplicate}
      className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 font-semibold"
    >
      <Copy aria-hidden="true" size={18} />
      {copy.duplicate}
    </button>
  );
}

export function ReserveQuoteButton({
  quote,
  locale,
}: {
  quote: Quote;
  locale: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState<string[]>([]);
  const copy = actionsCopy(locale);

  async function reserve() {
    if (!navigator.onLine) {
      setMessage(
        copy.offlineReserve,
      );
      return;
    }
    setPending(true);
    setMessage("");
    setConflict([]);
    try {
      const reservation = await apiPost<Reservation>("/reservations", {
        quoteId: quote.id,
        inventoryRevisions: Object.fromEntries(
          quote.items.map((item) => [
            item.productId,
            item.availabilityRevision,
          ]),
        ),
        idempotencyKey: crypto.randomUUID(),
      });
      router.push(
        `/${locale}/employee/reservations/${reservation.id}`,
      );
      router.refresh();
    } catch (error) {
      if (error instanceof CommerceClientError && error.status === 409) {
        const details = error.details as
          | { affectedProductIds?: string[] }
          | undefined;
        setConflict(details?.affectedProductIds || []);
      }
      setMessage(
        error instanceof Error
          ? error.message
          : copy.reserveError,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={reserve}
        disabled={
          pending || !["draft", "sent", "accepted"].includes(quote.status)
        }
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-semibold text-white disabled:bg-slate-300 sm:w-auto"
      >
        {pending ? (
          <LoaderCircle className="animate-spin" size={19} />
        ) : (
          <PackageCheck size={19} />
        )}
        {pending ? copy.verifying : copy.reserve}
      </button>
      {message ? (
        <div
          className={`rounded-lg border p-4 text-sm leading-6 ${
            conflict.length
              ? "border-amber-300 bg-amber-50 text-amber-950"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          <p>{message}</p>
          {conflict.length ? (
            <>
              <p className="mt-2 font-semibold">
                {copy.affected}:{" "}
                {quote.items
                  .filter((item) => conflict.includes(item.productId))
                  .map((item) => item.mpn)
                  .join(", ")}
              </p>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/employee/catalog`)}
                className="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-400 px-4 font-semibold"
              >
                <RefreshCw size={17} />
                {copy.refreshInventory}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SendQuoteButton({
  quote,
  locale,
}: {
  quote: Quote;
  locale: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const copy = actionsCopy(locale);

  async function send() {
    setPending(true);
    setMessage("");
    try {
      await apiPost(`/quotes/${quote.id}/send`, {});
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copy.sendError,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={send}
        disabled={pending || quote.status !== "draft"}
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#062f33] px-4 font-semibold text-white disabled:bg-slate-300"
      >
        <Send aria-hidden="true" size={18} />
        {pending ? copy.sending : copy.markSent}
      </button>
      {message ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function ConfirmOrderButton({
  reservation,
  locale,
}: {
  reservation: Reservation;
  locale: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const copy = actionsCopy(locale);

  async function confirm() {
    if (!navigator.onLine) {
      setMessage(copy.offlineOrder);
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const order = await apiPost<{ id: string }>("/orders", {
        reservationId: reservation.id,
        idempotencyKey: crypto.randomUUID(),
      });
      router.push(`/${locale}/employee/orders/${order.id}`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copy.orderError,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={confirm}
        disabled={pending || reservation.status !== "active"}
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-semibold text-white disabled:bg-slate-300 sm:w-auto"
      >
        {pending ? (
          <LoaderCircle className="animate-spin" size={19} />
        ) : (
          <ShoppingBag size={19} />
        )}
        {pending ? copy.confirming : copy.confirmOrder}
      </button>
      {message ? (
        <p
          className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function CancelReservationButton({
  reservation,
  locale,
}: {
  reservation: Reservation;
  locale: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const copy = actionsCopy(locale);

  async function cancel() {
    setPending(true);
    setMessage("");
    try {
      await apiPost(`/reservations/${reservation.id}/cancel`, {});
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copy.cancelError,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={cancel}
        disabled={
          pending ||
          !["active", "partially_reserved"].includes(reservation.status)
        }
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 font-semibold text-red-700 disabled:text-slate-400"
      >
        <XCircle aria-hidden="true" size={19} />
        {pending ? copy.cancelling : copy.cancelReservation}
      </button>
      {message ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
