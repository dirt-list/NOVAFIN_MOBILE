# Procedimientos del Proyecto - NovaFin AI Mobile

## Índice

1. [Procedimiento de Desarrollo](#1-procedimiento-de-desarrollo)
2. [Procedimiento de Control de Versiones](#2-procedimiento-de-control-de-versiones)
3. [Procedimiento de Construcción (Build)](#3-procedimiento-de-construcción-build)
4. [Procedimiento de Empaquetado y Distribución](#4-procedimiento-de-empaquetado-y-distribución)
5. [Procedimiento de Despliegue](#5-procedimiento-de-despliegue)
6. [Procedimiento de Gestión de Errores](#6-procedimiento-de-gestión-de-errores)
7. [Procedimiento de Respaldos](#7-procedimiento-de-respaldos)
8. [Procedimiento de Actualización](#8-procedimiento-de-actualización)
9. [Procedimiento de Código](#9-procedimiento-de-código)

---

## 1. Procedimiento de Desarrollo

### 1.1 Ambiente de Desarrollo

**Prerequisitos:**
- Node.js v18+ instalado
- npm v9+ instalado
- Git instalado
- Editor de código (VS Code recomendado)
- Android Studio (para builds de Android)
- Java JDK 21+

### 1.2 Iniciar Sesión de Desarrollo

```bash
# 1. Clonar repositorio (primera vez)
git clone https://github.com/dirt-list/ASISTENTE_DE_FINANZAS_PERSONALES.git
cd ASISTENTE_DE_FINANZAS_PERSONALES/novafin-mobile

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

### 1.3 Estructura de Directorios

```
novafin-mobile/
├── src/
│   ├── App.tsx          # Router principal
│   ├── main.tsx         # Entry point
│   ├── index.css        # Estilos globales
│   ├── services/        # Servicios (database, types, etc.)
│   ├── hooks/           # Custom hooks
│   └── components/      # Componentes React
├── android/             # Proyecto Android nativo
├── capacitor.config.ts  # Configuración Capacitor
├── vite.config.ts       # Configuración Vite
├── package.json         # Dependencias
└── docs/                # Documentación
```

### 1.4 Flujo de Trabajo Diario

1. Actualizar rama principal: `git pull origin main`
2. Crear rama de feature: `git checkout -b feature/nombre-feature`
3. Desarrollar funcionalidad
4. Ejecutar build: `npm run build`
5. Probar en navegador: `npm run dev`
6. Commit y push: `git add . && git commit -m "feat: descripción" && git push`
7. Crear Pull Request

### 1.5 Commits

**Formato:**
```
tipo(descripción): mensaje corto

Descripción más larga (opcional)
```

**Tipos:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Estilos
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Tareas de mantenimiento

**Ejemplos:**
```bash
git commit -m "feat: agregar exportación de gastos a CSV"
git commit -m "fix: corregir filtro de fechas en GastosMes"
git commit -m "docs: actualizar manual de usuario"
```

---

## 2. Procedimiento de Control de Versiones

### 2.1 Ramas Principales

- **main:** Código estable, listo para producción
- **develop:** Código en desarrollo
- **feature/*:** Nuevas funcionalidades
- **fix/*:** Corrección de bugs
- **release/*:** Preparación de releases

### 2.2 Flujo de Ramas

```
main ──────────────────────────────────►
  │                                      │
  └── develop ──────► feature/* ──► PR ──►
                        │
                        └── fix/* ──► PR ──►
```

### 2.3 Crear Feature

```bash
git checkout develop
git checkout -b feature/nueva-funcionalidad
# Desarrollar...
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
# Crear PR en GitHub
```

### 2.4 Crear Fix

```bash
git checkout develop
git checkout -b fix/correccion-bug
# Corregir...
git add .
git commit -m "fix: corrección del bug"
git push origin fix/correccion-bug
# Crear PR en GitHub
```

### 2.5 Merge

```bash
# Después de approve del PR
git checkout develop
git merge feature/nueva-funcionalidad
git push origin develop
```

---

## 3. Procedimiento de Construcción (Build)

### 3.1 Build de Desarrollo

```bash
# Solo compilar web assets
npm run build

# Iniciar servidor de desarrollo con hot reload
npm run dev
```

### 3.2 Build de Producción

```bash
# 1. Limpiar builds anteriores
rm -rf dist/ android/app/build/

# 2. Compilar web assets
npm run build

# 3. Sincronizar con Capacitor
npx cap sync

# 4. Abrir en Android Studio
npx cap open android
```

### 3.3 Build de APK (sin Android Studio)

```bash
# 1. Compilar web assets
npm run build

# 2. Sincronizar con Capacitor
npx cap sync

# 3. Compilar APK
cd android
./gradlew assembleDebug

# 4. APK generada en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 3.4 Build de Release (firmado)

```bash
# 1. Generar keystore (primera vez)
keytool -genkey -v -keystore novafin-release.keystore \
  -alias novafin -keyalg RSA -keysize 2048 -validity 10000

# 2. Configurar firma en android/app/build.gradle
# 3. Compilar APK firmado
cd android
./gradlew assembleRelease
```

### 3.5 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_APP_VERSION` | Versión de la app | `1.0.0` |
| `VITE_API_URL` | URL del backend (futuro) | `https://api.novafin.ai` |

---

## 4. Procedimiento de Empaquetado y Distribución

### 4.1 Generar Release

```bash
# 1. Actualizar versión en package.json
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0

# 2. Build completo
npm run build
npx cap sync

# 3. Generar APK de release
cd android
./gradlew assembleRelease

# 4. Generar AAB para Play Store
./gradlew bundleRelease
```

### 4.2 Firmar APK

```bash
# Usar jarsigner (incluido en JDK)
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore novafin-release.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  novafin

# Usar zipalign
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  NovaFin-v1.0.0.apk
```

### 4.3 Distribución

- **Debug:** Compartir APK directamente
- **Release:** Subir a Google Play Store (requiere cuenta de desarrollador)
- **Enterprise:** Distribuir internamente vía MDM

---

## 5. Procedimiento de Despliegue

### 5.1 Google Play Store

1. Crear cuenta de desarrollador ($25 USD una vez)
2. Generar AAB firmado
3. Subir a Google Play Console
4. Completar listing (descripción, screenshots, etc.)
5. Enviar a revisión
6. Esperar aprobación (1-3 días)

### 5.2 Distribución Directa

1. Generar APK firmada
2. Compartir vía:
   - Correo electrónico
   - Almacenamiento en la nube
   - WhatsApp / Telegram
   - Servidor interno

### 5.3 Actualización de Usuarios

Notificar a los usuarios sobre:
- Nueva versión disponible
- Cambios importantes
- Instrucciones de actualización
- Requisitos nuevos (si los hay)

---

## 6. Procedimiento de Gestión de Errores

### 6.1 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Database not initialized` | DB no inicializada | Verificar `useDatabase()` hook |
| `Permission denied` | Permisos no concedidos | Solicitar permisos |
| `Network error` | Sin conexión | Verificar conexión a internet |
| `Build failed` | Error de compilación | Revisar logs de build |
| `APK not installed` | Orígenes desconocidos | Habilitar en Ajustes |

### 6.2 Logging

```typescript
// En desarrollo
console.log('Mensaje informativo');
console.warn('Advertencia');
console.error('Error');

// En producción
// Usar servicio de crash reporting (futuro)
```

### 6.3 Manejo de Errores

```typescript
try {
  await db.addGasto(nuevoGasto);
} catch (error) {
  console.error('Error al guardar gasto:', error);
  // Mostrar mensaje al usuario
  setError('No se pudo guardar el gasto');
}
```

---

## 7. Procedimiento de Respaldos

### 7.1 Backup Automático

La app permite exportar backups desde Configuración (⚙️) → "Exportar copia".

### 7.2 Backup Manual

```bash
# Copiar base de datos del dispositivo
adb pull /data/data/com.novafin.ai/databases/novafin_db ./backup/
```

### 7.3 Restaurar Backup

1. Ir a Configuración (⚙️)
2. Toque "Importar copia"
3. Pegue el contenido JSON de la copia
4. La app se reiniciará con los datos restaurados

### 7.4 Frecuencia Recomendada

- **Antes de actualizar la app:** Siempre
- **Antes de cambiar de dispositivo:** Siempre
- **Periódicamente:** Una vez al mes
- **Antes de cambios grandes:** Después de agregar muchos datos

---

## 8. Procedimiento de Actualización

### 8.1 Actualizar App (Usuario)

1. Descargar nueva APK
2. Toque el archivo para instalar
3. Android detectará la actualización
4. Toque "Actualizar"
5. Los datos se conservan

### 8.2 Actualizar Código (Desarrollador)

```bash
# 1. Actualizar dependencias
npm update
# O especificar paquete
npm install @capacitor/core@latest

# 2. Verificar compatibilidad
npm run build
npm run dev

# 3. Actualizar plugins Capacitor
npx cap sync
npx cap update

# 4. Probar en dispositivo
npm run build && npx cap sync
cd android && ./gradlew assembleDebug
```

### 8.3 Cambios entre Versiones

Consultar CHANGELOG.md para ver:
- Nuevas funcionalidades
- Corrección de bugs
- Cambios de comportamiento
- Issues conocidos
- Pasos de migración

---

## 9. Procedimiento de Código

### 9.1 Convenciones de Código

- **Variables y funciones:** camelCase (`nuevoGasto`, `getGastos`)
- **Componentes:** PascalCase (`Dashboard`, `GastosMes`)
- **Archivos de componentes:** PascalCase (`Dashboard.tsx`)
- **Archivos de servicios:** camelCase (`database.ts`)
- **Constantes:** UPPER_SNAKE_CASE (`DB_NAME`, `MESES`)
- **Interfaces:** PascalCase (`Gasto`, `Deuda`)
- **CSS:** Tailwind utility classes

### 9.2 Estructura de Componentes

```typescript
import { useState, useEffect } from 'react';
import { db } from '../services/database';

interface MiComponenteProps {
  prop1: string;
  prop2: number;
}

export function MiComponente({ prop1, prop2 }: MiComponenteProps) {
  const [estado, setEstado] = useState('');

  useEffect(() => {
    // Cargar datos iniciales
  }, []);

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 9.3 Estructura de Servicio

```typescript
import { CapacitorSQLite } from '@capacitor-community/sqlite';

export class MiServicio {
  private db: SQLiteDBConnection | null = null;

  async init(): Promise<void> {
    // Inicializar conexión
  }

  async getDatos(): Promise<Dato[]> {
    // Obtener datos
  }

  async addDato(dato: Dato): Promise<void> {
    // Agregar dato
  }
}

export const miServicio = new MiServicio();
```

### 9.4 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

### 9.5 Linting

```bash
# Verificar lint
npm run lint

# Corregir automáticamente
npm run lint:fix

# Verificar tipos
npm run typecheck
```

### 9.6 Git Hooks

El proyecto usa pre-commit hooks para:
- Ejecutar lint antes de cada commit
- Verificar tipos
- Ejecutar tests

---

## 10. Comandos Útiles

### Desarrollo

```bash
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar para producción
npm run preview          # Previsualizar build de producción
```

### Capacitor

```bash
npx cap sync             # Sincronizar web → Android
npx cap open android     # Abrir en Android Studio
npx cap copy             # Copiar assets web
npx cap update           # Actualizar plugins
```

### Android

```bash
cd android
./gradlew assembleDebug     # Build debug
./gradlew assembleRelease   # Build release
./gradlew bundleRelease     # Generar AAB
./gradlew clean             # Limpiar build
```

### Git

```bash
git status               # Ver estado
git diff                 # Ver cambios
git log --oneline        # Ver commits recientes
git stash                # Guardar cambios temporales
git stash pop            # Recuperar cambios guardados
```

---

## 11. Contacto y Soporte

- **Repositorio:** github.com/dirt-list/ASISTENTE_DE_FINANZAS_PERSONALES
- **Issues:** Abrir issue en GitHub
- **Email:** [Agregar email de contacto]
