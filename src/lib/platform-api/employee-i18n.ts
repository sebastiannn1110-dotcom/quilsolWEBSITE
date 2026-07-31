export type EmployeeLocale = "es" | "en" | "zh";

export function employeeLocale(locale: string): EmployeeLocale {
  if (locale === "en" || locale === "zh") return locale;
  return "es";
}

export function employeeCopy<T>(
  locale: string,
  translations: Record<EmployeeLocale, T>,
) {
  return translations[employeeLocale(locale)];
}

export function employeeIntlLocale(locale: string) {
  return employeeCopy(locale, {
    es: "es-CO",
    en: "en-US",
    zh: "zh-CN",
  });
}

const statusLabels: Record<EmployeeLocale, Record<string, string>> = {
  es: {
    available: "Disponible",
    low_stock: "Stock bajo",
    partially_reserved: "Reserva parcial",
    temporarily_reserved: "Reservado temporalmente",
    unavailable: "No disponible",
    updating: "Actualizando",
    pending: "Pendiente",
    active: "Activa",
    expired: "Vencida",
    cancelled: "Cancelada",
    converted_to_order: "Convertida en pedido",
    draft: "Borrador",
    sent: "Enviada",
    accepted: "Aceptada",
    rejected: "Rechazada",
    converted_to_reservation: "Convertida en reserva",
    pending_confirmation: "Pendiente de confirmación",
    confirmed: "Confirmado",
    fulfilled: "Completado",
    refunded: "Reembolsado",
    paid: "Pagado",
  },
  en: {
    available: "Available",
    low_stock: "Low stock",
    partially_reserved: "Partially reserved",
    temporarily_reserved: "Temporarily reserved",
    unavailable: "Unavailable",
    updating: "Updating",
    pending: "Pending",
    active: "Active",
    expired: "Expired",
    cancelled: "Cancelled",
    converted_to_order: "Converted to order",
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    rejected: "Rejected",
    converted_to_reservation: "Converted to reservation",
    pending_confirmation: "Pending confirmation",
    confirmed: "Confirmed",
    fulfilled: "Fulfilled",
    refunded: "Refunded",
    paid: "Paid",
  },
  zh: {
    available: "有货",
    low_stock: "库存不足",
    partially_reserved: "部分预留",
    temporarily_reserved: "临时预留",
    unavailable: "无货",
    updating: "更新中",
    pending: "待处理",
    active: "有效",
    expired: "已过期",
    cancelled: "已取消",
    converted_to_order: "已转为订单",
    draft: "草稿",
    sent: "已发送",
    accepted: "已接受",
    rejected: "已拒绝",
    converted_to_reservation: "已转为预留",
    pending_confirmation: "待确认",
    confirmed: "已确认",
    fulfilled: "已完成",
    refunded: "已退款",
    paid: "已付款",
  },
};

export function employeeStatusLabel(locale: string, status: string) {
  return (
    statusLabels[employeeLocale(locale)][status] ||
    status.replaceAll("_", " ")
  );
}

const productText: Record<EmployeeLocale, Record<string, string>> = {
  es: {},
  en: {
    Semiconductores: "Semiconductors",
    Conectividad: "Connectivity",
    Potencia: "Power",
    "Control industrial": "Industrial control",
    "Controlador electrónico para aplicaciones industriales.":
      "Electronic controller for industrial applications.",
    "Módulo de conectividad para integración de sistemas.":
      "Connectivity module for system integration.",
    "Componente de potencia para equipos electrónicos.":
      "Power component for electronic equipment.",
    "Dispositivo de control para automatización industrial.":
      "Control device for industrial automation.",
  },
  zh: {
    Semiconductores: "半导体",
    Conectividad: "连接组件",
    Potencia: "电源组件",
    "Control industrial": "工业控制",
    "Controlador electrónico para aplicaciones industriales.":
      "适用于工业应用的电子控制器。",
    "Módulo de conectividad para integración de sistemas.":
      "用于系统集成的连接模块。",
    "Componente de potencia para equipos electrónicos.":
      "适用于电子设备的电源组件。",
    "Dispositivo de control para automatización industrial.":
      "适用于工业自动化的控制设备。",
  },
};

export function employeeProductText(locale: string, value: string) {
  return productText[employeeLocale(locale)][value] || value;
}
