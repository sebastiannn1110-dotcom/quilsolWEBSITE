# Contrato provisional: Employee Commerce API

Estado: **provisional, no implementado todavía por `quick-sol`**.

Este documento define el contrato que `quick-sol` deberá implementar para el
área comercial de `quiksol-web`. Los ejemplos son sintéticos. Ningún MPN,
cliente, precio o identificador representa datos empresariales reales.

## Arquitectura y confianza

```text
Navegador
  -> /api/employee/* en quiksol-web
  -> /api/commerce/* en quick-sol
  -> PostgreSQL/Supabase
```

- El navegador nunca llama directamente a PostgreSQL, Supabase ni `quick-sol`.
- `PLATFORM_API_BASE_URL` es una variable exclusiva del servidor.
- Cuando ambas aplicaciones usen Supabase Auth, `quiksol-web` enviará
  `Authorization: Bearer <access_token>` desde el servidor.
- Nunca se enviará una `service_role` al navegador ni se registrarán tokens.
- `quick-sol` vuelve a validar sesión, rol, propiedad del registro, precios,
  descuentos, impuestos, cantidades, disponibilidad y total.

## Roles

| Operación | Employee | Manager | Admin |
|---|---:|---:|---:|
| Catálogo y clientes autorizados | Sí | Sí | Sí |
| Operaciones propias | Sí | Sí | Sí |
| Operaciones del equipo | No | Sí | Sí |
| Todas las operaciones | No | No | Sí |
| Aprobar descuento ampliado | No | Sí | Sí |
| Alertas de stock/conflictos | No | Sí | Sí |
| Auditoría y permisos | No | No | Sí |

La interfaz puede ocultar acciones, pero esa ocultación nunca constituye
autorización. Cada endpoint debe comprobar el permiso en servidor.

## Convenciones

### Cabeceras

```http
Authorization: Bearer <access_token>
Accept: application/json
Content-Type: application/json
Idempotency-Key: 3f2e0f87-6935-45e6-9188-a18456ab85ee
```

`Idempotency-Key` es obligatoria al crear reservas y pedidos. La misma clave,
usuario y carga deben devolver el resultado original sin repetir la operación.
La misma clave con otra carga debe devolver `409`.

### Respuesta de error

```json
{
  "error": {
    "code": "INVENTORY_CONFLICT",
    "message": "El inventario cambió mientras preparabas la venta.",
    "status": 409,
    "details": {
      "affectedProductIds": ["demo-product-007"]
    }
  }
}
```

Errores comunes:

- `400` solicitud inválida;
- `401` sesión ausente o vencida;
- `403` rol o propiedad insuficiente;
- `404` registro inexistente o no visible para el usuario;
- `409` conflicto de inventario o idempotencia;
- `422` dato o cantidad inválida;
- `429` límite de solicitudes;
- `500` fallo interno;
- `503` dependencia temporalmente indisponible.

No se deben devolver mensajes internos, consultas SQL, secretos, tokens ni
trazas.

### Paginación

Endpoints de colección aceptan `page`, `pageSize` (máximo 100), `sort` y los
filtros documentados. Formato:

```json
{
  "data": [],
  "page": 1,
  "pageSize": 24,
  "total": 0,
  "totalPages": 1
}
```

### Campos financieros prohibidos

Ninguna respuesta comercial al navegador puede incluir:

- costo interno o de proveedor;
- precio de compra;
- GP o utilidad bruta;
- margen;
- proveedor o precio de proveedor;
- claves, tokens o rutas privadas de almacenamiento.

Sólo se entrega `authorizedUnitPrice`. El servidor calcula el total final.

## Tipos principales

`EmployeeSession`:

```json
{
  "userId": "employee-sales-demo",
  "email": "empleado-ejemplo@quiksol.invalid",
  "fullName": "Empleado Ejemplo",
  "role": "employee",
  "expiresAt": "2030-01-01T20:00:00.000Z"
}
```

`InventoryAvailability`:

```json
{
  "availableQuantity": 32,
  "status": "available",
  "updatedAt": "2030-01-01T12:00:00.000Z",
  "revision": 18
}
```

`availableQuantity` ya representa:

```text
stockQuantity - reservedQuantity - committedQuantity
```

La web no reconstruye ese valor.

Estados admitidos:

- producto: `available`, `low_stock`, `partially_reserved`,
  `temporarily_reserved`, `unavailable`, `updating`;
- cotización: `draft`, `sent`, `accepted`, `rejected`, `expired`,
  `converted_to_reservation`, `converted_to_order`;
- reserva: `pending`, `active`, `partially_reserved`, `expired`, `cancelled`,
  `converted_to_order`;
- pedido: `pending_confirmation`, `confirmed`, `fulfilled`, `cancelled`,
  `refunded`.

## Autenticación y dashboard

### `POST /api/commerce/auth/session`

Autenticación: pública con limitación de intentos. Rol: cualquier empleado
activo.

Request:

```json
{
  "email": "empleado-ejemplo@quiksol.invalid",
  "password": "<secreto>",
  "remember": false
}
```

Response `201`:

```json
{
  "session": {
    "userId": "employee-sales-demo",
    "email": "empleado-ejemplo@quiksol.invalid",
    "fullName": "Empleado Ejemplo",
    "role": "employee",
    "expiresAt": "2030-01-01T20:00:00.000Z"
  },
  "accessToken": "<token de corta duración>"
}
```

Errores específicos: `400`, `401`, `429`, `503`. La contraseña jamás aparece
en respuesta o logs.

### `GET /api/commerce/employee/dashboard`

Autenticación: Bearer. Rol: Employee, Manager o Admin.

Response `200`: sesión, cotizaciones recientes, reservas activas, pedidos
recientes, stock bajo visible según rol, alertas, métricas y estado de
conexión. Employee recibe sólo sus operaciones; Manager las de su equipo; Admin
todas.

Errores: `401`, `403`, `503`.

## Catálogo

### `GET /api/commerce/catalog`

Autenticación: Bearer. Rol: todos los empleados.

Query: `query`, `manufacturer`, `category`, `status`, `sort`, `page`,
`pageSize`.

Response `200` paginada:

```json
{
  "data": [
    {
      "id": "demo-product-007",
      "mpn": "QKS-0007-B",
      "manufacturer": "Fabricante Sintético",
      "description": "Componente sintético de demostración.",
      "category": "Categoría de prueba",
      "imageUrl": null,
      "authorizedUnitPrice": 14.2,
      "currency": "USD",
      "minimumOrderQuantity": 1,
      "availability": {
        "availableQuantity": 18,
        "status": "available",
        "updatedAt": "2030-01-01T12:00:00.000Z",
        "revision": 9
      }
    }
  ],
  "page": 1,
  "pageSize": 24,
  "total": 1,
  "totalPages": 1
}
```

El MPN siempre es `string`; no se eliminan ceros iniciales ni guiones.

### `GET /api/commerce/catalog/:productId`

Autenticación: Bearer. Rol: todos. Response `200`: un `Product`.

Errores: `401`, `403`, `404`, `429`, `503`.

## Clientes

### `GET /api/commerce/customers`

Autenticación: Bearer. Employee ve clientes permitidos/propios, Manager equipo,
Admin todos. Admite búsqueda y paginación.

### `POST /api/commerce/customers`

Autenticación: Bearer. Rol: todos. Request:

```json
{
  "companyOrName": "Cliente Sintético SAS",
  "contact": "Persona Ejemplo",
  "email": "persona@cliente.invalid",
  "phone": "+57 300 000 0000",
  "country": "Colombia",
  "city": "Bogotá",
  "address": "Dirección de prueba 123",
  "taxId": "DEMO-123",
  "preferredLanguage": "es",
  "commercialNotes": "Datos no reales."
}
```

Response `201`: `Customer` con `id`, `createdAt` y `createdBy` del servidor.
Errores: `400`, `401`, `403`, `409`, `422`.

### `PATCH /api/commerce/customers/:customerId`

Autenticación y propiedad obligatorias. Request: campos editables del cliente.
Response `200`: `Customer`. Errores: `401`, `403`, `404`, `409`, `422`.

## Cotizaciones

### `GET /api/commerce/quotes`

Autenticación: Bearer. Alcance por rol. Respuesta paginada de `Quote`.

### `POST /api/commerce/quotes`

Autenticación: Bearer. Rol: todos. El servidor ignora precios y totales del
navegador.

```json
{
  "customerId": "demo-customer-001",
  "items": [
    {
      "productId": "demo-product-007",
      "quantity": 10,
      "discountPercent": 2
    }
  ],
  "validUntil": "2030-01-08",
  "notes": "Ejemplo sintético.",
  "commercialTerms": "Sujeto a confirmación."
}
```

Response `201`: `Quote` con MPN, precios autorizados, subtotal, impuestos y
total recalculados. Errores: `401`, `403`, `404`, `422`.

### `GET /api/commerce/quotes/:quoteId`

Autenticación y alcance por rol. Response `200`: `Quote`.

### `PATCH /api/commerce/quotes/:quoteId`

Sólo estados editables. Misma validación y recálculo que `POST`. Debe usar
control de versión para evitar sobrescritura. Errores: `403`, `404`, `409`,
`422`.

### `GET /api/commerce/quotes/:quoteId/pdf`

Autenticación y alcance por rol. Response `200 application/pdf`. El documento
incluye “Cotización — inventario sujeto a confirmación”. Nunca incluye campos
financieros prohibidos ni UUID internos.

## Reservas

### `POST /api/commerce/reservations`

Autenticación: Bearer. Rol: todos. `Idempotency-Key` obligatoria.

```json
{
  "quoteId": "demo-quote-001",
  "inventoryRevisions": {
    "demo-product-007": 9
  },
  "idempotencyKey": "3f2e0f87-6935-45e6-9188-a18456ab85ee"
}
```

`quick-sol` debe ejecutar una transacción atómica que:

1. vuelva a leer la cotización y precios;
2. bloquee o compare filas de inventario;
3. valide `availableQuantity` y revisiones;
4. cree reserva e items;
5. actualice cantidades reservadas;
6. registre auditoría;
7. confirme la transacción.

Response `201`: `Reservation`.

En conflicto, response `409`:

```json
{
  "error": {
    "code": "INVENTORY_CONFLICT",
    "message": "El inventario cambió mientras preparabas la venta. Otro vendedor pudo haber apartado estas unidades. Revisa la disponibilidad antes de continuar.",
    "status": 409,
    "details": {
      "affectedProductIds": ["demo-product-007"],
      "currentAvailability": [
        {
          "productId": "demo-product-007",
          "availableQuantity": 4,
          "revision": 10
        }
      ]
    }
  }
}
```

No se crea ninguna reserva falsa. La web conserva la cotización, actualiza el
catálogo y obliga a reconfirmar.

### `GET /api/commerce/reservations`

Autenticación y alcance por rol. Respuesta paginada.

### `GET /api/commerce/reservations/:reservationId`

Autenticación y alcance por rol. Response `200`: `Reservation`.

### `POST /api/commerce/reservations/:reservationId/cancel`

Autenticación. Employee sólo si las reglas futuras lo autorizan para una
reserva propia; Manager para su equipo; Admin para todas. La liberación de
inventario ocurre atómicamente en `quick-sol`.

Errores: `401`, `403`, `404`, `409`, `422`.

## Pedidos

### `POST /api/commerce/orders`

Autenticación: Bearer. Rol: todos. `Idempotency-Key` obligatoria.

```json
{
  "reservationId": "demo-reservation-001",
  "idempotencyKey": "a3e0e38d-d24d-40b9-bf86-93c68c1fb898"
}
```

`quick-sol` valida que la reserva esté activa y convierte sus unidades
atómicamente. La web nunca marca por sí sola un pedido como confirmado.

Response `201`: `Order`. Errores: `401`, `403`, `404`, `409`, `422`.

### `GET /api/commerce/orders`

Autenticación y alcance por rol. Respuesta paginada.

### `GET /api/commerce/orders/:orderId`

Autenticación y alcance por rol. Response `200`: `Order`.

### `GET /api/commerce/orders/:orderId/receipt`

Autenticación y alcance por rol. Sólo `confirmed` o `fulfilled`.
Response `200 application/pdf` con “Pedido confirmado”, referencia verificable
y estado de pago. Para cualquier otro estado devuelve `422
ORDER_NOT_CONFIRMED`.

## Actualización de inventario

La primera integración usará polling cada 15–30 segundos sólo mientras el
catálogo esté visible. Una evolución puede ofrecer:

- Supabase Realtime procesado por `quick-sol`;
- SSE;
- WebSocket.

En cualquier caso, el evento entrega `productId`, `availableQuantity`,
`status`, `updatedAt` y `revision`. La reserva definitiva sigue siendo
transaccional; Realtime no reemplaza la confirmación.

## Requisitos de implementación para `quick-sol`

- esquemas de entrada con límites de cantidad y texto;
- precios, descuentos, impuestos y totales calculados en servidor;
- transacciones atómicas para reservas, cancelaciones y pedidos;
- autorización por rol y propiedad;
- rate limiting para login y mutaciones;
- claves de idempotencia persistidas;
- auditoría sin secretos;
- respuestas sin campos financieros prohibidos;
- pruebas de carrera que produzcan un único ganador y `409` para el resto;
- paginación estable y límites máximos;
- nunca confiar en disponibilidad, precio o total enviados por navegador.
