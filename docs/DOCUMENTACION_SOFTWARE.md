# Documentación Técnica - Componentes y Versiones

## Resumen del Proyecto

**NovaFin AI Mobile** es una aplicación Android construida con Capacitor + React + TypeScript, utilizando SQLite nativo para el almacenamiento local de datos financieros.

## Stack Tecnológico

### Framework Principal

| Componente | Versión | Propósito |
|------------|---------|-----------|
| **Capacitor** | ^8.4.1 | Framework de apps nativas híbridas |
| **React** | ^19.2.7 | Biblioteca de interfaces de usuario |
| **React DOM** | ^19.2.7 | Renderizado de React en el DOM |
| **TypeScript** | ~6.0.2 | Lenguaje de tipado estático |
| **Vite** | ^8.1.1 | Build tool y servidor de desarrollo |

### Frontend

| Componente | Versión | Propósito |
|------------|---------|-----------|
| **TailwindCSS** | ^4.3.2 | Framework de CSS utility-first |
| **@tailwindcss/vite** | ^4.3.2 | Plugin Vite para TailwindCSS v4 |
| **chart.js** | ^4.5.1 | Librería de gráficos |
| **react-chartjs-2** | ^5.3.1 | Wrapper de React para Chart.js |

### Plugins Capacitor

| Plugin | Versión | Propósito |
|--------|---------|-----------|
| **@capacitor-community/sqlite** | ^8.1.0 | SQLite nativo persistente |
| **@capacitor/filesystem** | ^8.1.2 | Acceso al sistema de archivos |
| **@capacitor/share** | ^8.0.1 | Compartir archivos nativo |
| **@capacitor/local-notifications** | ^8.2.0 | Notificaciones locales |
| **@capacitor/push-notifications** | ^8.1.1 | Notificaciones push |
| **@capacitor/preferences** | ^8.0.1 | Almacenamiento clave-valor |
| **@capacitor/dialog** | ^8.0.1 | Diálogos nativos |
| **@capacitor/network** | ^8.0.1 | Detección de red |

### Herramientas de Desarrollo

| Componente | Versión | Propósito |
|------------|---------|-----------|
| **@types/react** | ^19.1.2 | Tipos TypeScript para React |
| **@types/react-dom** | ^19.1.2 | Tipos TypeScript para React DOM |
| **@vitejs/plugin-react** | ^4.4.1 | Plugin Vite para React |
| **gradle** | 8.14.3 | Sistema de build Android |

---

## Arquitectura del Proyecto

```
novafin-mobile/
├── capacitor.config.ts        # Configuración Capacitor (app ID, plugins)
├── android/                   # Proyecto Android nativo
│   └── app/
│       └── src/main/
│           ├── assets/public/ # Assets web compilados
│           └── java/          # Código Java nativo
├── src/
│   ├── App.tsx                # Componente raíz + Router de 12 vistas
│   ├── main.tsx               # Punto de entrada React
│   ├── index.css              # TailwindCSS + estilos globales
│   ├── vite-env.d.ts          # Definiciones de tipos Vite
│   ├── services/
│   │   ├── types.ts           # Interfaces TypeScript (12 interfaces, 20+ tipos)
│   │   ├── database.ts        # DatabaseService (44 métodos, 12 tablas)
│   │   ├── notificaciones.ts  # NotificationService (recordatorios)
│   │   └── exportService.ts   # ExportService (Share + Filesystem)
│   ├── hooks/
│   │   └── useDatabase.ts     # Hook useDatabase() + useAsyncData()
│   └── components/
│       ├── Dashboard.tsx          # Resumen + gráficos torta/barras
│       ├── GastosMes.tsx          # CRUD gastos + selección + filtros
│       ├── Deudas.tsx             # Deudas + pagos + filtros
│       ├── Presupuestos.tsx       # Presupuestos por categoría
│       ├── Objetivos.tsx          # Metas de ahorro
│       ├── Patrimonio.tsx         # Activos + patrimonio neto
│       ├── FlujoCaja.tsx          # Ingresos vs egresos
│       ├── ResumenAnual.tsx       # Resumen del año
│       ├── DashboardEjecutivo.tsx # Score financiero (0-100)
│       ├── Inteligencia.tsx       # Análisis IA + anomalías
│       ├── Reportes.tsx           # Informes + recomendaciones
│       ├── Habitos.tsx            # Hábitos financieros + rachas
│       ├── FilterBar.tsx          # Filtros reutilizables (3 variantes)
│       ├── SortHeader.tsx         # Ordenamiento de columnas
│       ├── LockScreen.tsx         # Pantalla de bloqueo con clave
│       └── SettingsModal.tsx      # Configuración (seguridad, backup)
├── docs/                      # Documentación del proyecto
│   ├── DOCUMENTACION_USO.md
│   ├── DOCUMENTACION_SOFTWARE.md
│   ├── MANUAL_USUARIO.md
│   ├── MANUAL_INSTALACION.md
│   ├── PROCEDIMIENTOS.md
│   ├── PROYECTO_EJECUTIVO.md
│   └── ROADMAP.md
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
└── NovaFin-Debug.apk         # APK compilada (26 MB)
```

---

## Base de Datos

### Conexión

- **Motor:** SQLite nativo via `@capacitor-community/sqlite`
- **Nombre:** `novafin_db`
- **Cifrado:** No (modos `no-encryption` y `no-encryption`)
- **Persistencia:** Automática en almacenamiento nativo del dispositivo

### Tablas (12)

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `gastos` | Registros de gastos | fecha, descripcion, categoria, monto, mes, anio, estado |
| `deudas` | Deudas con cuotas | nombre, monto_total, cuotas_totales, cuotas_pagadas, fecha_inicio, estado |
| `pagos_deuda` | Pagos de deudas | deuda_id FK, fecha, monto_pagado |
| `categorias` | Catálogo de categorías | nombre, icono |
| `presupuestos` | Cabeceras de presupuesto | nombre, mes, anio, monto_total |
| `presupuesto_categorias` | Asignaciones por categoría | presupuesto_id FK, categoria, monto_asignado |
| `objetivos` | Metas de ahorro | nombre, monto_objetivo, monto_actual, fecha_limite, estado, color, icono |
| `activos` | Registros de activos | nombre, tipo, valor, fecha, notas |
| `ingresos` | Registros de ingresos | fecha, descripcion, categoria, monto, mes, anio |
| `habitos` | Hábitos financieros | nombre, descripcion, frecuencia, meta_dias, dias_completados, racha_actual, racha_maxima |
| `logros` | Sistema de logros | nombre, descripcion, icono, condicion, desbloqueado, fecha_desbloqueo |
| `configuracion` | Configuración de usuario | clave (hashed), preferencias |

### Métodos del DatabaseService (44)

#### CRUD Básico
- `getGastos(mes, anio)` / `addGasto(gasto)` / `updateGasto(gasto)` / `deleteGasto(id)`
- `getDeudas()` / `addDeuda(deuda)` / `updateDeuda(deuda)` / `deleteDeuda(id)`
- `getIngresos(mes, anio)` / `addIngreso(ingreso)` / `deleteIngreso(id)`
- `getObjetivos()` / `addObjetivo(objetivo)` / `updateObjetivo(objetivo)` / `deleteObjetivo(id)`
- `getActivos()` / `addActivo(activo)` / `updateActivo(activo)` / `deleteActivo(id)`
- `getHabitos()` / `addHabito(habito)` / `updateHabito(habito)` / `deleteHabito(id)`
- `getLogros()` / `addLogro(logro)` / `updateLogro(logro)`

#### Presupuestos
- `getPresupuestos(mes?, anio?)` / `getPresupuestoById(id)` / `addPresupuesto(presupuesto, categorias)` / `updatePresupuesto(id, presupuesto, categorias?)` / `deletePresupuesto(id)`
- `getResumenPresupuestos(mes, anio)` / `copiarPresupuesto(id, nuevoMes, nuevoAnio)`

#### Deudas
- `addPagoDeuda(deudaId, pago)` / `getPagosDeuda(deudaId)`

#### Resúmenes y Análisis
- `getResumenMensual(mes, anio)` / `getResumenAnual(anio)`
- `getPredicciones()` / `getProyeccionAhorro()`
- `procesarIA(mensaje)` / `getRespuestaIA(pregunta)`

#### Seguridad
- `setPassword(password)` / `verifyPassword(password)` / `hasPassword()` / `removePassword()`

#### Backup
- `exportBackup()` / `importBackup(jsonStr)`

#### Categorías
- `initCategories()` / `initLogros()`

---

## Componentes React (16)

### Componentes de Vista (12)

| Componente | Props | Descripción |
|------------|-------|-------------|
| `Dashboard` | `mes, anio, onMesChange, onAnioChange` | Resumen con gráficos |
| `GastosMes` | `mes, anio, onMesChange, onAnioChange` | CRUD gastos + filtros + selección |
| `Deudas` | — | Deudas + pagos + filtros |
| `Presupuestos` | `mes, anio, onMesChange, onAnioChange` | Presupuestos por categoría |
| `Objetivos` | — | Metas de ahorro |
| `Patrimonio` | — | Activos + patrimonio |
| `FlujoCaja` | `mes, anio, onMesChange, onAnioChange` | Ingresos vs egresos |
| `ResumenAnual` | `anio` | Resumen del año |
| `DashboardEjecutivo` | — | Score financiero |
| `Inteligencia` | — | Análisis IA |
| `Reportes` | — | Informes |
| `Habitos` | — | Hábitos financieros |

### Componentes de UI (4)

| Componente | Props | Descripción |
|------------|-------|-------------|
| `FilterBarGastos` | `filtros, onCambio, onLimpiar` | Filtros de gastos |
| `FilterBarDeudas` | `filtros, onCambio, onLimpiar` | Filtros de deudas |
| `FilterBarPresupuestos` | `filtros, onCambio, onLimpiar` | Filtros de presupuestos |
| `SortHeader` | `campo, etiqueta, ordenActual, onOrdenar` | Cabecera ordenable |

### Componentes de Configuración (2)

| Componente | Props | Descripción |
|------------|-------|-------------|
| `LockScreen` | `onUnlock` | Pantalla de bloqueo con clave |
| `SettingsModal` | `open, onClose` | Modal de configuración |

---

## Servicios

### NotificationService (`src/services/notificaciones.ts`)

- `requestPermissions()` — Solicitar permisos de notificación
- `schedulePagoRecordatorio(id, desc, monto, fecha)` — Programar recordatorio de pago
- `cancelRecordatorio(id)` — Cancelar recordatorio
- `scheduleResumenSemanal()` — Programar resumen semanal

### ExportService (`src/services/exportService.ts`)

- `exportCSV(contenido, filename)` — Exportar como CSV vía Share nativo
- `exportBackup(jsonStr)` — Exportar backup como archivo

### Seguridad (en DatabaseService)

- SHA-512 con salt para hash de contraseñas
- Almacenamiento en `@capacitor/preferences`
- Verificación en cada intento de desbloqueo

---

## Flujo de Datos

```
UI (React) → useDatabase() hook → DatabaseService → @capacitor-community/sqlite → SQLite nativo Android
       ↓
  Share nativo ← ExportService ← Filesystem ← Datos del usuario
       ↓
  LocalNotifications ← NotificationService ← Recordatorios programados
```

---

## TypeScript

### Interfaces Principales

```typescript
interface Gasto {
  id?: number;
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: number;
  mes: number;
  anio: number;
  estado?: 'pendiente' | 'pagado' | 'cancelado';
}

interface Deuda {
  id?: number;
  nombre: string;
  monto_total: number;
  cuotas_totales: number;
  cuotas_pagadas: number;
  fecha_inicio: string;
  estado?: 'activa' | 'pagada';
}

interface Presupuesto {
  id?: number;
  nombre: string;
  mes: number;
  anio: number;
  monto_total: number;
}

interface ObjetivoFinanciero {
  id?: number;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_limite: string;
  estado?: 'en_progreso' | 'completado' | 'vencido';
  color?: string;
  icono?: string;
}
```

---

## Configuración de Build

### Vite (`vite.config.ts`)

- Plugin React
- Plugin TailwindCSS v4
- Build output: `dist/`

### Capacitor (`capacitor.config.ts`)

- App ID: `com.novafin.ai`
- Nombre: `NovaFin AI`
- Plugins configurados: SQLite, Filesystem, Share, Dialog, LocalNotifications, PushNotifications, Preferences, Network

### Android (`android/`)

- SDK target: Android 36 (API 36)
- Gradle: 8.14.3
- Java: OpenJDK 21
- Build output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Diseño Responsive

La aplicación está optimizada para pantallas móviles (360px+) con diseño responsive que se adapta a tablet y desktop.

### Breakpoints utilizados

| Breakpoint | Ancho | Comportamiento |
|------------|-------|----------------|
| Base | < 640px | Mobile: 1 columna, botones apilados, filtros colapsables |
| `sm:` | 640px+ | Tablet pequeño: 2 columnas, botones en fila |
| `md:` | 768px+ | Tablet: navegación desktop visible, filtros siempre visibles |
| `lg:` | 1024px+ | Desktop: 4 columnas, navegación completa |

### Patrones responsive aplicados

- **Header:** Título truncado, menú hamburguesa con backdrop en mobile
- **Filtros:** Toggle colapsable `md:hidden`, grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **Botones:** Texto oculto con `hidden sm:inline`, solo íconos en mobile
- **Tablas:** Wrapper `overflow-x-auto` + `min-w-[600px]` para scroll horizontal
- **Tarjetas:** Padding adaptativo `p-4 sm:p-6`, texto escalado `text-2xl sm:text-3xl`
- **Gráficos:** Altura adaptativa `h-48 sm:h-64` (200px mobile, 300px desktop)
- **Modales:** Ancho `max-w-sm sm:max-w-md`, padding `p-4 sm:p-6`

### Modo Oscuro

- Configurado con TailwindCSS v4 via `@custom-variant dark (&:where(.dark, .dark *))` en `index.css`
- Toggle en Configuración (sección "Apariencia")
- Preferencia persistida en `localStorage` (`novafin-dark`)
- Respeta preferencia del sistema si no hay elección previa
- Todos los componentes incluyen variantes `dark:` completas
