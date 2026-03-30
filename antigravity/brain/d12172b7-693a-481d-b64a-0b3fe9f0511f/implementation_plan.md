# Implementación de Módulo de Ventas (UI Frontend)

El objetivo es implementar la pantalla de inicio del módulo de Ventas y su modal de creación/edición correspondientes a los recursos entregados (`ventas.png`, `modalventas.png`, `codeventas.html`, `codemodalventas.html`). Se mantendrá la estética de SaaS premium definida en `guidelines.md` y se unificará con la estructura modular ya iniciada en `Compras`.

## User Review Required

> [!IMPORTANT]
> Se utilizará data "mock" (simulada) para toda la interfaz, incluyendo la tabla principal y los items dentro del modal de nueva venta. Todo el cálculo de subtotales, IGV (18%) y total será gestionado internamente con el estado de React y no tendrá comunicación con un backend real por ahora.

## Proposed Changes

---

### Módulo de Tipos y Mock Data

#### [NEW] `lib/types/venta.ts`
- Se creará el archivo para contener las interfaces de TypeScript de `VentaDB`, `DetalleVentaDB` y `ClienteVentaDB`.
- Se añadirá el array `MOCK_VENTAS` (basado en el HTML), que incluye al menos 4 ventas base para popular la tabla.
- Se incluirán las funciones auxiliares de estilos visuales `getEstadoVentaStyle()` (para mostrar "Completado", "Pendiente", "Cancelado" con sus respectivos colores) y `getClienteInitialStyle()`.

---

### Módulo Principal de Ventas

#### [NEW] `app/ventas/page.tsx`
- Componente estructurado siguiendo los lineamientos de `app/compras/page.tsx` pero orientado a ventas.
- Utilizará todo el markup principal exportable desde `codeventas.html`, ajustando las clases y elementos a React `className`.
- Incluirá las tarjetas de "Venta total del mes", "Venta del día" y "Operaciones", además de la tabla de ventas con su header personalizado y mapeo sobre `MOCK_VENTAS`.
- Agregará el Floating Action Button (FAB) que se muestra al final del HTML entregado para poder abrir el modal fácilmente en cualquier tamaño de pantalla.
- Implementará un filtro local simple de búsqueda y estado usando `useState()`.

---

### Módulo de Modal de Venta

#### [NEW] `components/modules/ventas/VentaModal.tsx`
- Extraído de `codemodalventas.html`, ajustándolo para comportarse como un diálogo general en un overlay (`fixed z-50 bg-background/95`).
- Interfaz dividida en la selección de cliente, detalles de comprobante y buscador de productos.
- Implementará una tabla local de "carrito" donde se simule el cambio de cantidades con los botones `+ / -`.
- La actualización de cantidad disparará un recálculo en tiempo real del *Subtotal*, *IGV (18%)* y el *Total General*.
- Los botones de acciones de "Cancelar" o "Generar Venta" cerrarán el modal.

---

## Open Questions

> [!WARNING]
> ¿Existe alguna instrucción adicional respecto al manejo de monedas a utilizar? En el diseño se visualiza "S/" pero es importante confirmar si este símbolo debe estar hardcodeado en la UI o si prefieren externalizarlo. Asumiré que estará en el código para ajustarse estrictamente al diseño proporcionado.

## Verification Plan

### Manual Verification
- Ingresar a `/ventas` desde el Sidebar.
- Visualizar todos los _cards_ de estadísticas y observar la tabla.
- Asegurarse de que el input de búsqueda interactúa en vivo filtrando la data local falsa.
- Abrir una "Nueva Venta" desde cualquiera de los dos botones disponibles (superior derecha y FAB).
- Modificar las cantidades de los productos del carrito dentro del modal y verificar que los montos en la sección de resumen se actualicen automáticamente.
- Asegurarse de que la responsividad general de la tabla y la grilla se mantengan óptimas en ambos casos de uso (page y modal).
