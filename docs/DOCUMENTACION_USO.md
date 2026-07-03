# Documentación de Uso - NovaFin AI Mobile

## Descripción General

NovaFin AI Mobile es una aplicación Android para el control integral de finanzas personales. Permite registrar gastos mensuales, gestionar deudas con cuotas fijas, definir presupuestos por categoría, establecer objetivos de ahorro, y visualizar resúmenes financieros con gráficos interactivos. Funciona completamente offline con almacenamiento local en SQLite.

## Módulos de la Aplicación

### 1. Panel Principal (Dashboard)

**Propósito:** Vista rápida del estado financiero actual.

**Componentes:**
- **Tarjetas resumen:** Total gastado del mes, ingresos, balance, deudas pendientes
- **Gráfico de torta:** Distribución de gastos por categoría
- **Gráfico de barras:** Comparativa de gastos por mes
- **Filtros:** Por rango de fechas, categoría, y estado

**Uso:**
1. Al iniciar la aplicación, se muestra el resumen del mes actual
2. Use los filtros superiores para cambiar el período de análisis
3. Deslize para ver más detalles

---

### 2. Control de Gastos Mensuales

**Propósito:** Registro y seguimiento de todos los gastos del mes.

**Funcionalidades:**
- **Registro de gastos:** Fecha, descripción, categoría, monto, estado
- **Estados disponibles:** Pendiente, Pagado, Cancelado
- **Selección múltiple:** Casillas para seleccionar varios gastos
- **Mover/Copiar al mes siguiente:** Selección múltiple de gastos para reubicar
- **Exportar:** Compartir CSV con todos los gastos filtrados
- **Filtros avanzados:** Por categoría, monto, fecha, texto, y estado
- **Ordenamiento:** Por fecha, monto, descripción, categoría

**Uso:**
1. Navegue a la sección "Gastos"
2. Toque "+" para agregar un nuevo gasto
3. Complete los campos: fecha, descripción, categoría, monto
4. Los gastos se muestran en una tabla ordenable
5. Use los filtros para encontrar gastos específicos
6. Para mover gastos al próximo mes: selecciónelos y toque "Mover"

---

### 3. Gestión de Deudas

**Propósito:** Control de deudas con cuotas y pagos parciales.

**Funcionalidades:**
- **Registro de deudas:** Nombre, monto total, cuotas, fecha de inicio
- **Registro de pagos:** Monto pagado, fecha de pago
- **Progreso visual:** Barras de progreso por deuda
- **Resumen:** Total adeudado, progreso global

**Uso:**
1. Registre su deuda con el monto total y número de cuotas
2. Cada vez que realice un pago, regístrelo
3. La app calcula automáticamente el progreso

---

### 4. Presupuestos

**Propósito:** Definir límites de gasto por categoría y mes.

**Funcionalidades:**
- **Presupuestos por categoría:** Asigne montos por categoría
- **Seguimiento en tiempo real:** Compare gastado vs. asignado
- **Estado visual:** Verde (bajo), Amarillo (alerta), Rojo (excedido)
- **Copia a mes siguiente:** Clone presupuestos entre meses

**Uso:**
1. Defina un presupuesto mensual total
2. Asigne montos por categoría
3. La app muestra el progreso de cada categoría
4. Copie el presupuesto al próximo mes cuando quiera mantener los mismos límites

---

### 5. Objetivos de Ahorro

**Propósito:** Establecer y seguir metas de ahorro.

**Funcionalidades:**
- **Creación de objetivos:** Nombre, monto objetivo, fecha límite
- **Seguimiento:** Barras de progreso con proyecciones
- **Estado:** En progreso, completado, vencido

**Uso:**
1. Cree un objetivo (ej: "Viaje", "Emergencia")
2. Establezca el monto y fecha límite
3. Registre ahorros periódicos
4. La app proyecta si alcanzará la meta

---

### 6. Patrimonio Neto

**Propósito:** Registrar todos los activos y calcular patrimonio.

**Funcionalidades:**
- **Registro de activos:** Nombre, tipo (efectivo, cuenta, auto, propiedad), valor, fecha
- **Evolución temporal:** Gráfico de evolución del patrimonio
- **Desglose por tipo:** Dónde está tu dinero

**Uso:**
1. Registre cada activo con su valor actual
2. Actualice los valores periódicamente
3. Visualice la evolución de su patrimonio

---

### 7. Flujo de Caja

**Propósito:** Comparar ingresos vs. egresos por mes.

**Funcionalidades:**
- **Registro de ingresos:** Fecha, descripción, categoría, monto
- **Gráfico de barras:** Ingresos vs. gastos por mes
- **Balance mensual:** Diferencia neta

**Uso:**
1. Registre sus ingresos mensuales
2. La app los compara automáticamente con los gastos
3. Identifique meses con superávit o déficit

---

### 8. Resumen Anual

**Propósito:** Vista consolidada del año completo.

**Funcionalidades:**
- **Resumen mensual:** Tabla con totales por mes
- **Gráficos anuales:** Evolución de gastos, ingresos y balance
- **Top categorías:** Las categorías con más gasto
- **Filtros:** Por categoría y rango de fechas

---

### 9. Dashboard Ejecutivo

**Propósito:** Score financiero de 0 a 100 y KPIs clave.

**Funcionalidades:**
- **Score financiero:** Calificación automática de tu salud financiera
- **KPIs:** Ratio ahorro, deuda/ingreso, diversificación
- **Tendencia:** Comparativa con meses anteriores

---

### 10. Inteligencia Artificial

**Propósito:** Análisis de tendencias y alertas inteligentes.

**Funcionalidades:**
- **Predicciones:** Proyección de gastos del próximo mes
- **Análisis de anomalías:** Gastos inusuales detectados
- **Alertas inteligentes:** Notificaciones de vencimientos y excesos
- **Patrones:** Análisis de hábitos de gasto

---

### 11. Reportes

**Propósito:** Generación de informes detallados.

**Funcionalidades:**
- **Resumen del mes:** Totales por categoría y estado
- **Comparativa mensual:** Mes actual vs. anterior
- **Recomendaciones:** Sugerencias basadas en tus datos
- **Exportar:** Compartir reporte como archivo

---

### 12. Hábitos Financieros

**Propósito:** Seguimiento de buenos hábitos financieros.

**Funcionalidades:**
- **Registro de hábitos:** Nombre, frecuencia, meta de días
- **Seguimiento diario:** Marque los días completados
- **Rachas:** Días consecutivos cumpliendo el hábito
- **Progreso:** Barras de avance y porcentaje

---

## Funcionalidades Transversales

### Seguridad

- **Bloqueo con clave:** Protección de acceso con contraseña SHA-512
- **Cambio de clave:** Actualice su contraseña desde Configuración
- **Eliminación de clave:** Opcional (se recomienda mantener protección)

### Copia de Seguridad

- **Exportar:** Genere un archivo JSON con toda la base de datos
- **Importar:** Restaure una copia de seguridad previa
- **Uso recomendado:** Realice copias periódicas antes de actualizaciones

### Navegación

- **Menú hamburguesa:** Acceso a todas las secciones (móvil)
- **Barra de navegación:** Tabs horizontales (desktop)
- **Configuración:** Botón de engranaje en el header

### Filtros

- **Búsqueda por texto:** Encuentre gastos por descripción
- **Filtro por categoría:** Seleccione una o más categorías
- **Filtro por estado:** Pendiente, pagado, cancelado
- **Rango de fechas:** Desde/hasta
- **Rango de montos:** Mínimo/máximo
- **Ordenamiento:** Ascendente/descendente por cualquier campo

### Gráficos

- **Torta (Pie):** Distribución por categoría
- **Barras (Bar):** Comparativa mensual o por categoría
- **Progreso:** Barras de avance para presupuestos y objetivos

### Exportación

- **CSV:** Compartir datos como archivo CSV
- **Backup JSON:** Copia completa de la base de datos
- **Compartir:** Usa el sistema nativo de Android Share

---

## Formato de Fechas

- **Entrada:** DD/MM/AAAA (formato argentino)
- **Almacenamiento:** AAAA-MM-DD (ISO 8601)
- **Visualización:** "1 de enero de 2026", "15 de marzo de 2026"

## Moneda

- **Símbolo:** $
- **Formato:** $1.234,56 (punto separador de miles, coma para decimales)
- **Localización:** Español (Argentina)
