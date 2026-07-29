"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createCheckedAdminClient } from "./access";
import { locales } from "@/lib/constants";

const optionalNumber = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .pipe(z.number().finite().nonnegative().nullable());

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().uuid().nullable());

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

const specificationsSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) {
      return {};
    }

    try {
      const parsed = JSON.parse(value);

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        ctx.addIssue({
          code: "custom",
          message: "Specifications must be a JSON object.",
        });
        return z.NEVER;
      }

      return parsed as Record<string, unknown>;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Specifications must be valid JSON.",
      });
      return z.NEVER;
    }
  });

const productSchema = z.object({
  sku: z.string().trim().min(2).max(120),
  mpn: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180),
  title: z.string().trim().min(2).max(240),
  short_description: optionalText,
  description: optionalText,
  manufacturer_name: optionalText,
  brand_id: optionalId,
  category_id: optionalId,
  status: z.enum(["draft", "published", "archived"]),
  visibility: z.enum(["public", "authenticated"]),
  featured: z.boolean(),
  currency: z.string().trim().min(3).max(3),
  price: optionalNumber,
  compare_at_price: optionalNumber,
  price_visibility: z.enum(["public", "authenticated", "quote_only"]),
  stock_quantity: optionalNumber,
  stock_status: z.enum([
    "in_stock",
    "low_stock",
    "out_of_stock",
    "on_request",
    "discontinued",
    "limited",
    "quote",
  ]),
  minimum_order_quantity: optionalNumber,
  lead_time_min_days: optionalNumber,
  lead_time_max_days: optionalNumber,
  condition: optionalText,
  packaging: optionalText,
  country_of_origin: optionalText,
  datasheet_url: optionalText,
  specifications: specificationsSchema,
});

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function optionalUrlValue(formData: FormData, key: string) {
  const value = formValue(formData, key).trim();

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Unsupported protocol");
    }

    return url.toString();
  } catch {
    throw new Error(`${key} must be a valid HTTP or HTTPS URL.`);
  }
}

function primaryImagePayload(formData: FormData, title: string) {
  const publicUrl = optionalUrlValue(formData, "primary_image_url");
  const altText = formValue(formData, "primary_image_alt").trim() || title;

  if (!publicUrl) {
    return null;
  }

  return {
    public_url: publicUrl,
    alt_text: altText,
    storage_path: `external:${publicUrl}`,
    sort_order: 0,
    is_primary: true,
  };
}

function productPayload(formData: FormData) {
  const parsed = productSchema.parse({
    sku: formValue(formData, "sku"),
    mpn: formValue(formData, "mpn"),
    slug: formValue(formData, "slug"),
    title: formValue(formData, "title"),
    short_description: formValue(formData, "short_description"),
    description: formValue(formData, "description"),
    manufacturer_name: formValue(formData, "manufacturer_name"),
    brand_id: formValue(formData, "brand_id"),
    category_id: formValue(formData, "category_id"),
    status: formValue(formData, "status") || "draft",
    visibility: formValue(formData, "visibility") || "public",
    featured: formData.get("featured") === "on",
    currency: formValue(formData, "currency") || "USD",
    price: formValue(formData, "price"),
    compare_at_price: formValue(formData, "compare_at_price"),
    price_visibility: formValue(formData, "price_visibility") || "quote_only",
    stock_quantity: formValue(formData, "stock_quantity"),
    stock_status: formValue(formData, "stock_status") || "on_request",
    minimum_order_quantity: formValue(formData, "minimum_order_quantity") || "1",
    lead_time_min_days: formValue(formData, "lead_time_min_days"),
    lead_time_max_days: formValue(formData, "lead_time_max_days"),
    condition: formValue(formData, "condition"),
    packaging: formValue(formData, "packaging"),
    country_of_origin: formValue(formData, "country_of_origin"),
    datasheet_url: formValue(formData, "datasheet_url"),
    specifications: formValue(formData, "specifications"),
  });

  return {
    ...parsed,
    stock_quantity: parsed.stock_quantity === null ? null : Math.trunc(parsed.stock_quantity),
    minimum_order_quantity:
      parsed.minimum_order_quantity === null
        ? 1
        : Math.max(1, Math.trunc(parsed.minimum_order_quantity)),
    lead_time_min_days:
      parsed.lead_time_min_days === null
        ? null
        : Math.trunc(parsed.lead_time_min_days),
    lead_time_max_days:
      parsed.lead_time_max_days === null
        ? null
        : Math.trunc(parsed.lead_time_max_days),
    embedding_status:
      parsed.status === "published" ? "pending" : "disabled",
    published_at: parsed.status === "published" ? new Date().toISOString() : null,
    archived_at: parsed.status === "archived" ? new Date().toISOString() : null,
  };
}

async function logAdminAudit(
  supabase: NonNullable<Awaited<ReturnType<typeof createCheckedAdminClient>>["supabase"]>,
  actorId: string | undefined,
  action: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("admin_audit_logs").insert({
    actor_id: actorId || null,
    action,
    entity_type: "product",
    entity_id: entityId,
    metadata,
  });
}

async function savePrimaryProductImage(
  supabase: NonNullable<Awaited<ReturnType<typeof createCheckedAdminClient>>["supabase"]>,
  productId: string,
  image: ReturnType<typeof primaryImagePayload>,
) {
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId)
    .eq("is_primary", true);

  if (deleteError) {
    throw deleteError;
  }

  if (!image) {
    return;
  }

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    ...image,
  });

  if (insertError) {
    throw insertError;
  }
}

function revalidateProductPublicPaths(slugs: Array<string | null | undefined>) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))] as string[];

  updateTag("public-catalog");

  for (const item of locales) {
    revalidatePath(`/${item}/catalog`);

    for (const slug of uniqueSlugs) {
      revalidatePath(`/${item}/products/${slug}`);
    }
  }
}

export async function createProductAction(formData: FormData) {
  const locale = formValue(formData, "locale") || "en";
  const { supabase, access } = await createCheckedAdminClient();

  if (!supabase) {
    redirect(`/${locale}/admin/products?error=protected`);
  }

  let payload: ReturnType<typeof productPayload>;

  try {
    payload = productPayload(formData);
    primaryImagePayload(formData, payload.title);
  } catch {
    redirect(`/${locale}/admin/products/new?error=invalid_product`);
  }

  const primaryImage = primaryImagePayload(formData, payload.title);

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    redirect(`/${locale}/admin/products/new?error=save_failed`);
  }

  try {
    await savePrimaryProductImage(supabase, data.id, primaryImage);
  } catch {
    redirect(`/${locale}/admin/products/new?error=image_save_failed`);
  }

  await logAdminAudit(supabase, access.user?.id, "product_created", data?.id || null, {
    status: payload.status,
    price_visibility: payload.price_visibility,
  });

  revalidateProductPublicPaths([payload.slug]);
  redirect(`/${locale}/admin/products`);
}

export async function updateProductAction(formData: FormData) {
  const id = formValue(formData, "id");
  const locale = formValue(formData, "locale") || "en";
  const { supabase, access } = await createCheckedAdminClient();

  if (!supabase || !id) {
    redirect(`/${locale}/admin/products?error=protected`);
  }

  let payload: ReturnType<typeof productPayload>;
  const { data: existingProduct } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  try {
    payload = productPayload(formData);
    primaryImagePayload(formData, payload.title);
  } catch {
    redirect(`/${locale}/admin/products/${id}?error=invalid_product`);
  }

  const primaryImage = primaryImagePayload(formData, payload.title);

  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id);

  if (error) {
    redirect(`/${locale}/admin/products/${id}?error=save_failed`);
  }

  try {
    await savePrimaryProductImage(supabase, id, primaryImage);
  } catch {
    redirect(`/${locale}/admin/products/${id}?error=image_save_failed`);
  }

  await logAdminAudit(supabase, access.user?.id, "product_updated", id, {
    status: payload.status,
    stock_status: payload.stock_status,
    price_visibility: payload.price_visibility,
  });

  revalidateProductPublicPaths([existingProduct?.slug, payload.slug]);
  redirect(`/${locale}/admin/products`);
}

export async function setProductStatusAction(formData: FormData) {
  const id = formValue(formData, "id");
  const locale = formValue(formData, "locale") || "en";
  const status = formValue(formData, "status");
  const { supabase, access } = await createCheckedAdminClient();

  if (!supabase || !id || !["draft", "published", "archived"].includes(status)) {
    redirect(`/${locale}/admin/products?error=protected`);
  }

  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("products")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      archived_at: status === "archived" ? new Date().toISOString() : null,
      embedding_status: status === "published" ? "pending" : "disabled",
    })
    .eq("id", id);

  if (error) {
    redirect(`/${locale}/admin/products?error=save_failed`);
  }

  await logAdminAudit(supabase, access.user?.id, `product_${status}`, id, {
    status,
  });

  revalidateProductPublicPaths([product?.slug]);
  redirect(`/${locale}/admin/products`);
}
