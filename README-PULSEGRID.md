# Pulsegrid OS — Tactical Emergency Response Grid

> **Infrastructure-Free Disaster Command Network**  
> *10 seconds. Fully automated. Zero external dependencies. Zero CDN calls.*

---

##  Quick Start: Live Demo Blackout Mode

To run the application locally on your laptop in **100% Offline / Airplane Mode** (as required for the live presentation):

### 1. Connect to the Local Gateway
1. Power up the **ESP32-C3 Gateway Node**.
2. On your presentation laptop, disconnect from all public Wi-Fi networks and connect to the ESP32 Access Point:
   - **SSID:** `Pulsegrid-Gateway`
   - **Password:** `pulsegrid123`
3. Verify your laptop has been assigned an IP (the gateway is hardcoded to static IP `192.168.4.1`).

### 2. Launch the Tactical Console
1. Open a terminal in the project root folder.
2. Verify all assets (Tailwind CSS, local fonts, icons) are bundled locally (no internet CDN calls).
3. Start the local server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local port (usually `http://localhost:5173`).
5. Toggle your laptop's Wi-Fi card completely off/on to demonstrate the **Mesh Connection Banner** and **Exponential Backoff Reconnection** logic.

---

##  System Architecture

Pulsegrid OS operates on a three-tier local mesh network designed to bypass damaged cellular towers:

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
                                                              │       Tactical Next.js Console  │
                                                              │       (100% Offline Static UI)  │
                                                              └─────────────────────────────────┘
```

---

##  Critical Technical Implementations

### 1. Thundering Herd Prevention (Exponential Backoff + Jitter)
To prevent the gateway from crashing on startup when multiple client interfaces attempt to connect, the WebSocket initialization incorporates an **Exponential Backoff** retry algorithm capped at 16 seconds, combined with randomized **Jitter** (0–500ms):

$$\text{Delay} = \min(\text{maxDelay}, \text{baseDelay} \times 2) + \text{randomJitter}$$

### 2. Store-and-Forward (LittleFS Caching)
If the Node loses connection to the Hub, raw telemetry packets are cached sequentially on the Node's local **LittleFS partition**. Upon reconnection, the Node appends these packets to the gateway stream, ensuring zero data loss during high-attenuation events.

### 3. Non-Blocking Downlink Execution
All hardware cycles (accel sampling, radio packet listens, buzzer alarms) run on non-blocking timers using Arduino's `millis()` clocks. This prevents the system from locking up during execution and missing incoming packets.

---

##  Round 2 Adaptability Config

In the event of a surprise prompt in the second round (e.g., transitioning from a **Medical Emergency** to **Industrial Gas Leak Monitoring**), the telemetry payload structure is completely generic. 

To repurpose the entire system dashboard in under 30 seconds, edit `src/config/scenario.ts`:

```typescript
export const SCENARIO_CONFIG = {
  // ROUND 1: MEDICAL RESPONSE
  name: 'Medical Emergency Response',
  sensorALabel: 'Impact Force',
  sensorAUnit: 'G',
  sensorBLabel: 'SpO2 Level',
  sensorBUnit: '%',
  sensorCLabel: 'Heart Rate',
  sensorCUnit: 'bpm',
  criticalStatusLabel: 'FALL DETECTED',
  nodeLabel: 'Responder Node',

  // UNCOMMENT FOR ROUND 2 (e.g., Gas Leak Prompt)
  /*
  name: 'Industrial Gas Leak Response',
  sensorALabel: 'Methane (CH4)',
  sensorAUnit: 'ppm',
  sensorBLabel: 'Air Temperature',
  sensorBUnit: '°C',
  sensorCLabel: 'Carbon Monoxide',
  sensorCUnit: 'ppm',
  criticalStatusLabel: 'LEAK DETECTED',
  nodeLabel: 'Hazmat Sensor',
  */
};
```

---

##  The 3-Minute Rehearsal Script

| Timestamp | Presenter Action | System Feedback / Verification |
|:---|:---|:---|
| **0:00 - 0:20** | **The Hook:** Turn off laptop Wi-Fi and put phone on Airplane Mode. | Show the red **Mesh Link Banner** transition to amber on the screen. |
| **0:20 - 0:50** | **The Setup:** Explain the infrastructure-less mesh concept using the hardware prototype. | Point out the Manhattan copper ground plane layout designed for RF isolation. |
| **0:50 - 1:20** | **The Trigger:** Simulating a responder fall (drop/strike the wearable node). | The Tactical Grid immediately pulses red. Vitals charts update in real-time. |
| **1:20 - 1:50** | **The Downlink:** Click **"Assign Rescue"** on the dashboard. | Within <2 seconds, the physical active buzzer sounds on the responder's wrist. |
| **1:50 - 2:30** | **The Core Metric:** Highlight the 10-second automation loop. | Show the logged response metrics (distance, estimated arrival, route). |
| **2:30 - 3:00** | **The Closing:** Map Pulsegrid to UN SDGs (SDG 3, 9, 10, 11). | Conclude with: *"Pulsegrid OS. Emergency response when the grid goes dark."* |

---

##  SDG Alignment

- **SDG 3.d:** Strengthen emergency risk warning systems.
- **SDG 9:** Build resilient infrastructure and foster local innovation.
- **SDG 10:** Provide low-cost medical safety tools for rural/underserved clinics.
- **SDG 11.5:** Mitigate the human impact of natural disasters.
- **SDG 16:** Fully audit-logged dispatch chain of custody.
