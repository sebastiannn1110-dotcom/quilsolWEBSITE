"use client";

import { LoaderCircle, Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { commerceClient } from "@/lib/platform-api/client";
import { employeeCopy } from "@/lib/platform-api/employee-i18n";
import type {
  CreateCustomerInput,
  Customer,
} from "@/lib/platform-api/types";
import { EmployeePageHeader } from "./EmployeeShell";

type Field = {
  name: keyof CreateCustomerInput;
  label: string;
  type?: "text" | "email" | "tel";
  required?: boolean;
  wide?: boolean;
};

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
  const copy = employeeCopy(locale, {
    es: {
      eyebrow: "Clientes",
      editTitle: "Editar cliente",
      newTitle: "Nuevo cliente",
      body: "Registra los datos de facturación, contacto y entrega para preparar cotizaciones completas.",
      commercial: "Información comercial",
      company: "Nombre comercial o empresa",
      legal: "Razón social",
      tax: "Identificación fiscal",
      po: "Referencia u orden de compra",
      contactSection: "Contacto principal",
      contact: "Nombre del contacto",
      email: "Email",
      phone: "Teléfono",
      delivery: "Datos de entrega",
      recipient: "Persona que recibe",
      deliveryEmail: "Email de entrega",
      deliveryPhone: "Teléfono de entrega",
      address: "Dirección principal",
      address2: "Complemento, oficina o bodega",
      city: "Ciudad",
      state: "Estado, provincia o departamento",
      postal: "Código postal",
      country: "País",
      preferred: "Idioma preferido",
      notes: "Notas comerciales y de entrega",
      spanish: "Español",
      english: "Inglés",
      chinese: "Chino",
      saving: "Guardando…",
      update: "Actualizar cliente",
      save: "Guardar cliente",
      error: "No se pudo guardar el cliente.",
    },
    en: {
      eyebrow: "Customers",
      editTitle: "Edit customer",
      newTitle: "New customer",
      body: "Add billing, contact and delivery details to prepare complete quotes.",
      commercial: "Commercial information",
      company: "Trading name or company",
      legal: "Legal company name",
      tax: "Tax ID",
      po: "Purchase order reference",
      contactSection: "Primary contact",
      contact: "Contact name",
      email: "Email",
      phone: "Phone",
      delivery: "Delivery details",
      recipient: "Delivery recipient",
      deliveryEmail: "Delivery email",
      deliveryPhone: "Delivery phone",
      address: "Primary address",
      address2: "Suite, office or warehouse",
      city: "City",
      state: "State or province",
      postal: "Postal code",
      country: "Country",
      preferred: "Preferred language",
      notes: "Commercial and delivery notes",
      spanish: "Spanish",
      english: "English",
      chinese: "Chinese",
      saving: "Saving…",
      update: "Update customer",
      save: "Save customer",
      error: "Unable to save customer.",
    },
    zh: {
      eyebrow: "客户",
      editTitle: "编辑客户",
      newTitle: "新建客户",
      body: "填写账单、联系人和交付信息，以便生成完整报价。",
      commercial: "商业信息",
      company: "公司或商业名称",
      legal: "法定公司名称",
      tax: "税务编号",
      po: "采购订单参考",
      contactSection: "主要联系人",
      contact: "联系人姓名",
      email: "电子邮箱",
      phone: "电话",
      delivery: "交付信息",
      recipient: "收货人",
      deliveryEmail: "收货电子邮箱",
      deliveryPhone: "收货电话",
      address: "主要地址",
      address2: "办公室、仓库或补充地址",
      city: "城市",
      state: "省／州",
      postal: "邮政编码",
      country: "国家",
      preferred: "首选语言",
      notes: "商业及交付备注",
      spanish: "西班牙语",
      english: "英语",
      chinese: "中文",
      saving: "正在保存…",
      update: "更新客户",
      save: "保存客户",
      error: "无法保存客户。",
    },
  });

  const groups: Array<{ title: string; fields: Field[] }> = [
    {
      title: copy.commercial,
      fields: [
        { name: "companyOrName", label: copy.company, required: true },
        { name: "legalCompanyName", label: copy.legal },
        { name: "taxId", label: copy.tax },
        { name: "purchaseOrderReference", label: copy.po },
      ],
    },
    {
      title: copy.contactSection,
      fields: [
        { name: "contact", label: copy.contact, required: true },
        { name: "email", label: copy.email, type: "email", required: true },
        { name: "phone", label: copy.phone, type: "tel", required: true },
      ],
    },
    {
      title: copy.delivery,
      fields: [
        { name: "deliveryRecipient", label: copy.recipient, required: true },
        {
          name: "deliveryEmail",
          label: copy.deliveryEmail,
          type: "email",
          required: true,
        },
        {
          name: "deliveryPhone",
          label: copy.deliveryPhone,
          type: "tel",
          required: true,
        },
        { name: "address", label: copy.address, required: true, wide: true },
        { name: "addressLine2", label: copy.address2, wide: true },
        { name: "city", label: copy.city, required: true },
        { name: "stateOrProvince", label: copy.state, required: true },
        { name: "postalCode", label: copy.postal, required: true },
        { name: "country", label: copy.country, required: true },
      ],
    },
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "");
    try {
      const language = value("preferredLanguage");
      const input: CreateCustomerInput = {
        companyOrName: value("companyOrName"),
        legalCompanyName: value("legalCompanyName"),
        contact: value("contact"),
        email: value("email"),
        phone: value("phone"),
        country: value("country"),
        city: value("city"),
        address: value("address"),
        addressLine2: value("addressLine2"),
        stateOrProvince: value("stateOrProvince"),
        postalCode: value("postalCode"),
        deliveryRecipient: value("deliveryRecipient"),
        deliveryPhone: value("deliveryPhone"),
        deliveryEmail: value("deliveryEmail"),
        taxId: value("taxId"),
        purchaseOrderReference: value("purchaseOrderReference"),
        preferredLanguage:
          language === "en" || language === "zh" ? language : "es",
        commercialNotes: value("commercialNotes"),
      };
      if (customer) {
        await commerceClient.updateCustomer(customer.id, input);
      } else {
        await commerceClient.createCustomer(input);
      }
      router.push(`/${locale}/employee/customers`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <EmployeePageHeader
        eyebrow={copy.eyebrow}
        title={customer ? copy.editTitle : copy.newTitle}
        body={copy.body}
      />
      <form
        onSubmit={submit}
        className="max-w-5xl rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="space-y-8">
          {groups.map((group) => (
            <fieldset key={group.title}>
              <legend className="mb-4 text-lg font-semibold text-slate-950">
                {group.title}
              </legend>
              <div className="grid gap-5 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <label
                    key={field.name}
                    className={`grid gap-2 text-sm font-semibold text-slate-700 ${
                      field.wide ? "sm:col-span-2" : ""
                    }`}
                  >
                    {field.label}
                    <input
                      name={field.name}
                      type={field.type || "text"}
                      required={field.required}
                      maxLength={field.name === "address" ? 240 : 180}
                      defaultValue={
                        customer ? String(customer[field.name] || "") : ""
                      }
                      className="focus-ring min-h-12 rounded-lg border border-slate-300 px-4 font-normal"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              {copy.preferred}
              <select
                name="preferredLanguage"
                defaultValue={customer?.preferredLanguage || "es"}
                className="focus-ring min-h-12 rounded-lg border border-slate-300 bg-white px-4 font-normal"
              >
                <option value="es">{copy.spanish}</option>
                <option value="en">{copy.english}</option>
                <option value="zh">{copy.chinese}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
              {copy.notes}
              <textarea
                name="commercialNotes"
                defaultValue={customer?.commercialNotes || ""}
                rows={4}
                maxLength={1000}
                className="focus-ring rounded-lg border border-slate-300 p-4 font-normal"
              />
            </label>
          </div>
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
          {pending ? copy.saving : customer ? copy.update : copy.save}
        </button>
      </form>
    </div>
  );
}
