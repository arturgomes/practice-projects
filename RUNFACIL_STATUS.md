# RunFácil — Build Status

> **Branch:** `claude/running-tracker-prd-a4RL6`
> **PR:** https://github.com/arturgomes/practice-projects/pull/1
> **Last commit:** `f520df8` — Wire audio cues, BLE heart rate, and Health Connect into screens
> **App folder:** `runfacil/`

---

## What has been built

### Config & tooling
| File | Purpose |
|------|---------|
| `runfacil/package.json` | Expo ~54, expo-router ~6, RN 0.81.5; all deps listed below |
| `runfacil/app.json` | scheme `runfacil`, minSdk 26, expo-location background service plugin, BLE + location permissions |
| `runfacil/tsconfig.json` | strict mode, `@/*` path alias pointing to `runfacil/` |
| `runfacil/babel.config.js` | expo preset + module-resolver for `@/*` |
| `runfacil/metro.config.js` | withNativeWind disabled, standard Expo Metro config |
| `runfacil/eas.json` | dev / preview / production EAS build profiles |
| `runfacil/.npmrc` | legacy-peer-deps=true (needed for rnmapbox peer chain) |

### Constants
| File | Purpose |
|------|---------|
| `constants/theme.ts` | `lightColors` / `darkColors` (same key set), `ThemeMode`, `Colors` type. Primary: `#FF6B35` |
| `constants/units.ts` | `formatPace`, `formatDistance`, `formatDuration`, `estimateCalories`, `haversineDistance` |
| `constants/ble.ts` | `HEART_RATE_SERVICE_UUID`, `HEART_RATE_CHAR_UUID`, `BLE_SCAN_TIMEOUT_MS` (15 000 ms) |

### State
| File | Purpose |
|------|---------|
| `store/RunContext.tsx` | `RunProvider` + `useRun`; `RunStatus` union; actions: `START`, `PAUSE`, `RESUME`, `FINISH`, `RESET`, `ADD_COORDINATE`, `SET_HEART_RATE`, `SET_DISTANCE`, `SET_PACE` |

### Hooks
| File | Purpose |
|------|---------|
| `hooks/useSettings.tsx` | `SettingsProvider` + `useSettings`; fields: `themeMode`, `weightKg`, `distanceUnit`, `audioCuesEnabled`, `audioCueVolume`, `pairedDeviceId`; persisted via AsyncStorage |
| `hooks/useRunStorage.ts` | `loadRuns`, `saveRun`, `updateRun(id, patch)`, `deleteRun`; key `@runfacil/runs` |
| `hooks/useRunCalculations.ts` | `calculateDistance` (haversine, skips >30 m accuracy jumps), `calculatePace` (rolling 500 m window), `resetPaceWindow` |
| `hooks/useGPSTracking.ts` | Starts/stops `expo-location` background task; bridges OS task → React via `DeviceEventEmitter`; foreground notification "Rastreando sua corrida…"; exports `status`, `error`, `startTracking`, `pauseTracking`, `resumeTracking`, `stopTracking` |
| `hooks/useAudioCues.ts` | `useAudioCues(enabled)` → `checkMilestone(distanceMeters, paceSecPerKm)` + `reset()`; announces each km via `expo-speech` in pt-BR |
| `hooks/useHeartRate.ts` | `useHeartRate()` → `heartRate`, `isConnected`, `isScanning`, `startScan`, `stopScan`, `disconnect`; module-level `BleManager` singleton via `react-native-ble-plx`; scans for HR GATT service UUID; auto-stops after 15 s; sanity-checks 30 < hr < 250 |
| `hooks/useHealthConnect.ts` | `useHealthConnect()` → `fetchPostRunData(startTime, endTime)`, `isAvailable()`; reads `HeartRate`, `Steps`, `ActiveCaloriesBurned` from Android Health Connect; safe `getHC()` wrapper avoids iOS crash |

### Services
| File | Purpose |
|------|---------|
| `services/locationTask.ts` | Registers `runfacil-background-location` `TaskManager` task; emits `RUNFACIL_LOCATION_UPDATE` via `DeviceEventEmitter` |
| `services/bleService.ts` | `parseHeartRate(bytes[])` — handles flags byte (8-bit vs 16-bit HR measurement format) |

### Components
| File | Purpose |
|------|---------|
| `components/RunMap.tsx` | MapLibre via `@rnmapbox/maps`; `mode='live'` (follows user, GPS puck, locked camera) or `mode='static'` (cameraBounds from coords, scrollable); free tile style from OpenFreeMap |
| `components/LiveStats.tsx` | 3-column distance / time / pace row + optional HR row below |
| `components/RunControls.tsx` | Renders correct buttons per `RunStatus` with haptic feedback |
| `components/Button.tsx` | `primary` / `secondary` / `ghost` / `danger` variants |
| `components/ScreenHeader.tsx` | Back button + centered title/subtitle |
| `components/RunCard.tsx` | Run history list item |
| `components/WeeklySummary.tsx` | Orange weekly stats card (total km, time, runs) |

### Screens
| File | Route | Purpose |
|------|-------|---------|
| `app/_layout.tsx` | root | `RunProvider` + `SettingsProvider`; initialises MapLibre (`setWellKnownTileServer('MapLibre')`, empty token); imports `locationTask` to register background task |
| `app/index.tsx` | `/` | Home: `WeeklySummary` + run list + FAB to start a run |
| `app/run/active.tsx` | `/run/active` | Live run: GPS tracking, live map, `LiveStats`, `RunControls`; wires `useAudioCues`, `useHeartRate`; BLE pairing button in idle state; BLE overlay pill during run |
| `app/run/summary/[id].tsx` | `/run/summary/:id` | Post-run summary: hero header, stats card, HR card; enriches HR/calories from Health Connect if none recorded live |
| `app/history.tsx` | `/history` | `FlatList` of `RunCard`s |
| `app/history/[id].tsx` | `/history/:id` | Run detail: 280 px static map + stats; delete with `Alert` confirmation |
| `app/settings.tsx` | `/settings` | Theme selector, weight input, audio cues toggle |

### i18n
| File | Purpose |
|------|---------|
| `i18n/index.ts` | `i18n-js` setup, exports `t()` |
| `i18n/locales/pt.ts` | Full pt-BR translation file |

### Docs
| File | Purpose |
|------|---------|
| `docs/prd.md` | Full PRD: research findings, architecture decisions, smartwatch compatibility matrix, risk register, 15 cited sources |

---

## Key architecture decisions

| Decision | Reason |
|----------|--------|
| `@rnmapbox/maps` + `MapLibre` mode + OpenFreeMap style | `react-native-maps` blocks OSM tile usage on Android; this combo is zero-cost and requires no API key |
| `DeviceEventEmitter` bridge in location task | Expo background tasks run outside the React tree; `DeviceEventEmitter` is the only reliable in-process bridge |
| `onCoordinateRef` pattern in `useGPSTracking` | Prevents stale-closure bugs — the DeviceEventEmitter listener captures the ref, not the callback |
| Separate coordinates `useEffect` for distance+pace | Dispatching `ADD_COORDINATE` then immediately reading `state.distance` would see stale state; the effect re-runs after the reducer updates |
| Module-level `BleManager` singleton | Creating `BleManager` inside the hook causes multiple adapter instances and scan conflicts |
| `getHC()` lazy require with try/catch | `react-native-health-connect` is Android-only; this prevents the iOS bundler from crashing on a missing native module |
| `Mapbox.setAccessToken('')` (empty string) | TypeScript type requires a string; `null` causes a type error; empty string is accepted by the MapLibre path and issues no API call |

---

## Dependencies (all in `runfacil/package.json`)

```
expo ~54.0.0
expo-router ~6.0.23
react-native 0.81.5
@rnmapbox/maps ^10.1.0          ← maps (MapLibre, free)
expo-location ~18.0.0           ← GPS
expo-task-manager ~12.0.0       ← background GPS task
react-native-ble-plx ^3.1.0     ← direct BLE heart rate
react-native-health-connect ^1.4.0  ← post-run watch data
expo-speech ~14.0.8             ← audio km cues
expo-haptics ~15.0.8
expo-keep-awake ~15.0.8
i18n-js ^4.5.3
@react-native-async-storage/async-storage 2.2.0
expo-font, expo-asset, expo-constants, expo-splash-screen,
expo-system-ui, expo-linking, expo-localization, expo-av,
expo-build-properties
react-native-safe-area-context ~5.6.0
react-native-screens ~4.16.0
react-native-gesture-handler ~2.28.0
react-native-reanimated ~4.1.1
```

---

## What is NOT done yet (next steps)

### Phase 8 — Dashboard & Settings polish
These are the remaining items that would complete the MVP.

#### 8a. Weekly summary real data
- `WeeklySummary` component exists and renders but currently receives hardcoded/stub props from `index.tsx`.
- **To do:** In `app/index.tsx`, after `loadRuns()`, compute weekly totals (runs in the last 7 days: total km, total time, count) and pass them to `<WeeklySummary />`.
- Optionally add a streak counter (consecutive days with at least one run).

#### 8b. Settings — BLE device pairing
- `settings.pairedDeviceId` field already exists in `useSettings` but is never written.
- **To do:** In `app/settings.tsx`, add a "Pareamento de relógio" section. Trigger `startScan()` from `useHeartRate`, capture the first found device name/id, and call `updateSettings({ pairedDeviceId: device.id })`. On run start in `active.tsx`, if `pairedDeviceId` is set, call `bleManager.connectToDevice(pairedDeviceId)` directly instead of scanning — faster and more reliable.

#### 8c. Run notes
- `RunRecord.notes?: string` field already defined in `useRunStorage`.
- **To do:** Add a text input to `run/summary/[id].tsx` so the user can save a short note right after the run. Call `updateRun(run.id, { notes })`.

#### 8d. Static map on summary screen
- `app/run/summary/[id].tsx` has no map yet (unlike `history/[id].tsx` which has one).
- **To do:** Add `<RunMap mode='static' coordinates={run.coordinates} />` above the stats cards, matching the history detail screen.

#### 8e. Empty state on home
- `app/index.tsx` has no empty state when there are no runs.
- **To do:** If the run list is empty, show a friendly call-to-action card ("Sua primeira corrida está a um toque de distância").

#### 8f. EAS build / first real build
- `eas.json` is configured but no `npm install` or `npx expo prebuild` has been run.
- **To do (on a machine with Android SDK / EAS account):**
  ```bash
  cd runfacil
  npm install
  npx expo prebuild --platform android   # generates android/ folder
  eas build --platform android --profile preview
  ```
- `@rnmapbox/maps` and `react-native-ble-plx` both require native build steps — they will NOT work in Expo Go. Use a development build or EAS.

#### 8g. Health Connect permissions rationale string
- Android 13+ requires a `android:name="android.health.connect.PERMISSIONS_RATIONALE"` activity in `AndroidManifest.xml`.
- This is injected automatically by `react-native-health-connect`'s expo plugin IF it is listed in `app.json` plugins array.
- **To do:** Verify that `react-native-health-connect` is in the `plugins` array in `app.json` after prebuild. If not, add it manually.

---

## How to run locally (first time)

```bash
# 1. Install deps
cd runfacil
npm install

# 2. Prebuild native code (required — Expo Go won't work with BLE/maps)
npx expo prebuild --platform android

# 3a. Run on a connected device
npx expo run:android

# 3b. OR build a shareable APK via EAS
eas build --platform android --profile preview
```

> **Note:** MapLibre (`@rnmapbox/maps`) needs no API key. OpenFreeMap tiles are fetched at runtime — internet required.
> BLE and Health Connect only work on physical Android devices, not emulators.

---

## File tree

```
practice-projects/
├── docs/
│   └── prd.md                    ← full PRD & research
├── RUNFACIL_STATUS.md            ← this file
└── runfacil/
    ├── app.json
    ├── package.json
    ├── tsconfig.json
    ├── babel.config.js
    ├── metro.config.js
    ├── eas.json
    ├── .npmrc
    ├── declarations.d.ts
    ├── app/
    │   ├── _layout.tsx           ← providers, MapLibre init, task registration
    │   ├── index.tsx             ← home screen
    │   ├── settings.tsx
    │   ├── history.tsx
    │   ├── history/[id].tsx      ← run detail with static map
    │   └── run/
    │       ├── active.tsx        ← live run (GPS + BLE + audio cues)
    │       └── summary/[id].tsx  ← post-run summary + Health Connect enrichment
    ├── components/
    │   ├── Button.tsx
    │   ├── LiveStats.tsx
    │   ├── RunCard.tsx
    │   ├── RunControls.tsx
    │   ├── RunMap.tsx            ← MapLibre, live + static modes
    │   ├── ScreenHeader.tsx
    │   └── WeeklySummary.tsx
    ├── constants/
    │   ├── ble.ts
    │   ├── theme.ts
    │   └── units.ts
    ├── hooks/
    │   ├── useAudioCues.ts       ← km milestone TTS
    │   ├── useGPSTracking.ts     ← background GPS bridge
    │   ├── useHealthConnect.ts   ← post-run watch data
    │   ├── useHeartRate.ts       ← live BLE heart rate
    │   ├── useRunCalculations.ts
    │   ├── useRunStorage.ts
    │   └── useSettings.tsx
    ├── i18n/
    │   ├── index.ts
    │   └── locales/pt.ts
    ├── services/
    │   ├── bleService.ts
    │   └── locationTask.ts
    └── store/
        └── RunContext.tsx
```
