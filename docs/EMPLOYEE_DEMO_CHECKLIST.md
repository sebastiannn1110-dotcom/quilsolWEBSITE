# Guion de demostración del área comercial

## Preparación

- Confirmar en el servidor local: `EMPLOYEE_COMMERCE_DEMO_MODE=true`.
- Confirmar que `EMPLOYEE_MOCK_PASSWORD` y `EMPLOYEE_SESSION_SECRET` existen
  únicamente en `.env.local`.
- Iniciar `quiksol-web` y abrir `/es/employee/login`.
- Verificar el banner permanente: **MODO DEMOSTRACIÓN — Datos sintéticos**.
- Si quedaron datos de un ensayo anterior, usar **Reiniciar datos de
  demostración** antes de empezar.

## Recorrido de presentación

1. Iniciar sesión con el usuario `empleado1@quiksol.local`.
2. Presentar el dashboard y aclarar que todos los datos son sintéticos.
3. Abrir el catálogo y buscar el MPN sintético `QKS-0001-A`.
4. Agregar tres productos distintos a la cotización.
5. Abrir Clientes, crear o seleccionar un cliente sintético y pulsar
   **Cotizar**.
6. Ajustar cantidades, vigencia y notas; guardar la cotización.
7. Descargar la cotización PDF y mostrar la marca
   **DOCUMENTO DE PRUEBA — SIN VALIDEZ COMERCIAL**.
8. Pulsar **Apartar productos** y mostrar número y vencimiento de la reserva.
9. Pulsar **Confirmar pedido demo**.
10. Descargar el recibo PDF y comprobar que conserva los mismos tres productos,
    cantidades, cliente, vendedor, cotización y reserva.
11. Volver al catálogo y mostrar la disminución temporal de disponibilidad.
12. Aclarar que la conexión con el inventario central de `quick-sol` y Supabase
    corresponde a la siguiente fase.

## Mensajes que deben quedar claros

- La reserva y el pedido son simulados.
- No existe ninguna escritura en Supabase o `quick-sol`.
- Los precios son exclusivamente de demostración.
- El estado se conserva mientras dure el proceso local de la demo.
- **Reiniciar datos de demostración** restablece catálogo, clientes,
  cotizaciones, reservas, pedidos, recibos y el borrador temporal.

## Recuperación rápida

- Si una cantidad supera la disponibilidad, reducirla y volver a apartar.
- Si el inventario cambió, actualizar el catálogo y reconfirmar cantidades.
- Si se pierde la conexión, no intentar confirmar reservas o pedidos.
- Si se desea comenzar de cero, usar **Reiniciar datos de demostración**.
