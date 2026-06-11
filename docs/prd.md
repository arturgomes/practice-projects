# RunFácil — Running Tracker App
## Product Requirements Document (PRD) + Research Report

> **Status:** Draft — MVP Scope  
> **Date:** June 2026  
> **Platform:** Android (primary), iOS (secondary)  
> **Stack:** React Native + Expo (same structure as [matematica-facil](https://github.com/arturgomes/matematica-facil))

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Research Findings](#3-research-findings)
   - [3.1 Map API Decision](#31-map-api-decision)
   - [3.2 GPS Tracking](#32-gps-tracking)
   - [3.3 Smartwatch Integration](#33-smartwatch-integration)
   - [3.4 Framework Decision: Expo vs Bare RN](#34-framework-decision-expo-vs-bare-rn)
   - [3.5 Architecture References](#35-architecture-references)
4. [User Stories (MVP)](#4-user-stories-mvp)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Model](#6-data-model)
7. [Key Libraries](#7-key-libraries)
8. [Screen Flow](#8-screen-flow)
9. [Smartwatch Compatibility Matrix](#9-smartwatch-compatibility-matrix)
10. [MVP Milestones](#10-mvp-milestones)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Sources](#12-sources)

---

## 1. Problem Statement

Strava and Nike Run Club are the gold standard for running tracking, but both push users toward paid subscriptions for features like route analysis, training plans, and history. The user is a beginner runner with a cheap Android smartwatch who wants:

- A **free, private** app that works offline (no subscription)
- **GPS route tracking** with a live map
- **Smartwatch integration** (heart rate, steps) without requiring an expensive watch
- A clean, simple UX aimed at beginners — not competitive athletes

---

## 2. Goals & Non-Goals

### Goals (MVP)
- Track a run with continuous GPS in the background
- Display a live map with the route polyline using a **100% free** map provider
- Show live stats: distance, current pace, elapsed time, heart rate
- Save runs locally; review history and post-run summaries
- Read heart rate from a cheap Android smartwatch (BLE or Health Connect)
- Audio cues at each kilometre ("1 km — pace 6:30/km")

### Non-Goals (post-MVP)
- Social features (segments, kudos, following)
- Cloud sync / backend
- iOS Apple Watch integration
- Elevation tracking
- Training plans
- Cycling / swimming modes

---

## 3. Research Findings

### 3.1 Map API Decision

#### Options Evaluated

| Library | Provider | API Key | Cost | Notes |
|---|---|---|---|---|
| **`@rnmapbox/maps` + MapLibre** | OpenStreetMap tiles | None | Free | Best choice — open-source Mapbox fork, OSM support, polylines built-in |
| `react-native-leaflet` | OpenStreetMap | None | Free | Simpler but less performant for animated routes |
| `react-native-maps` (Google) | Google Maps | Required | ~$0.007/req after 28k/month free | Android requires Google API key; OSM tiles blocked on Android |
| `rnmapbox/maps` (Mapbox hosted) | Mapbox | Required | MAU-based pricing | Mobile billed per Monthly Active Users, not map loads |

#### Verdict: MapLibre + OpenStreetMap

`@rnmapbox/maps` configured with MapLibre and OpenStreetMap tile servers is the recommended approach:
- No API key required
- No usage-based billing
- Supports polyline drawing, camera animation, custom markers
- Active open-source community

**Key finding:** `react-native-maps` on Android blocks direct OpenStreetMap tile usage due to historical abuse issues. The workaround requires self-hosted tiles or custom tile overlays — MapLibre avoids this entirely.

Mapbox's free tier for **web** is 50,000 map loads/month, but **mobile** is billed differently (Monthly Active Users). For a personal app MapLibre + OSM is strictly better.

---

### 3.2 GPS Tracking

#### Background Location on Android

Android requires a **Foreground Service** with a persistent notification to keep GPS running when the app is backgrounded (Android 8+ requirement, enforced strictly on Android 14+).

**Permissions required:**
```xml
<!-- AndroidManifest.xml (auto-managed by Expo config plugin) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

**Expo app.json config:**
```json
{
  "plugins": [
    ["expo-location", {
      "isAndroidBackgroundLocationEnabled": true,
      "isAndroidForegroundServiceEnabled": true,
      "androidForegroundServiceIcon": "./assets/icons/notification.png"
    }]
  ]
}
```

#### Primary Library: `expo-location` + `expo-task-manager`

```typescript
// services/locationTask.ts
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  // append to run coordinate store
});

// Start tracking
await Location.startLocationUpdatesAsync(LOCATION_TASK, {
  accuracy: Location.Accuracy.BestForNavigation,
  distanceInterval: 5,           // update every 5 metres
  deferredUpdatesDistance: 10,   // batch updates every 10m for battery
  foregroundService: {
    notificationTitle: 'RunFácil',
    notificationBody: 'Rastreando sua corrida…',
    notificationColor: '#FF6B35',
  },
});
```

#### Key Limitations
- If the user **force-kills** the app, tracking stops — the app cannot auto-restart on location events (Android limitation). This matches Strava's behavior.
- iOS requires "Always" background permission prompt — handled separately.
- Use `deferredUpdatesDistance` + `deferredUpdatesInterval` to reduce battery drain on long runs.

#### Alternative: `react-native-background-geolocation`
- Apache-2.0 license (free and open-source)
- More advanced: battery-saving circular region monitoring, stop detection, HTTP syncing
- Three provider modes: `DISTANCE_FILTER_PROVIDER`, `ACTIVITY_PROVIDER`, `RAW_PROVIDER`
- Good fallback if `expo-location` proves insufficient

---

### 3.3 Smartwatch Integration

Cheap Android smartwatches (Xiaomi Mi Band, Amazfit, Realme Band, Huawei Band, etc.) communicate via their proprietary companion apps. Two integration paths exist:

#### Layer 1 — Android Health Connect (Recommended Start)

**Library:** `react-native-health-connect` (by matinzd, Apache-2.0)

Health Connect is Google's unified health data API — the Android equivalent of Apple's HealthKit. Smartwatch companion apps (Mi Fitness, Zepp, Huawei Health, etc.) sync their data to Health Connect. Your app reads from that central store.

- **No direct BLE required** — companion app does the heavy lifting
- **Android 13+** (Android 14+ has it built-in; Android 13 needs the Health Connect app)
- Supports 50+ data types: heart rate, steps, calories, sleep, distance, workout sessions

```typescript
// hooks/useHealthConnect.ts
import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';

export function useHealthConnect() {
  const fetchHeartRateForRun = async (startTime: string, endTime: string) => {
    await initialize();
    await requestPermission([{ accessType: 'read', recordType: 'HeartRate' }]);
    const { records } = await readRecords('HeartRate', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });
    return records;
  };

  return { fetchHeartRateForRun };
}
```

**Covers ~80% of use cases** — if the cheap watch syncs to Health Connect via its app, this works with minimal code.

#### Layer 2 — Direct BLE (Real-Time Heart Rate During Run)

**Library:** `react-native-ble-plx` (MIT license)

For real-time heart rate display _during_ the run (not just post-run sync), read directly from the watch via BLE using the standard GATT Heart Rate Service:

| Item | Value |
|---|---|
| Service UUID | `0x180D` / `0000180d-0000-1000-8000-00805f9b34fb` |
| Characteristic UUID | `0x2A37` / `00002a37-0000-1000-8000-00805f9b34fb` |
| Data latency | ~23ms |
| Connection success rate | 97.8% across 200+ tested devices |

```typescript
// services/bleService.ts — heart rate subscription
device.monitorCharacteristicForService(
  HEART_RATE_SERVICE_UUID,
  HEART_RATE_CHAR_UUID,
  (error, characteristic) => {
    if (!characteristic?.value) return;
    const bytes = Buffer.from(characteristic.value, 'base64');
    const flags = bytes[0];
    const hr = flags & 0x01 ? bytes.readUInt16LE(1) : bytes[1]; // 8 or 16-bit format
    setHeartRate(hr);
  }
);
```

Android permissions required:
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

**Note:** Older devices (pre-2015) or devices with proprietary GATT services may not expose the standard Heart Rate UUID and will need custom handling.

#### Strategy
| Use case | Approach |
|---|---|
| Post-run heart rate summary | Health Connect (reads from companion app sync) |
| Live heart rate during run | Direct BLE via `react-native-ble-plx` |
| Steps / calories | Health Connect |
| Watch settings / display | Not in MVP scope |

---

### 3.4 Framework Decision: Expo vs Bare RN

#### Comparison

| Factor | Expo Managed | Expo Prebuild (Bare) | Bare RN CLI |
|---|---|---|---|
| Setup speed | Fast | Medium | Slow |
| Background GPS | Partial (Expo Go only) | Full | Full |
| BLE support | No (Expo Go) | Yes (after prebuild) | Yes |
| Health Connect | No (Expo Go) | Yes | Yes |
| EAS builds | Yes | Yes | Yes |
| OTA updates | Yes | Yes | No |
| Same as matematica-facil | Yes | Yes (extends it) | No |

#### Verdict: Expo SDK + Prebuild

Start with the same Expo SDK foundation as `matematica-facil`, then run `npx expo prebuild` to generate native `android/` and `ios/` folders. This gives:
- Full access to native APIs (BLE, Health Connect, foreground service)
- Expo SDK libraries still work (expo-location, expo-speech, expo-av, etc.)
- EAS for builds and OTA updates
- No need to learn bare React Native from scratch

This is the standard recommendation for production fitness apps in 2025.

---

### 3.5 Architecture References

Open-source reference projects studied:
- `antarid/strava` — React Native Strava clone
- `Youngermaster/GPS-Route-Tracking-System` — React Native + EMQX MQTT + MongoDB + FastAPI for real-time GPS
- `totorototo/strava` — React Native consuming Strava's REST API

Common patterns found:
- GPS coordinates sent every 1 second during active tracking
- Polyline redrawn incrementally (not re-rendered from scratch)
- Run data stored locally (SQLite or AsyncStorage) with optional backend sync
- Pace calculated as rolling average over last 500m, not instantaneous

---

## 4. User Stories (MVP)

| # | Story | Priority |
|---|---|---|
| US-01 | As a runner, I can press Start to begin tracking my GPS route in real time | P0 |
| US-02 | As a runner, I see a live map with my route drawn as a coloured polyline | P0 |
| US-03 | As a runner, I see live stats: distance, current pace, elapsed time | P0 |
| US-04 | As a runner, I can pause and resume a run without losing data | P0 |
| US-05 | As a runner, I can finish a run and see a summary (map, distance, avg pace, time) | P0 |
| US-06 | As a runner, my runs are saved and I can review them in a history list | P1 |
| US-07 | As a watch owner, my heart rate appears on screen during the run | P1 |
| US-08 | As a runner, I receive audio cues at each km ("1 km — pace 6:30/km") | P2 |
| US-09 | As a runner, I see a weekly summary: total km, number of runs, longest run | P2 |
| US-10 | As a runner, I can set a target distance or time goal before starting | P2 |

---

## 5. Technical Architecture

```
runfacil/
├── app/                              # Expo Router (file-based routes)
│   ├── _layout.tsx                   # Root layout: providers, Stack nav
│   ├── index.tsx                     # Home / Dashboard screen
│   ├── run/
│   │   ├── active.tsx                # Live run screen (map + stats overlay)
│   │   └── summary/[id].tsx          # Post-run summary screen
│   ├── history.tsx                   # Run history list
│   ├── history/[id].tsx              # Individual run detail + map replay
│   └── settings.tsx                  # App settings (units, audio, BLE pairing)
│
├── components/
│   ├── RunMap.tsx                    # MapLibre map with polyline + location dot
│   ├── LiveStats.tsx                 # Distance / Pace / HR stats panel
│   ├── RunControls.tsx               # Start / Pause / Stop buttons
│   ├── HeartRateBadge.tsx            # Live BLE heart rate display
│   ├── RunCard.tsx                   # History list item card
│   ├── WeeklySummary.tsx             # Dashboard widget
│   ├── Button.tsx                    # Themeable button (same as matematica-facil)
│   └── ScreenHeader.tsx              # Top bar with back button + title
│
├── hooks/
│   ├── useGPSTracking.ts             # Start/stop/pause location tracking
│   ├── useHeartRate.ts               # BLE scan, connect, subscribe to HR
│   ├── useHealthConnect.ts           # Android Health Connect queries
│   ├── useRunStorage.ts              # AsyncStorage CRUD for RunRecord[]
│   └── useRunCalculations.ts         # Pace, distance (Haversine), calories
│
├── services/
│   ├── locationTask.ts               # TaskManager background task definition
│   └── bleService.ts                 # BLE scan/connect/read/disconnect logic
│
├── store/
│   └── RunContext.tsx                # Active run state (Context API)
│                                     # Holds: status, coordinates[], heartRate, duration
│
├── constants/
│   ├── theme.ts                      # Color palette (light/dark, matches matematica-facil)
│   ├── ble.ts                        # GATT UUIDs for Heart Rate Service
│   └── units.ts                      # Pace formatting, calorie estimation formula
│
├── i18n/
│   ├── index.ts                      # i18n-js setup
│   └── locales/pt.ts                 # Portuguese (pt-BR) translations
│
├── assets/
│   ├── icons/
│   ├── fonts/                        # SF Pro Display (same as matematica-facil)
│   └── audio/
│       └── km-beep.mp3               # Audio cue trigger sound
│
├── app.json                          # Expo config (location plugin, BLE, permissions)
├── package.json
├── tsconfig.json                     # Strict TypeScript (same as matematica-facil)
├── babel.config.js
├── metro.config.js
└── eas.json
```

### State Management

Same pattern as `matematica-facil` — Context API only, no Redux/MobX:

```typescript
type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

type RunState = {
  status: RunStatus;
  startedAt: number | null;
  pausedDuration: number;         // accumulated paused seconds
  coordinates: Coordinate[];      // full GPS trail
  heartRate: number | null;       // latest BLE reading
  distance: number;               // metres
  pace: number;                   // seconds per km (rolling avg)
};
```

---

## 6. Data Model

```typescript
// Stored in AsyncStorage at key '@runfacil/runs'

type Coordinate = {
  lat: number;
  lng: number;
  timestamp: number;    // Unix ms
  accuracy?: number;    // metres
};

type RunRecord = {
  id: string;                    // UUID v4
  startedAt: number;             // Unix ms
  finishedAt: number;            // Unix ms
  durationSeconds: number;       // excludes paused time
  distanceMeters: number;
  avgPaceSecPerKm: number;
  bestPaceSecPerKm: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  caloriesKcal: number;          // estimated: MET * weight * hours
  coordinates: Coordinate[];     // full GPS trail for map replay
  notes?: string;
};
```

### Calorie Estimation
Using MET (Metabolic Equivalent of Task) formula:
```
calories = MET × weight_kg × duration_hours
```
Running MET values: ~8 (slow jog) to ~14 (fast run). Default: 9.8 (moderate pace ~6:00/km).
User weight stored in Settings (AsyncStorage).

---

## 7. Key Libraries

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~6.0.0",
    "react-native": "0.81.5",
    "typescript": "~5.9.2",

    "@rnmapbox/maps": "^10.1.0",

    "expo-location": "~18.0.0",
    "expo-task-manager": "~12.0.0",

    "react-native-ble-plx": "^3.1.0",
    "react-native-health-connect": "^2.0.0",

    "react-native-reanimated": "~4.1.0",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",

    "@react-native-async-storage/async-storage": "^2.2.0",
    "expo-speech": "~14.0.0",
    "expo-av": "~16.0.0",
    "expo-haptics": "~15.0.0",
    "expo-keep-awake": "~15.0.0",
    "expo-font": "~14.0.0",
    "@expo/vector-icons": "^15.0.0",
    "i18n-js": "^4.5.3",
    "expo-localization": "~17.0.0"
  }
}
```

---

## 8. Screen Flow

```
┌─────────────────────────────────────────┐
│              Home / Dashboard           │
│  [Weekly km] [Last run card]           │
│                                         │
│         [ START RUN ]                  │
│                                         │
│    [History]        [Settings]          │
└────────┬──────────────────┬────────────┘
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│  Active Run     │  │  History List    │
│                 │  │                  │
│  [Live Map]     │  │  Run Card        │
│  [Stats panel]  │  │  Run Card        │
│  [HR badge]     │  │  Run Card        │
│                 │  └───────┬──────────┘
│  [Pause][Stop]  │          │
└────────┬────────┘          ▼
         │           ┌──────────────────┐
         ▼           │  Run Detail      │
┌─────────────────┐  │  [Route map]     │
│  Run Summary    │  │  [Full stats]    │
│  [Route map]    │  └──────────────────┘
│  [Stats table]  │
│  [Share / Save] │
└─────────────────┘
```

---

## 9. Smartwatch Compatibility Matrix

| Watch Brand | Example Models | Integration Path | Library |
|---|---|---|---|
| Xiaomi | Mi Band 8, 9; Smart Band 8 | Companion app → Health Connect | `react-native-health-connect` |
| Amazfit | GTR 4, Bip 5, GTS 4 | Zepp app → Health Connect | `react-native-health-connect` |
| Realme | Watch 3 Pro, S Pro | Realme Link → Health Connect | `react-native-health-connect` |
| Huawei | Band 8, 9; Watch GT4 | Huawei Health → Health Connect | `react-native-health-connect` |
| Any BLE watch | Generic trackers | Direct BLE GATT (UUID 0x180D) | `react-native-ble-plx` |
| Samsung Galaxy | Watch 6, 7 | Samsung Health → Health Connect | `react-native-health-connect` |
| Apple Watch | All models | Not in MVP scope | — |

**Note:** Health Connect requires Android 13+. Watches using 100% proprietary Bluetooth protocols (no standard GATT) may not expose the Heart Rate Service UUID — in this case only post-run data from Health Connect is available.

---

## 10. MVP Milestones

| Phase | Deliverable | Est. Effort |
|---|---|---|
| **Phase 0** | Project scaffold: Expo SDK, expo-router, TypeScript, theme, i18n (pt-BR), EAS config | 1 day |
| **Phase 1** | Background GPS: foreground service, coordinate logging to context, start/pause/stop | 2–3 days |
| **Phase 2** | MapLibre map screen: live polyline, camera follows user, current location dot | 2–3 days |
| **Phase 3** | Run stats: distance (Haversine), rolling pace, duration timer; post-run summary screen | 2 days |
| **Phase 4** | AsyncStorage persistence: save run, history list screen, run detail screen | 1–2 days |
| **Phase 5** | Health Connect integration: post-run HR, steps, calories sync from watch companion app | 1–2 days |
| **Phase 6** | BLE real-time heart rate: scan, connect, subscribe to GATT HR characteristic | 2–3 days |
| **Phase 7** | Audio cues: expo-speech km announcements, keep-awake, haptic feedback | 1 day |
| **Phase 8** | Dashboard: weekly stats, streak, settings (weight, units, BLE device pairing) | 1–2 days |

**Total MVP estimate:** 13–18 days of focused part-time development.

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Android kills background GPS process | Medium | High | Foreground service notification makes the process hard to kill; document that force-stopping stops tracking |
| Cheap watch uses closed proprietary BLE protocol | Medium | Medium | Fall back to Health Connect (companion app handles the proprietary layer) |
| OpenStreetMap tile server rate limits | Low (personal app) | Low | Self-host via Maptiler free tier (100k tiles/month) as fallback |
| Battery drain during long runs (1h+) | Medium | Medium | `deferredUpdatesDistance=10m`, `Balanced` accuracy, keep-awake only during active run |
| GPS accuracy in urban canyons / forests | Medium | Medium | Show accuracy indicator; filter out readings with accuracy > 30m |
| `react-native-health-connect` Android 13+ requirement | Low | Low | Gracefully degrade: show message if Health Connect unavailable, still offer BLE path |
| Expo prebuild complexity | Low | Medium | Follow Expo docs; config plugins handle most native setup automatically |

---

## 12. Sources

1. [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/) — Background tracking APIs, permissions, foreground service config
2. [Best React Native Map Modules Comparison — DEV Community](https://dev.to/erenelagz/best-react-native-map-modules-comparison-of-the-most-popular-8-libraries-201b) — Library comparison including react-native-leaflet, react-native-maps, rnmapbox
3. [Expo GPS Location + Task Manager — DEV Community](https://dev.to/samioncode/expo-gps-location-task-manager-k84) — TaskManager + expo-location practical guide
4. [react-native-background-geolocation — GitHub (mauron85)](https://github.com/mauron85/react-native-background-geolocation) — Apache-2.0 alternative GPS library; foreground service, stop detection
5. [How to Integrate ANY Wearable with React Native — xmartlabs](https://blog.xmartlabs.com/blog/wereables-react-native-integration/) — Health Connect + HealthKit strategy, `react-native-health` / `react-native-health-connect`
6. [react-native-health-connect — GitHub (matinzd)](https://github.com/matinzd/react-native-health-connect) — Android Health Connect wrapper library
7. [BLE Heart Rate Monitor: React Native — WellAlly](https://www.wellally.tech/blog/react-native-ble-heart-rate-monitor-tutorial) — GATT UUIDs, 97.8% connection success, binary data parsing
8. [Expo vs. Bare React Native in 2025 — Godel Technologies](https://www.godeltech.com/blog/expo-vs-bare-react-native-in-2025/) — Framework comparison for production apps
9. [Mapbox Pricing](https://www.mapbox.com/pricing) — Web: 50k free map loads/month; Mobile: MAU-based
10. [react-native-maps + OpenStreetMap — GitHub Discussion](https://github.com/react-native-maps/react-native-maps/discussions/5245) — Android blocks OSM tiles; MapLibre recommended workaround
11. [Android Health Connect — Android Developers](https://developer.android.com/health-and-fitness/health-connect) — Official API docs; 50+ data types; Android 13+ requirement
12. [Integrating Health Connect in React Native — DEV Community](https://dev.to/tapan-7/integrating-health-connect-in-android-react-native-apps-2cj4) — Practical integration guide
13. [Using react-native-ble-manager — LogRocket](https://blog.logrocket.com/using-react-native-ble-manager-mobile-app/) — BLE scan/connect flow in React Native
14. [BLE Integration for Fitness Devices — Stormotion](https://stormotion.io/blog/how-to-create-an-app-for-fitness-devices-in-react-native/) — Fitness device integration guide
15. [Expo Location Guide — Anthony Coffey](https://coffey.codes/articles/building-location-based-features-using-expo-location) — Accuracy modes, battery optimisation, background setup
