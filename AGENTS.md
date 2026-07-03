# AGENTS.md — NovaFin AI Mobile

## Project

Capacitor + React + Vite + TailwindCSS Android app. Uses `@capacitor-community/sqlite` for native SQLite. Ported from the Electron desktop app at `../personales/`.

## Build

```bash
npm run build          # tsc -b && vite build → dist/
npm run dev            # Vite dev server on port 5173
npm run lint           # oxlint
npm run preview        # preview dist/
```

**No test scripts exist.** No test framework is installed.

### Android build

```bash
npx cap sync           # copy dist/ → android/app/src/main/assets/public/
npx cap open android   # open in Android Studio (optional)
cd android && ./gradlew assembleDebug   # build APK → app/build/outputs/apk/debug/
```

**Critical:** After editing `src/`, you MUST run `npm run build && npx cap sync` before the Android build picks up changes. Gradle compiles from the copied `dist/`, not live source.

**local.properties** contains `sdk.dir=/tmp/android-sdk` — this is a temporary path. If Android SDK is at a different location on your machine, update this file.

## Linting

- Linter: **oxlint** (not ESLint). Config at `.oxlintrc.json`.
- Plugins: `react`, `typescript`, `oxc`
- Runs as `npm run lint`.

## Types

- TypeScript 6.x, strict mode via `tsconfig.app.json` and `tsconfig.node.json`
- `noUnusedLocals`, `noUnusedParameters` enforced
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `erasableSyntaxOnly: true` — no enums, no const assertions in .ts

## Architecture

```
src/
├── App.tsx              # Root: lock screen + 12-view router + settings modal
├── main.tsx             # Entry point
├── index.css            # TailwindCSS v4 + base styles
├── services/
│   ├── database.ts      # DatabaseService (44 methods, 12 tables) — main data layer
│   ├── types.ts         # All TypeScript interfaces
│   ├── notificaciones.ts # NotificationService (Capacitor LocalNotifications)
│   └── exportService.ts  # Share + Filesystem for CSV/backup export
├── hooks/
│   └── useDatabase.ts   # useDatabase() hook — blocks until DB ready
└── components/          # 16 React components (12 views + 4 UI)
```

### Key patterns

- **All data flows through `DatabaseService`** (`src/services/database.ts`). Single instance exported as `db`.
- **`useDatabase()` hook** returns `{ isReady, error }`. App blocks on `isReady` with a spinner.
- **Lock screen** renders when `locked` state is true. Check password via `db.verifyPassword()`.
- **Views receive `mes`/`anio`/`onMesChange`/`onAnioChange` props** from `App.tsx` global state.
- **Filters are client-side** via `useMemo`. `FilterBar` variants in `FilterBar.tsx`.
- **Charts** use `react-chartjs-2` (Pie, Bar). Chart.js registered per component.

### Capacitor plugins (8)

| Plugin | Purpose |
|--------|---------|
| `@capacitor-community/sqlite` | Native SQLite |
| `@capacitor/local-notifications` | Payment reminders |
| `@capacitor/share` | Native share sheet |
| `@capacitor/filesystem` | File I/O |
| `@capacitor/preferences` | Key-value storage |
| `@capacitor/dialog` | Native dialogs |
| `@capacitor/network` | Network status |
| `@capacitor/push-notifications` | Push (configured but unused) |

### SQLite API

```typescript
const conn = new SQLiteConnection(CapacitorSQLite);
db = await conn.createConnection('novafin_db', false, 'no-encryption', 1, false);
await db.open();
// queries: await db.query(sql, params)
// writes:  await db.run(sql, params) → then save()
```

**Gotcha:** `db.run()` does not auto-persist. You must call `save()` after writes.

## Gotchas

- **TailwindCSS v4** uses `@tailwindcss/vite` plugin, NOT PostCSS. No `postcss.config.js` needed. The `tailwind.config.js` is still present but v4 uses CSS-based config by default.
- **react-router-dom** is installed but **not used** — navigation is manual state in `App.tsx` (`vistaActual` state).
- **`android/` is committed to git** — changes to native Android files (Java, Gradle) are tracked.
- **APK build requires Java 21+ and Android SDK**. The Gradle wrapper downloads its own Gradle. `JAVA_HOME` and `ANDROID_HOME` must be set.
- **No `.env` file** — environment vars use `VITE_` and `CAP_` prefixes (see `vite.config.ts` `envPrefix`).
- **Types are in `src/services/types.ts`** — this is the single source of truth for all interfaces (Gasto, Deuda, Presupuesto, etc.).
