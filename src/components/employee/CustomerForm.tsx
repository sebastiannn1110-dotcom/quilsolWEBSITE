"use client";

import { LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { commerceClient } from "@/lib/platform-api/client";
import type {
  CreateCustomerInput,
  Customer,
} from "@/lib/platform-api/types";
import { EmployeePageHeader } from "./EmployeeShell";

const fields = [
  { name: "companyOrName", label: "Empresa o nombre", required: true },
  { name: "contact", label: "Contacto", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Teléfono", type: "tel", required: true },
  { name: "country", label: "País", required: true },
  { name: "city", label: "Ciudad", required: true },
  { name: "address", label: "Dirección", required: true },
  {
    name: "taxId",
    label: "Identificación fiscal (opcional)",
    required: false,
  },
] as const;

export function CustomerForm({
  locale,
  customer,
}: {
  locale: string;
  customer?: Customer;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const input: CreateCustomerInput = {
        companyOrName: String(form.get("companyOrName") || ""),
        contact: String(form.get("contact") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        country: String(form.get("country") || ""),
        city: String(form.get("city") || ""),
        address: String(form.get("address") || ""),
        taxId: String(form.get("taxId") || ""),
        preferredLanguage:
          form.get("preferredLanguage") === "en" ? "en" : "es",
        commercialNotes: String(form.get("commercialNotes") || ""),
      };
      if (customer) {
        await commerceClient.updateCustomer(customer.id, input);
      } else {
        await commerceClient.createCustomer(input);
      }
      router.push(`/${locale}/employee/customers`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo crear el cliente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow="Clientes"
        title={customer ? "Editar cliente" : "Nuevo cliente"}
        body="Completa los datos comerciales. El backend real deberá confirmar la operación antes de considerarla definitiva."
      />
      <form
        onSubmit={submit}
        className="max-w-4xl rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <label
              key={field.name}
              className={`grid gap-2 text-sm font-semibold text-slate-700 ${
                field.name === "address" ? "sm:col-span-2" : ""
              }`}
            >
              {field.label}
              <input
                name={field.name}
                type={"type" in field ? field.type : "text"}
                required={field.required}
                maxLength={field.name === "address" ? 240 : 180}
                defaultValue={
                  customer
                    ? String(customer[field.name as keyof Customer] || "")
                    : ""
                }
                className="focus-ring min-h-12 rounded-lg border border-slate-300 px-4 font-normal"
              />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Idioma preferido
            <select
              name="preferredLanguage"
              defaultValue={customer?.preferredLanguage || "es"}
              className="focus-ring min-h-12 rounded-lg border border-slate-300 bg-white px-4 font-normal"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
            Notas comerciales
            <textarea
              name="commercialNotes"
              defaultValue={customer?.commercialNotes || ""}
              rows={4}
              maxLength={1000}
              className="focus-ring rounded-lg border border-slate-300 p-4 font-normal"
            />
          </label>
        </div>
        <div className="mt-6 flex gap-3 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
          Este registro se guardará únicamente en la API mock local y estará
          marcado como sintético.
        </div>
        {message ? (
          <p
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="focus-ring mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 font-semibold text-white disabled:bg-slate-300"
        >
          {pending ? (
            <LoaderCircle className="animate-spin" size={19} />
          ) : (
            <Save size={19} />
          )}
          {pending
            ? "Guardando…"
            : customer
              ? "Actualizar cliente de prueba"
              : "Guardar cliente de prueba"}
        </button>
      </form>
    </div>
  );
}
