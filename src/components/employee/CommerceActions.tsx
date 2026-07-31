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
import type { Quote, Reservation } from "@/lib/platform-api/types";
import { useQuoteDraft } from "./QuoteDraftProvider";

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
      Duplicar
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

  async function reserve() {
    if (!navigator.onLine) {
      setMessage(
        "Sin conexión. La disponibilidad debe verificarse antes de confirmar.",
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
          : "No fue posible solicitar la reserva.",
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
        {pending ? "Verificando…" : "Apartar productos"}
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
                Productos afectados:{" "}
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
                Actualizar inventario
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SendQuoteButton({ quote }: { quote: Quote }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

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
          : "No fue posible enviar la cotización.",
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
        {pending ? "Enviando…" : "Marcar como enviada"}
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

  async function confirm() {
    if (!navigator.onLine) {
      setMessage("Sin conexión: no se puede confirmar un pedido.");
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
          : "No fue posible confirmar el pedido.",
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
        {pending ? "Confirmando…" : "Confirmar pedido demo"}
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
}: {
  reservation: Reservation;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

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
          : "No fue posible cancelar la reserva.",
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
        {pending ? "Cancelando…" : "Cancelar reserva"}
      </button>
      {message ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
