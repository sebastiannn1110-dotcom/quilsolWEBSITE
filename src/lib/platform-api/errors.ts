export class PlatformApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "PlatformApiError";
  }
}

export const inventoryConflictMessage =
  "El inventario cambió mientras preparabas la venta. Otro vendedor pudo haber apartado estas unidades. Revisa la disponibilidad antes de continuar.";

export function toPlatformApiError(error: unknown) {
  if (error instanceof PlatformApiError) {
    return error;
  }

  return new PlatformApiError(
    500,
    "INTERNAL_ERROR",
    "No fue posible completar la operación. Intenta nuevamente.",
  );
}
