# 🌐 PulseGrid — Unified Healthcare Operations & Emergency Coordination Ecosystem

> **Next-Generation Healthcare Command Desk & Infrastructure-Free Tactical Emergency Mesh**  
> *10 seconds. Fully automated. Zero external dependencies. Zero CDN calls. Emergency response when the grid goes dark.*

---

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Key Sub-Systems](#-key-sub-systems)
3. [System Architecture](#-system-architecture)
4. [Technology Stack](#-technology-stack)
5. [Seeded Local Test Accounts](#-seeded-local-test-accounts)
6. [Installation & Setup](#-installation--setup)
7. [Competitive Differentiation & SDG Alignment](#-competitive-differentiation--sdg-alignment)

---

## 🌟 Overview

**PulseGrid** is a high-fidelity, real-time medical operations platform built with a dark mode glassmorphism UI. It is designed to modernize healthcare workflows and bypass damaged communication infrastructure during disasters. 

By unifying **13 distinct role-based dashboards** with a **real-time emergency routing engine** and an **ESP32 hardware mesh gateway**, PulseGrid coordinates patient care, bed allocation, and ambulance dispatch in **under 10 seconds** without sequential manual phone calls.

---

## 🛠️ Key Sub-Systems

### 1. The Full-Stack Healthcare Command Desk
Facilitates modular, role-based workflows for Patients, Family Members, Doctors, Nurses, and Pharmacists, backed by a persistent SQLite database (via Prisma) and real-time WebSocket communication:
- **Flashing Vital Alarm Telemetry (ICU/Ward Desk)**: Displays real-time ward bed states. If a patient's vitals drop below safe physiological thresholds (e.g., SpO2 < 95% or heart rate > 100 bpm), the bed card dynamically flashes with warning states to prompt immediate intervention.
- **Automated Drug Interaction Verification**: The *Prescription Fulfillment Center* analyzes e-prescriptions against the patient's record to flag contraindications, allergen cross-sensitivities (e.g., Penicillin warnings), and controlled substances.
- **Controlled Substance Registry (Schedule H)**: A dedicated registry tracks dispatches and restocks of regulated medicines like Morphine, mapping the authorized pharmacist, target patient, quantity, and timestamp.
- **Interactive Shift Handovers**: Allows nursing shifts to auto-compile patient telemetry, active doctor instructions, and outstanding medications into structured handovers for the incoming team.

### 2. The Real-Time Coordination Grid (Map-First SOS)
A map-first emergency network connecting patients, ambulances, hospitals, and operators on a single live grid:
- **SOS Trigger Engine**: One-tap trigger from patient dashboard captures GPS coordinates and broadcasts to all online operators in the region, attaching blood group, allergies, and medical history.
- **Intelligent Dispatch Engine (Haversine + OSRM)**: Automatically pre-filters nearest available ambulances via straight-line Haversine distance, and queries the Open Source Routing Machine (OSRM) for real road ETAs to find the optimal ambulance-to-patient-to-hospital routing.
- **Live Tracking Feed**: Family members and operators track ambulance movement on a live Leaflet map in real-time, receiving status updates (`AVAILABLE` → `EN ROUTE` → `ON SCENE` → `TRANSPORTING` → `DELIVERED`).

### 3. Tactical ESP32 Mesh Gateway
An infrastructure-free hardware gateway designed to run in **100% Offline / Airplane Mode** when public cellular networks are unavailable:
- **ESP32-C3 Gateway AP**: Broadcasts a local Access Point (`Pulsegrid-Gateway`) routing static WebSockets.
- **Store-and-Forward (LittleFS Caching)**: If the Node loses connection to the Hub, telemetry packets are cached sequentially on the Node's local LittleFS partition and flushed upon reconnection.
- **Buzzer Downlink**: Active buzzer sounds on the responder's wrist unit when a rescue is assigned on the dashboard.

---

## 📐 System Architecture

```
┌─────────────────────────────────┐      433 MHz RF Link      ┌─────────────────────────────────┐
│     Wearable Sensor Node        │ ────────────────────────→ │       ESP32-C3 Mesh Gateway     │
│ (MAX30102, MPU6050, 3.7V Battery)│ ←──────────────────────── │      (Static IP: 192.168.4.1)   │
└─────────────────────────────────┘     Downlink Buzzer Pulse └─────────────────────────────────┘
                                                                              │
                                                                   Local WebSockets (ws://)
                                                                              │
                                                                              ▼
                                                              ┌─────────────────────────────────┐
                                                              │       Tactical React Console    │
                                                              │       (100% Offline Static UI)  │
                                                              └─────────────────────────────────┘
```

---

## 💻 Technology Stack

- **Frontend Framework**: React 18 + TypeScript + Vite + TailwindCSS
- **Mapping & Routing**: Leaflet.js + OpenStreetMap (No API keys required)
- **Backend API**: Node.js + Express + Socket.io (WebSocket signaling)
- **Database Layer**: SQLite + Prisma ORM
- **State Management**: Zustand
- **AI Triage Layer**: Groq API (symptom triage scoring and clinical decision support)
- **Hardware Integration**: ESP32-C3 Node + Arduino (C++) + LittleFS

---

## 👥 Seeded Local Test Accounts

All seeded accounts share the default password: **`password123`**.

| Dashboard Role | Login Email | Key Features |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@pulsegrid.com` | Global audit logs, hospitals & users manager, system settings. |
| **Hospital Admin** | `hospitaladmin@pulsegrid.com` | AIIMS New Delhi staff management, shift rosters, leave approvals. |
| **Attending Physician** | `doctor@pulsegrid.com` | Attending command center, vitals trends analysis, clinical appointments, prescriptions. |
| **Nurse** | `nurse@pulsegrid.com` | Ward bed grids, vital sign logging, checklist timelines, shift handover compiler. |
| **Pharmacist** | `pharmacist@pulsegrid.com` | Prescription validation, interaction checkers, batch inventory tracker, supplier logs. |
| **Ambulance Driver** | `ambulance@pulsegrid.com` | Live route navigation, one-tap status updates, responder dispatch tracking. |
| **Family Member** | `family@pulsegrid.com` | Linked member feed, care scheduler, emergency tracker. |
| **Patient (Delhi)** | `delhi.patient1@pulsegrid.com` | Patient dashboard, symptom checker, smart health companion. |

---

## 🚀 Installation & Setup

Follow these steps to run the frontend, backend, and database systems locally:

### Prerequisites
- Node.js (v18 or higher)
- npm (installed with Node)

### 1. Set Up and Seed the Database
Navigate to the `server` directory, install packages, and synchronize the SQLite database:
```bash
# Change directory to server
cd server

# Install backend dependencies
npm install

# Push the schema changes to SQLite and compile Prisma Client
npx prisma db push --force-reset

# Run the database seeder to populate all clinical data and test accounts
npx prisma db seed
```

### 2. Start the Backend Server
Run the Express backend with Socket.io signaling:
```bash
# From the 'server' directory
npm run dev
```
The backend server will launch at `http://localhost:4000`.

### 3. Start the Frontend Client
Open a new terminal window, navigate to the project root, install frontend packages, and start the Vite dev server:
```bash
# In the project root directory
npm install

# Launch Vite development server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`. You can log in using `superadmin@pulsegrid.com` or any of the seeded accounts listed above.

---

## ⚖️ Competitive Differentiation & SDG Alignment

### Competitive Matrix

| Platform | What They Do | What's Missing |
| :--- | :--- | :--- |
| **Dial 112 (India)** | Manual operator dispatch | No live grid mapping, no live bed availability, no family tracking |
| **StanPlus** | Private ambulance booking | No operator command grid, no real-time hospital bed routing |
| **Practo Emergency** | SOS button | No ambulance tracking, no active emergency operator fleet management |
| **PulseGrid** | **All-in-one Real-time Ecosystem** | **Fully automated ambulance dispatch, road OSRM routing, live bed grids, and offline hardware fallback in one app.** |

### SDG Alignment
- **SDG 3.d**: Strengthen emergency risk warning and mitigation systems.
- **SDG 9**: Build resilient infrastructure and foster local innovation.
- **SDG 10**: Provide low-cost medical safety tools for rural/underserved clinics.
- **SDG 11.5**: Mitigate the human impact of natural disasters.
- **SDG 16**: Fully audit-logged dispatch chain of custody.
