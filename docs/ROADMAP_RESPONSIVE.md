# Roadmap: Responsive Design - NovaFin AI Mobile

## Estado: COMPLETADO ✅

**Fecha de implementación:** 2 de julio de 2026

---

## Objetivo

Adaptar la aplicación para que se vea y funcione correctamente en pantallas móviles (360-414px de ancho), eliminando el aspecto "tosco" actual.

---

## Resumen de Problemas Detectados

| Problema | Archivo | Impacto |
|----------|---------|---------|
| CSS global fuerza layout desktop | `src/index.css` | Crítico - 60% del problema |
| Header sin truncate/overflow | `src/App.tsx` | Alto |
| FilterBar horizontal sin wrap | `src/components/FilterBar.tsx` | Alto |
| Botones de acción desbordados | `src/components/GastosMes.tsx` | Alto |
| Tablas sin scroll horizontal | Múltiples | Medio |
| Gráficos con altura fija | Múltiples | Medio |
| Espaciado/padding excesivo en mobile | Múltiples | Medio |

---

## Fase 1: CSS Global (index.css) — 15 min

### Objetivo
Eliminar constraints que fuerzan layout de escritorio en el root.

### Cambios

```css
/* ANTES */
body {
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

/* DESPUÉS */
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow-x: hidden;
}
#root {
  max-width: none;
  padding: 0;
  text-align: left;
}
```

### Verificación
- `npm run dev` → abrir en DevTools device toolbar (360px)
- El contenido debe tocar los bordes izquierdo/derecho sin padding forzado

---

## Fase 2: Header y Navegación (App.tsx) — 20 min

### Objetivo
Header responsive, menú mobile funcional, padding del main adaptativo.

### Cambios

**Header (línea 105):**
```tsx
<div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between min-w-0">
  <div className="flex items-center gap-3 min-w-0">
    <button ... />  // hamburger
    <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">
      NovaFin AI
    </h1>
  </div>
  <div className="flex items-center gap-2 shrink-0">  // version + settings
```

**Mobile menu (línea 156):**
- Agregar backdrop con `onClick={setMenuOpen(false)}`
- Animación: `transition-transform duration-300` + `transform translate-y-[-100%]`

**Main (línea 176):**
```tsx
<main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
```

### Verificación
- Header no se desborda en 360px
- Menú abre/cierra con animación suave
- Tocar fuera del menú lo cierra

---

## Fase 3: FilterBar Responsive (FilterBar.tsx) — 30 min

### Objetivo
Filtros colapsables en mobile, layout en grid, inputs adaptativos.

### Cambios Comunes (3 variantes)

**Estructura nueva:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 mb-4">
  {/* Toggle colapsable en mobile */}
  <button
    className="md:hidden w-full flex items-center justify-between p-2 rounded-lg
               text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    onClick={() => setExpanded(!expanded)}
  >
    <span>🔍 Filtros</span>
    <span>{expanded ? '▲' : '▼'}</span>
  </button>

  <div className={`${expanded || 'md:block'} grid gap-3
      grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`}>
    {/* inputs en grid, no flex-wrap */}
  </div>

  {/* Botón limpiar siempre visible si hay filtros */}
</div>
```

**Inputs específicos:**
- Búsqueda: `min-w-0 flex-1` (sin min-width fijo)
- Selects: `w-full`
- Monto min/max: `w-full sm:w-28`
- Fechas: `w-full`

### Verificación
- En 360px: filtros ocultos por defecto, se expanden al tocar
- En 768px+: siempre visibles en 2 columnas
- En 1024px+: 4 columnas

---

## Fase 4: GastosMes Responsive (GastosMes.tsx) — 30 min

### Objetivo
Botones de acción apilados en mobile, tabla con scroll horizontal, formulario adaptado.

### Cambios

**Header de acciones (línea 265-326):**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
    Gastos del Mes
  </h2>

  <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full sm:w-auto">
    {/* Selects mes/año: w-full sm:w-auto */}
    <div className="flex gap-2 w-full sm:w-auto">
      <select className="w-full sm:w-auto" ... />
      <select className="w-full sm:w-auto" ... />
    </div>

    {/* Botones: solo ícono en mobile, texto en desktop */}
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg
                       flex items-center gap-2 transition-colors
                       sm:px-4 sm:py-2">
      <span aria-hidden="true">+</span>
      <span className="hidden sm:inline">Agregar gasto</span>
    </button>

    <button ... disabled={...} className="... sm:px-4 sm:py-2">
      <span aria-hidden="true">📥</span>
      <span className="hidden sm:inline">Exportar CSV</span>
    </button>

    {seleccionados.size > 0 && (
      <>
        <button ... className="... sm:px-4 sm:py-2">
          <span aria-hidden="true">📋</span>
          <span className="hidden sm:inline">Copiar al mes siguiente</span>
        </button>
        <button ... className="... sm:px-4 sm:py-2">
          <span aria-hidden="true">📅</span>
          <span className="hidden sm:inline">Pasar al mes siguiente</span>
        </button>
      </>
    )}
  </div>
</div>
```

**Tabla (envolver):**
```tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[600px]">  {/* min-width fuerza scroll */}
    ...
  </table>
</div>
```

**Formulario (línea 328+):**
- Ya usa `w-full` en inputs — está bien
- Reducir padding: `p-4` → `p-3 sm:p-4`

### Verificación
- 5 botones apilados verticalmente en 360px
- Tabla scrollea horizontalmente sin romper layout
- Formulario se ve completo en mobile

---

## Fase 5: Dashboard Responsive (Dashboard.tsx) — 20 min

### Objetivo
Tarjetas de resumen con texto escalado, gráficos con altura adaptativa.

### Cambios

**Tarjetas resumen (línea 186-214):**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
  <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gastado este mes</p>
    <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
      ${totalMesFiltrado.toLocaleString('es-AR')}
    </p>
  </div>
  {/* ... 3 tarjetas más ... */}
</div>
```

**Gráficos (Pie + Bar):**
```tsx
// Pie
<Pie
  data={pieData}
  options={{
    ...pieOptions,
    responsive: true,
    maintainAspectRatio: false,
  }}
  height={200}  // mobile: 200, desktop: 300 via CSS
/>

// Bar
<Bar
  data={barData}
  options={{
    ...barOptions,
    responsive: true,
    maintainAspectRatio: false,
  }}
  height={200}
/>
```

**CSS para gráficos (agregar a index.css):**
```css
@media (min-width: 768px) {
  canvas.chart-responsive { height: 300px !important; }
}
@media (max-width: 767px) {
  canvas.chart-responsive { height: 200px !important; }
}
```

### Verificación
- 4 tarjetas en 1 columna (mobile), 2 (tablet), 4 (desktop)
- Gráficos se ven completos sin recortes

---

## Fase 6: Deudas Responsive (Deudas.tsx) — 15 min

### Objetivo
Header apilado, cards compactas, botón minimalista en mobile.

### Cambios

**Header (línea 203-211):**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Deudas</h2>
  <button
    onClick={() => setShowForm(true)}
    className="px-4 py-2 bg-blue-500 text-white rounded-lg
               flex items-center gap-2 justify-center w-full sm:w-auto">
    <span>+</span>
    <span className="hidden sm:inline">Nueva deuda</span>
  </button>
</div>
```

**Card resumen (línea 213-228):**
```tsx
<div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-4">
```

**Tabla deudas:** envolver en `overflow-x-auto` si hay tabla.

### Verificación
- Header no se desborda
- Card resumen con padding reducido en mobile

---

## Fase 7: 8 Componentes Restantes — 40 min

### Cambios por componente (patrón común: padding + grid + texto escalado)

| Componente | Cambios |
|------------|---------|
| **Presupuestos.tsx** | Cards: `p-4 sm:p-6`; Grid categorias: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| **Objetivos.tsx** | Barras progreso: `h-2 sm:h-3`; Texto: `text-sm sm:text-base` |
| **Patrimonio.tsx** | Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; Cards: `p-4 sm:p-6` |
| **FlujoCaja.tsx** | Gráficos: altura 200/300; Cards resumen: `p-4 sm:p-6` |
| **ResumenAnual.tsx** | Tabla: `overflow-x-auto`; Grid barras: `grid-cols-1 sm:grid-cols-2` |
| **DashboardEjecutivo.tsx** | Score: `text-4xl sm:text-5xl md:text-6xl`; KPIs: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| **Inteligencia.tsx** | Cards: `p-4 sm:p-6`; Grid: `grid-cols-1 sm:grid-cols-2` |
| **Reportes.tsx** | Texto: `text-sm sm:text-base`; Espaciado: `space-y-3 sm:space-y-4` |
| **Habitos.tsx** | Grid: `grid-cols-1 sm:grid-cols-2`; Cards: `p-4 sm:p-6` |

### Patrón de texto responsivo
```tsx
// En lugar de text-base fijo:
className="text-sm sm:text-base"

// En lugar de text-xl fijo:
className="text-lg sm:text-xl md:text-2xl"

// En lugar de p-6 fijo:
className="p-4 sm:p-6"
```

---

## Fase 8: SettingsModal y LockScreen — 10 min

### SettingsModal.tsx

```tsx
// Contenedor (línea ~70)
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl
             w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">

// Padding interno (línea ~85)
<div className="p-4 sm:p-6 space-y-6">
```

### LockScreen.tsx
- Ya está bien (`max-w-sm p-8` centrado)
- Solo verificar que `p-4` en el contenedor exterior (línea 56) sea suficiente

---

## Checklist de Verificación Final

### Mobile (360-390px)
- [x] Contenido toca bordes sin padding forzado
- [x] Header: título truncado, botones visibles
- [x] Menú: abre/cierra, backdrop, animación
- [x] Filtros: colapsados por defecto, se expanden
- [x] Botones: apilados verticalmente, solo íconos
- [x] Tablas: scroll horizontal suave
- [x] Gráficos: altura 200px, legibles
- [x] Tarjetas: 1 columna, padding cómodo
- [x] Formularios: inputs full-width, botones full-width
- [x] Modales: ancho 100% - 16px, scroll interno

### Tablet (768-1024px)
- [x] Filtros: 2 columnas, siempre visibles
- [x] Botones: 2 por fila con texto
- [x] Tarjetas: 2 columnas
- [x] Gráficos: altura 300px

### Desktop (1024px+)
- [x] Filtros: 4 columnas
- [x] Botones: en fila con texto completo
- [x] Tarjetas: 4 columnas
- [x] Padding completo restaurado

---

## Comandos de Verificación

```bash
# Desarrollo
npm run dev
# Abrir http://localhost:5173
# DevTools > Device toolbar > 360px / 768px / 1024px

# Build final
npm run build && npx cap sync
cd android && ./gradlew assembleDebug
```

---

## Estimación Total

| Fase | Tiempo | Archivos |
|------|--------|----------|
| 1. CSS Global | 15 min | 1 |
| 2. Header/Nav | 20 min | 1 |
| 3. FilterBar | 30 min | 1 |
| 4. GastosMes | 30 min | 1 |
| 5. Dashboard | 20 min | 1 |
| 6. Deudas | 15 min | 1 |
| 7. 8 Componentes | 40 min | 8 |
| 8. Modal/Lock | 10 min | 2 |
| **Total** | **~3 horas** | **16 archivos** |

---

## Orden de Ejecución Recomendado

1. **Fases 1-2** (base global + header) → impacto inmediato en toda la app
2. **Fase 3** (FilterBar) → afecta 3 vistas principales
3. **Fase 4** (GastosMes) → vista más compleja, más usada
4. **Fase 5** (Dashboard) → primera vista al abrir
5. **Fase 6** (Deudas) → ajustes menores
6. **Fase 7** (resto) → barrido final
7. **Fase 8** (modales) → pulido

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Romper layout en desktop | Usar `sm:`, `md:`, `lg:` prefixes, probar en cada breakpoint |
| Gráficos Chart.js no responden | `maintainAspectRatio: false` + `responsive: true` + CSS height |
| Modales muy anchos en mobile | `max-w-[calc(100%-16px)]` o `max-w-sm sm:max-w-md` |
| Tablas con muchas columnas | `min-w-[600px]` en table + `overflow-x-auto` en wrapper |

---

## Próximos Pasos Post-Responsive

Una vez completado este roadmap:
1. ✅ Modo oscuro implementado (toggle en Configuración, persiste en localStorage)
2. Testing en dispositivo real (no solo DevTools)
3. Accesibilidad: focus-visible, aria-labels, contraste
4. Performance: lazy-load gráficos, virtualizar listas largas
5. PWA: manifest, service worker, install prompt
6. iOS build con Capacitor
