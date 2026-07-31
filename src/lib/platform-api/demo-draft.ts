export type DemoDraftSnapshot<T> = {
  items: T[];
  customerId: string;
};

export function parseDemoDraft<T>(serialized: string | null): DemoDraftSnapshot<T> {
  if (!serialized) return { items: [], customerId: "" };

  try {
    const parsed = JSON.parse(serialized) as
      | T[]
      | { items?: unknown; customerId?: unknown };

    if (Array.isArray(parsed)) {
      return { items: parsed, customerId: "" };
    }

    return {
      items: Array.isArray(parsed.items) ? (parsed.items as T[]) : [],
      customerId:
        typeof parsed.customerId === "string" ? parsed.customerId : "",
    };
  } catch {
    return { items: [], customerId: "" };
  }
}

export function serializeDemoDraft<T>(snapshot: DemoDraftSnapshot<T>) {
  return JSON.stringify(snapshot);
}
