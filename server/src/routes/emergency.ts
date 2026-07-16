import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /api/emergency/ambulances - Fetch available ambulance drivers
router.get('/ambulances', authenticate, async (req: Request, res: Response) => {
  try {
    const ambulances = await prisma.user.findMany({
      where: {
        roleId: 'ambulanceDriver',
        status: 'APPROVED'
      },
      include: {
        ambulanceDriverProfile: true
      }
    });
    return res.json(ambulances);
  } catch (error) {
    console.error('Error fetching ambulances:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/emergency/trigger - Trigger a new SOS alert
router.post('/trigger', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { latitude, longitude, description } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required emergency data' });
    }

    const emergency = await prisma.emergencyRequest.create({
      data: {
        patientId: userId,
        latitude,
        longitude,
        description,
        status: 'PENDING',
        priority: 'CRITICAL'
      },
      include: {
        patient: {
          include: { patientProfile: true }
        }
      }
    });

    // Emit real-time socket event if io is attached to Express app
    const io = req.app.get('io');
    if (io) {
      io.emit('new-emergency', emergency);
    }

    return res.status(201).json(emergency);
  } catch (error) {
    console.error('Error triggering SOS:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/emergency/active - Get all active emergencies (for operators)
router.get('/active', authenticate, async (req: Request, res: Response) => {
  try {
    const emergencies = await prisma.emergencyRequest.findMany({
      where: {
        status: { in: ['PENDING', 'DISPATCHED'] }
      },
      include: {
        patient: {
          include: { patientProfile: true }
        },
        operator: { include: { emergencyOperatorProfile: true } },
        ambulance: { include: { ambulanceDriverProfile: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(emergencies);
  } catch (error) {
    console.error('Error fetching active emergencies:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/emergency/:id/status - Update emergency status & priority (Dispatch, Resolve, Triage Override)
router.put('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, operatorId, ambulanceId, priority } = req.body;

    const updated = await prisma.emergencyRequest.update({
      where: { id: id as string },
      data: {
        status: status || undefined,
        operatorId: operatorId || undefined,
        ambulanceId: ambulanceId || undefined,
        priority: priority || undefined
      },
      include: {
        patient: {
          include: { patientProfile: true }
        },
        operator: { include: { emergencyOperatorProfile: true } },
        ambulance: { include: { ambulanceDriverProfile: true } }
      }
    });

    // Emit real-time update socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-updated', updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error updating emergency status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/emergency/ai-chat - Chat with PulseGrid AI using Groq
router.post('/ai-chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.GROQ_API_KEY || '';

    // If no key is provided, return a mocked response so it still runs without failing completely
    if (!apiKey) {
      console.warn('Warning: GROQ_API_KEY is not defined in the server environment. Returning mocked response.');
      const lastMsg = messages[messages.length - 1]?.content || '';
      
      if (req.body.type === 'analytics') {
        if (lastMsg.includes('utilization') || lastMsg.includes('department')) {
          return res.json({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: `###  **Department Utilization & Bottleneck Diagnosis Report**

* ** Critical Alert: Emergency & Trauma Care (94% Utilization)**: High clinical load predicted to exceed capacity margins during weekend intervals. Recommendation: establish a 15% step-down buffer immediately.
* ** Stable Buffer: General Medicine (82% Utilization)**: Healthy patient flow with minor bed clearing required by post-op step-down.
* ** Resource Balancing Recommendation**: Shift 2 standby emergency beds from Pediatrics (45% occupancy) to Emergency Care to mitigate trauma surges without additional infrastructure cost.
* ** Operational Directives**:
  * [ ] Mobilize Surgical Recovery bed buffers for peak Sunday hours.
  * [ ] Set general ward clearance schedules to 09:00 AM daily to maximize clinical throughput.`
                }
              }
            ]
          });
        }

        if (lastMsg.includes('staff') || lastMsg.includes('roster') || lastMsg.includes('activity')) {
          return res.json({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: `###  **Groq AI Clinical Staffing & Burnout Audit**

* ** Shift Fatigue Risk**: Night shift staff roster allocations in **Trauma Care** show continuous back-to-back operational periods. Burnout index: **High (84%)**.
* ** Roster Optimization Directive**: Reallocate 2 nurses from Pediatrics (currently under-utilized) to support the critical trauma midnight shifts.
* ** Action Plan**:
  * [ ] Pre-approve leave request backlog for high-fatigue general ward nurses.
  * [ ] Adjust trauma nurse shift schedules from 12-hour slots to 8-hour overlapping buffers.`
                }
              }
            ]
          });
        }

        const isMonth = lastMsg.includes('month') || lastMsg.includes('30 days');
        const timeframe = isMonth ? '1-Month' : '7-Day';
        
        return res.json({
          choices: [
            {
              message: {
                role: 'assistant',
                content: `###  **PulseGrid Predictive Analytics Engine — ${timeframe} Forecast**

#### **1.  Expected SOS Emergency Surges**
* **Projected Total SOS Admissions**: ${isMonth ? '184 Emergency Incidents (Forecasted)' : '42 Emergency Incidents (Forecasted)'}
* **Peak Threat Windows**: 
  * **Fridays & Saturdays (19:00 - 02:00)**: Historically associated with higher vehicular traumas and weekend critical incidents.
  * **Mornings (07:00 - 09:00)**: Micro-spikes in cardiovascular admissions during cold fronts.
* **Primary Surge Drivers**: Regional temperature drop (+4°C average reduction) triggering +18% respiratory distress rates, alongside increased weekend highway traffic congestion.

#### **2.  Predictive Bed Occupancy & Capacity Forecast**
* **ICU Beds (Critical Care)**: 
  * **Current Capacity**: 4/12 Available.
  * **Forecasted Bottleneck**: Day ${isMonth ? '8 to 14' : '3 to 5'}. The surge model predicts ICU occupancy will peak at **96.8%**, resulting in a critical shortfall of **2 to 3 ICU beds**.
* **General Wards**:
  * **Current Capacity**: 18/60 Available.
  * **Forecasted Bottleneck**: Expected peak occupancy of **88%** on Day ${isMonth ? '18' : '6'}. Capacity remains stable but margins will shrink.
* **Pediatrics & Recovery**: No shortfalls predicted. Margins remain healthy (>25% buffer).

#### **3.  Pre-Combat Logistics & Readiness Checklist**
* [ ] **Roster Adjustments**: Reallocate 2 trauma-surgeons and 3 critical-care nurses to Friday night shifts.
* [ ] **ICU Clearing Protocols**: Pre-discharge stable post-op recovery patients to step-down wards by Day ${isMonth ? '5' : '2'} to establish a **25% ICU bed reserve**.
* [ ] **Oxygen & Ventilator Reserves**: Verify pressure levels on all 8 standby ventilators and increase liquid oxygen supply line volume by **+15%**.
* [ ] **Ambulance Coordination**: Pre-position Ambulance Unit 3 at Sector 4 Junction during peak Saturday traffic hours to slash rescue ETAs by **4.5 minutes**.`
              }
            }
          ]
        });
      }

      if (req.body.type === 'clinical') {
        const lastMsgLower = lastMsg.toLowerCase();
        
        // Mock pharmacy dispatch detection
        if (lastMsgLower.includes('pharmacy') || lastMsgLower.includes('dispatch') || lastMsgLower.includes('send') || lastMsgLower.includes('prescribe')) {
          let patientName = "John Doe";
          let patientId = "PT-01";
          let medication = "Amoxicillin 500mg";
          let dosage = "1 Capsule Thrice Daily";
          
          if (lastMsgLower.includes('sarah') || lastMsgLower.includes('jane')) {
            patientName = "Sarah Jenkins";
            patientId = "PT-02";
          } else if (lastMsgLower.includes('michael') || lastMsgLower.includes('mike')) {
            patientName = "Michael Chang";
            patientId = "PT-03";
          }
          
          if (lastMsgLower.includes('metformin')) {
            medication = "Metformin 850mg";
            dosage = "1 Tablet Twice Daily with meals";
          } else if (lastMsgLower.includes('lisinopril')) {
            medication = "Lisinopril 10mg";
            dosage = "1 Tablet Daily in morning";
          } else if (lastMsgLower.includes('ibuprofen')) {
            medication = "Ibuprofen 400mg";
            dosage = "1 Tablet every 8 hours as needed";
          }

          return res.json({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: `###  **PulseGrid Clinical Agent AI — Pharmacy Dispatch Request**
                  
I have structured the pharmacy dispatch request for **${patientName}** and prepared the Rx details for the pharmacist:
* **Patient**: ${patientName} (ID: ${patientId})
* **Medication**: ${medication}
* **Dosage**: ${dosage}
* **Guidelines**: Dispense immediately and notify the patient via PulseGrid Portal.

Please verify the clinical prescription action block below to authorize the direct dispatch to Pharmacy.

\`\`\`json
{
  "action": "pharmacy_dispatch",
  "patientId": "${patientId}",
  "patientName": "${patientName}",
  "medication": "${medication}",
  "dosage": "${dosage}",
  "frequency": "1-0-1",
  "duration": "7 Days",
  "instructions": "Take as directed by doctor"
}
\`\`\``
                }
              }
            ]
          });
        }
        
        // Mock clinical note detection
        if (lastMsgLower.includes('note') || lastMsgLower.includes('record') || lastMsgLower.includes('clinical')) {
          let patientName = "John Doe";
          let patientId = "PT-01";
          if (lastMsgLower.includes('sarah') || lastMsgLower.includes('jane')) {
            patientName = "Sarah Jenkins";
            patientId = "PT-02";
          } else if (lastMsgLower.includes('michael') || lastMsgLower.includes('mike')) {
            patientName = "Michael Chang";
            patientId = "PT-03";
          }

          return res.json({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: `###  **PulseGrid Clinical Agent AI — Add Clinical Note**
                  
I have drafted a new clinical note entry for **${patientName}** based on our diagnostic discussion:
* **Patient**: ${patientName} (ID: ${patientId})
* **Note Category**: Clinical Evaluation Summary
* **Content Details**: "Patient reports positive progression. Stable vitals recorded. Recommended routine follow-up in 14 days."

You can instantly append this note to the patient's PulseGrid electronic medical record using the button below.

\`\`\`json
{
  "action": "add_note",
  "patientId": "${patientId}",
  "patientName": "${patientName}",
  "note": "Patient reports positive progression. Stable vitals recorded. Recommended routine follow-up in 14 days."
}
\`\`\``
                }
              }
            ]
          });
        }

        // Generic clinical chat
        return res.json({
          choices: [
            {
              message: {
                role: 'assistant',
                content: `###  **PulseGrid Groq AI — Clinical Decision Support**
                
Welcome, Doctor! I am your real-time medical copilot. How can I assist your clinical workflow today?
* ** Direct Pharmacy Dispatch**: Say *"Send Amoxicillin to pharmacy for John Doe"*
* ** Add Patient Notes**: Say *"Add a clinical note for Sarah Jenkins"*
* ** Treatment Research**: Ask about clinical dosage protocols, contraindications, or allergy checks.`
              }
            }
          ]
        });
      }

      const lastMsgText = messages[messages.length - 1]?.content || 'emergency help';
      return res.json({
        choices: [
          {
            message: {
              role: 'assistant',
              content: ` **[PulseGrid AI - Offline Mode]**\n\nYour emergency trigger has been processed. No local ambulances are currently active in your sector. \n\n**Immediate Actions to Take for "${lastMsgText}":**\n* **Stay Calm & Direct**: Sit or lie down in a safe, well-ventilated space.\n* **Call 112**: Click the emergency call button immediately if you haven't already.\n* **Secure Your Space**: Keep doors unlocked so responders can enter easily.\n\n*Note: Please configure a valid GROQ_API_KEY in your .env to enable active medical triaging chat.*`
            }
          }
        ]
      });
    }

    // Call Groq API via fetch
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: req.body.type === 'nutrition'
              ? 'You are PulseGrid Nutrition AI, a certified clinical nutritionist and diet planner. A patient is seeking advice on diet plans, meal recipes, nutritional tracking, or weight goals. Provide supportive, expert, and structured dietary advice in clean markdown bullet points.'
              : req.body.type === 'analytics'
              ? 'You are PulseGrid Hospital Analytics & Operational Auditing AI, an advanced clinical resource forecaster. You analyze hospital bed occupancy, department utilization rates, and staff activities/schedules. Generate a comprehensive analysis based on the user request. Output detailed diagnostics in clean, structured markdown bullet points containing actionable insights and combat-readiness operational recommendations.'
              : req.body.type === 'clinical'
              ? 'You are PulseGrid Clinical Agent AI, a premium clinical decision support assistant for medical practitioners. You assist doctors with drug recommendations, medical research, patient inquiries, and pharmacy dispatches. IMPORTANT: If the doctor asks to dispatch/send a medication or request to the pharmacy, or write a clinical note, format your response to include a special JSON action block at the very end of your response, strictly using this format:\n\n```json\n{\n  "action": "pharmacy_dispatch" | "add_note",\n  "patientId": "PT-01" | "PT-02" | "PT-03",\n  "patientName": "John Doe",\n  "medication": "Amoxicillin 500mg",\n  "dosage": "1 Capsule",\n  "frequency": "1-1-1",\n  "duration": "7 Days",\n  "instructions": "Take after meals",\n  "note": "Note details"\n}\n```\nKeep your general explanations professional, concise, and structured in medical bullet points.'
              : 'You are PulseGrid AI, an empathetic, hyper-competent emergency medical assistant. A patient has triggered an SOS emergency, but no ambulances are currently available. Triage their symptoms, guide them with immediate, clear first-aid instructions, keep them calm, and assist them while emergency services (112) are being contacted. Keep responses concise, supportive, and formatted in clean markdown bullet points.'
          },
          ...messages
        ]
      })
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('Groq API Error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'Error communicating with Groq AI' 
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
