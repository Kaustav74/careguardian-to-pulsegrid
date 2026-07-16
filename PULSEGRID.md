# Pulsegrid — Real-Time Emergency Medical Response Coordination Grid

> **The emergency operations core of PulseGrid**
> Tagline: *"10 seconds. Fully automated. No calls. No coordination."*

---

## What Pulsegrid Is

A **real-time, map-first emergency coordination network** that connects patients,
ambulances, hospitals, and emergency operators on a single live grid.

When a medical emergency happens → every stakeholder acts **simultaneously**, not sequentially.

---

## The Problem It Solves

**India today — 6 manual steps that cost lives:**
```
1. Patient triggers SOS on an app
2. Operator manually calls an ambulance     ← 2-4 minutes lost
3. Ambulance driver figures out the route   ← 3-5 minutes lost
4. Operator calls hospitals for bed status  ← 5-10 minutes lost
5. Ambulance reaches hospital with no beds  ← Patient transferred again
6. Golden hour is lost
```

**Pulsegrid eliminates steps 2–5. They happen automatically in <10 seconds.**

---

## How It Works

```
Patient triggers SOS (1 tap / automatic via hardware)
                 ↓
  Pulsegrid Algorithm fires in <1 second:
  ┌──────────────────────────────────────────┐
  │  • Captures patient GPS + medical profile │
  │  • Finds nearest AVAILABLE ambulance      │
  │  • Finds nearest hospital with ICU beds   │
  │  • Calculates optimal road route (OSRM)   │
  └──────────────────────────────────────────┘
                 ↓
  Simultaneously — all in real-time:
  ┌─────────────────────────────────────────────────────┐
  │   Ambulance Driver  → Route on map, auto-assigned │
  │   Operator         → Emergency on command grid    │
  │   Family Member   → Live ambulance tracking       │
  │   Hospital          → Pre-alerted, bed reserved   │
  │   Nurse / ER Team  → Patient vitals pre-loaded    │
  └─────────────────────────────────────────────────────┘
```

---

## Core Modules

### 1. SOS Trigger Engine
- One-tap trigger from patient dashboard
- Captures GPS coordinates automatically
- Broadcasts to ALL online operators in region simultaneously
- Attaches patient blood group, allergies, medical history
- First operator to accept → owns the emergency

### 2. The Live Grid (Command Map)
Real-time map showing every stakeholder at once:
```
 Active emergencies     → pulsing red markers
 All ambulances         → live GPS positions, moving in real-time
 All hospitals          → color-coded by ICU availability
    Green  = beds available
    Yellow = limited beds
    Red    = no beds
 Routing lines          → ambulance → patient → hospital
```

### 3. Intelligent Dispatch Engine (The Algorithm)
```typescript
// When operator auto-dispatches:

Step 1: Get all ambulances with status = "AVAILABLE"
Step 2: Sort by straight-line distance (Haversine formula)
Step 3: Take top 3 nearest ambulances
Step 4: Get all hospitals with ICU/ER beds > 0
Step 5: For each combination → call OSRM for real road ETA
Step 6: Pick minimum (time to patient + time to hospital)
Step 7: Auto-assign. Broadcast. Done.
```

### 4. Real-Time Communication Layer
All updates are **pushed via Socket.io**, never polled:
```
Emergency created    → All operators notified in <500ms
Operator accepts     → Ambulance driver notified instantly
Ambulance moves      → Map updates every 3 seconds
Hospital updates beds → Grid updates for all operators live
Ambulance on scene   → Family member notified automatically
```

### 5. Hospital Bed Grid
- Every registered hospital has a live bed dashboard
- Hospital admin updates ICU / ER / General counts
- Pulsegrid operators see it live on the grid
- Algorithm never routes to a hospital with 0 ICU beds

### 6. Ambulance Driver Navigation
- Accepts assignment → gets full route on Leaflet map
- Patient marker + hospital destination pre-set
- One-tap status ladder:
  ```
  AVAILABLE → EN ROUTE → ON SCENE → TRANSPORTING → DELIVERED
  ```
- Each status update broadcasts to family + operator instantly

### 7. Patient & Family Live Tracking
- Family sees ambulance moving toward patient on map (live)
- Ambulance ETA displayed and updating
- Hospital destination shown
- Driver name and vehicle number displayed
- Zero need to call anyone

---

## Tech Stack

### Frontend
```
React 18 + TypeScript + Vite
├── Leaflet.js              Map rendering (free, no API key)
├── OpenStreetMap tiles     Free map tiles
├── Socket.io-client        Real-time grid updates
├── Zustand                 State management
└── TailwindCSS             Styling
```

### Backend
```
Node.js + Express
├── Socket.io               WebSocket server (real-time grid)
├── Prisma ORM              Database layer
├── SQLite (dev)            Local database
├── PostgreSQL (prod)       Render.com free tier
└── JWT                     Authentication
```

### Mapping & Routing Stack (100% Free)
```
Leaflet.js                  Map rendering library
OpenStreetMap               Map tile provider (free forever)
OSRM Demo Server            Routing API (free, no API key)
  └── http://router.project-osrm.org/route/v1/driving/
      {lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson
Nominatim                   Geocoding — address to coordinates (free)
  └── https://nominatim.openstreetmap.org/search?q={address}&format=json
```

### AI Layer
```
Groq API (free tier)
├── Triage scoring from patient symptom description
├── Nearest hospital recommendation with reasoning
└── Post-emergency incident summary generation
```

### Deployment (Total Cost: ₹0)
```
Frontend   → Vercel         (free tier, auto-deploy from GitHub)
Backend    → Render.com     (free tier)
Database   → Render PostgreSQL (free 90-day)
Domain     → pulsegrid.vercel.app (free)
```

---

## Database Schema (Core Tables)

```prisma
model EmergencyRequest {
  id              String   @id @default(cuid())
  patientId       String
  latitude        Float
  longitude       Float
  status          String   @default("PENDING")
  // PENDING → OPERATOR_ASSIGNED → AMBULANCE_DISPATCHED
  // → ON_SCENE → TRANSPORTING → DELIVERED → RESOLVED
  priority        String   @default("CRITICAL")
  description     String?
  bloodGroup      String?
  allergies       String?
  operatorId      String?
  ambulanceId     String?
  hospitalId      String?   // Pre-assigned destination
  etaMinutes      Int?      // Calculated ETA
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model AmbulanceUnit {
  id          String   @id @default(cuid())
  driverId    String   @unique
  regNumber   String
  latitude    Float    @default(0)
  longitude   Float    @default(0)
  status      String   @default("AVAILABLE")
  // AVAILABLE → DISPATCHED → ON_SCENE → TRANSPORTING
  lastPing    DateTime @default(now())
}

model HospitalBedGrid {
  id               String   @id @default(cuid())
  hospitalName     String
  latitude         Float
  longitude        Float
  icuAvailable     Int      @default(0)
  icuTotal         Int      @default(0)
  erAvailable      Int      @default(0)
  erTotal          Int      @default(0)
  generalAvailable Int      @default(0)
  generalTotal     Int      @default(0)
  updatedAt        DateTime @updatedAt
}

model DispatchLog {
  id              String   @id @default(cuid())
  emergencyId     String
  ambulanceId     String
  operatorId      String
  hospitalId      String
  distanceKm      Float
  etaMinutes      Int
  responseTimeSec Int      // Time from SOS → dispatch (the key metric)
  createdAt       DateTime @default(now())
}
```

---

## API Endpoints

```
EMERGENCY CORE
──────────────────────────────────────────────────────
POST  /api/emergency/sos              Patient triggers SOS
GET   /api/emergency/active           All active emergencies (operator view)
POST  /api/emergency/:id/accept       Operator accepts emergency
POST  /api/emergency/:id/dispatch     Dispatch ambulance + pre-assign hospital
POST  /api/emergency/:id/status       Driver updates status
GET   /api/emergency/:id/track        Live tracking (patient/family)

AMBULANCE GRID
──────────────────────────────────────────────────────
GET   /api/grid/ambulances            All ambulance positions + status
POST  /api/grid/ambulance/ping        Driver sends GPS coordinates
POST  /api/grid/ambulance/status      Driver updates availability

HOSPITAL BED GRID
──────────────────────────────────────────────────────
GET   /api/grid/hospitals             All hospitals + live bed counts
POST  /api/grid/hospital/:id/beds     Hospital updates bed availability

OPTIMAL ROUTING
──────────────────────────────────────────────────────
GET   /api/routing/optimal            Best ambulance + hospital for SOS
  ?patientLat=28.6139&patientLng=77.2090

AI TRIAGE
──────────────────────────────────────────────────────
POST  /api/ai/triage                  Groq scores emergency severity
  Body: { description: "chest pain, sweating, left arm pain" }
  Returns: { level: "CRITICAL", reasoning: "...", action: "IMMEDIATE_DISPATCH" }
```

---

## Socket.io Event Map

```
CLIENT → SERVER
────────────────────────────────────────────────────────
ambulance:ping          { lat, lng, ambulanceId }
operator:accept         { emergencyId, operatorId }
hospital:beds:update    { hospitalId, icuAvailable, erAvailable }
driver:status:update    { ambulanceId, status }

SERVER → ALL CLIENTS (broadcast)
────────────────────────────────────────────────────────
emergency:new           New SOS → all operators notified
emergency:updated       Status change → all stakeholders updated
ambulance:moved         GPS update → map redraws ambulance position
hospital:grid:updated   Bed count change → operator grid updates
dispatch:confirmed      ETA + route → patient/family notified
```

---

## The Dispatch Algorithm (Haversine + OSRM)

```typescript
async function calculateOptimalDispatch(
  patientLat: number,
  patientLng: number
): Promise<DispatchPlan> {

  // Step 1: Get all available ambulances
  const ambulances = await prisma.ambulanceUnit.findMany({
    where: { status: 'AVAILABLE' }
  });

  // Step 2: Sort by straight-line distance (fast pre-filter)
  const ranked = ambulances.sort((a, b) =>
    haversine(patientLat, patientLng, a.latitude, a.longitude) -
    haversine(patientLat, patientLng, b.latitude, b.longitude)
  ).slice(0, 3); // Top 3 candidates

  // Step 3: Get hospitals with available beds
  const hospitals = await prisma.hospitalBedGrid.findMany({
    where: { icuAvailable: { gt: 0 } }
  });

  // Step 4: Get real road times from OSRM for each combination
  const plans = await Promise.all(
    ranked.flatMap(amb =>
      hospitals.map(async hosp => {
        const route = await fetch(
          `http://router.project-osrm.org/route/v1/driving/` +
          `${amb.longitude},${amb.latitude};` +
          `${patientLng},${patientLat};` +
          `${hosp.longitude},${hosp.latitude}` +
          `?overview=full&geometries=geojson`
        ).then(r => r.json());

        return {
          ambulance: amb,
          hospital: hosp,
          totalDurationSec: route.routes[0].duration,
          totalDistanceKm: route.routes[0].distance / 1000,
          geometry: route.routes[0].geometry  // GeoJSON for Leaflet
        };
      })
    )
  );

  // Step 5: Return the fastest total route
  return plans.sort((a, b) => a.totalDurationSec - b.totalDurationSec)[0];
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) *
            Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

---

## Live Grid Layout (What Judges See)

```
┌──────────────────────────────────────────────────────────────┐
│  PULSEGRID  Emergency Command Center          ● LIVE  [Sync] │
│                                                               │
│  Active: 3  │  Ambulances Online: 7  │  ICU Beds Total: 24   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│       AIIMS Delhi                                           │
│         ICU: 3 available  ●green                             │
│              ↑                                               │
│        [route line]                                          │
│              │                                               │
│       AMB-04 ──────────→  CRITICAL (Rajesh Kumar)        │
│                                                              │
│    PENDING ──→ [AUTO DISPATCH]     Safdarjung (ICU: 0)  │
│    New patient SOS                     ●red               │
│                                                              │
│               AMB-02 (available)                           │
│                         AMB-07 (available)                 │
│                                                              │
│       RML Hospital — ICU: 7 available  ●green              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## SDG Mapping

| Pulsegrid Feature | SDG Goal |
|:---|:---|
| Emergency response time reduction | SDG 3.8 — Universal Health Coverage |
| No bed-rejection routing | SDG 3.d — Health emergency preparedness |
| Works on basic smartphones (no special hardware) | SDG 10 — Reduced Inequalities |
| Real-time dispatch grid infrastructure | SDG 9 — Innovation & Infrastructure |
| Full dispatch audit trail | SDG 16 — Justice & Strong Institutions |
| Family tracking reduces panic calls | SDG 11 — Sustainable Cities |

---

## Competitive Differentiation

| Platform | What They Do | What's Missing |
|:---|:---|:---|
| **Dial 112 (India)** | Manual operator dispatch | No live grid, no bed availability, no family tracking |
| **StanPlus** | Ambulance booking | No operator command grid, no bed routing |
| **Uber Health (US)** | Ride for medical | Not emergency, no hospital coordination |
| **RapidSOS (US)** | Emergency data sharing | US only, no fleet management |
| **Practo Emergency** | SOS button | No ambulance tracking, no hospital bed grid |

**Pulsegrid is the only system where bed availability + ambulance GPS + patient SOS
+ operator dispatch + family tracking are all on one live map, all updating in real-time.**

---

## Pitch (10 Seconds)

> *"Pulsegrid is a real-time emergency medical grid. When you trigger SOS,
> the nearest ambulance is automatically routed to the hospital with available
> ICU beds — while your family watches the ambulance move toward you live on a map.
> No calls. No coordination. 10 seconds. Fully automated."*

---

## Key Metrics to Claim

- **Response time:** SOS → ambulance dispatched in <10 seconds (vs 5-10 minutes manually)
- **Zero bed rejections:** Algorithm never routes to a full hospital
- **100% audit trail:** Every dispatch logged with timestamp + operator ID
- **Infrastructure cost:** ₹0 (all free-tier services)
- **Lives saved potential:** Reducing response time by 5 minutes improves cardiac arrest survival by ~10%

---

*Part of PulseGrid — Full-Stack Healthcare Operations Platform*
*Built with React + Node.js + Socket.io + Leaflet.js + OSRM + Groq AI*
