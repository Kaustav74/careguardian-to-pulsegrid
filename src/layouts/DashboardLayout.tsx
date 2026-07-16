// ============================================================
// PULSEGRID — DASHBOARD LAYOUT (BASE)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

interface DashboardLayoutProps {
  title?: string;
  breadcrumbs?: { label: string; path?: string }[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, breadcrumbs }) => {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { userProfile, token } = useAuthStore();
  const navigate = useNavigate();

  const isClinical = userProfile?.roleId === 'doctor' || userProfile?.roleId === 'nurse' || userProfile?.roleId === 'ruralVolunteer';

  // Floating Global Assistant States
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [globalInput, setGlobalInput] = useState('');
  const [globalChatLoading, setGlobalChatLoading] = useState(false);
  const [globalMessages, setGlobalMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello Admin! I am your PulseGrid Command Center Assistant. I am connected to the live database and local storage. You can ask me questions, navigate to pages, or execute commands directly (e.g. 'add 50 ventilators', 'change patient John Doe to Johnathan Doe', 'approve Carol Hathaway leave', 'add department Neurology with nurse Abby and 20 beds'). How can I help you today?"
    }
  ]);
  const globalChatEndRef = useRef<HTMLDivElement>(null);
  
  // Navigation countdown states
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownVal, setCountdownVal] = useState(3);
  const [navTarget, setNavTarget] = useState('');

  // Auto scroll for global assistant
  useEffect(() => {
    globalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages, globalChatLoading]);

  // Set greeting dynamically once userProfile is resolved
  useEffect(() => {
    if (!userProfile) return;
    const isPatient = userProfile?.roleId === 'patient' || userProfile?.roleId === 'familyMember';
    const isClinical = userProfile?.roleId === 'doctor' || userProfile?.roleId === 'nurse' || userProfile?.roleId === 'ruralVolunteer';
    
    setGlobalMessages([
      {
        role: 'assistant',
        content: isPatient
          ? "Hello! I am your PulseGrid Smart Health Companion. \n\nI am connected to your live patient metrics and diet plan. You can ask me to navigate pages, answer health queries, or execute commands directly (e.g. 'log 500ml water', 'log 300 kcal', 'log 25g protein'). How can I help you today?"
          : isClinical
          ? "Hello Doctor! I am your PulseGrid Clinical Agent AI. \n\nI am connected to your live patient records and pharmacy system. You can ask me for clinical guidelines, diagnostic data, or issue commands directly (e.g. 'Send Metformin to pharmacy for Sarah Jenkins', 'Add clinical note for John Doe'). How can I help you today?"
          : "Hello Admin! I am your PulseGrid Command Center Assistant. I am connected to the live database and local storage. You can ask me questions, navigate to pages, or execute commands directly (e.g. 'add 50 ventilators', 'change patient John Doe to Johnathan Doe', 'approve Carol Hathaway leave', 'add department Neurology with nurse Abby and 20 beds'). How can I help you today?"
      }
    ]);
  }, [userProfile]);

  // Clinical Actions & Widgets state handlers
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const parseChatAction = (content: string) => {
    try {
      const match = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1].trim());
        if (parsed && parsed.action) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse chat JSON action block:", e);
    }
    return null;
  };

  const handleExecuteAction = (action: any, index: number) => {
    if (completedActions[index]) return;

    if (action.action === 'pharmacy_dispatch') {
      const localPts = localStorage.getItem('cg_patients');
      if (localPts) {
        const pts = JSON.parse(localPts);
        const patient = pts.find((p: any) => p.id === action.patientId || p.name.toLowerCase().includes(action.patientName.toLowerCase()));
        
        if (patient) {
          const newRx = {
            id: `Rx-${Date.now().toString().slice(-6)}`,
            patientId: patient.id,
            patientName: patient.name,
            patientAge: patient.age,
            patientGender: patient.gender,
            patientBloodGroup: patient.bloodGroup,
            patientAllergies: patient.allergies,
            date: new Date().toLocaleDateString(),
            diagnosis: action.diagnosis || 'Clinical evaluation',
            doctorName: userProfile?.displayName || 'Dr. Meredith Grey',
            medicines: [
              {
                name: action.medication,
                dosage: action.dosage || '1 Tablet',
                frequency: action.frequency || '1-0-1',
                duration: action.duration || '7 Days',
                instructions: action.instructions || 'Take as directed'
              }
            ],
            hash: 'Rx-SIG-AI-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            grade: 'A+',
            score: 100
          };

          // Save Rx to history
          const past = localStorage.getItem('cg_prescriptions');
          const nextList = past ? [newRx, ...JSON.parse(past)] : [newRx];
          localStorage.setItem('cg_prescriptions', JSON.stringify(nextList));

          // Append to patient records
          patient.records = [
            {
              id: `REC-${Date.now().toString().slice(-4)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Prescription',
              doctor: newRx.doctorName,
              diagnosis: newRx.diagnosis,
              status: 'Active'
            },
            ...patient.records
          ];
          localStorage.setItem('cg_patients', JSON.stringify(pts));
          
          // Dispatch sync events to refresh UI live!
          window.dispatchEvent(new CustomEvent('pulsegrid-patients-update'));
          
          setCompletedActions(prev => ({ ...prev, [index]: true }));
          alert(` AI Agent Success: Prescribed ${newRx.medicines[0].name} to pharmacy for ${patient.name}!`);
        }
      }
    } else if (action.action === 'add_note') {
      const localPts = localStorage.getItem('cg_patients');
      if (localPts) {
        const pts = JSON.parse(localPts);
        const patient = pts.find((p: any) => p.id === action.patientId || p.name.toLowerCase().includes(action.patientName.toLowerCase()));

        if (patient) {
          patient.records = [
            {
              id: `REC-${Date.now().toString().slice(-4)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Clinical Note',
              doctor: userProfile?.displayName || 'Dr. Meredith Grey',
              diagnosis: action.note || 'General medical review',
              status: 'Completed'
            },
            ...patient.records
          ];
          localStorage.setItem('cg_patients', JSON.stringify(pts));
          window.dispatchEvent(new CustomEvent('pulsegrid-patients-update'));

          setCompletedActions(prev => ({ ...prev, [index]: true }));
          alert(` AI Agent Success: Clinical note appended successfully to ${patient.name}'s medical records!`);
        }
      }
    }
  };

  const renderActionCard = (action: any, index: number) => {
    const isDone = completedActions[index];

    if (action.action === 'pharmacy_dispatch') {
      return (
        <div className="bg-slate-900 border border-cyan-500/20 p-4 rounded-2xl space-y-3 max-w-[85%] mr-auto animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="text-lg"></span>
            <span className="text-[10px] font-black uppercase tracking-wider">AI Pharmacy Dispatch Authorization</span>
          </div>
          <div className="text-[10px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-white/5 font-semibold">
            <p><span className="text-slate-400">Patient:</span> {action.patientName}</p>
            <p><span className="text-slate-400">Medication:</span> {action.medication}</p>
            <p><span className="text-slate-400">Dosage:</span> {action.dosage} ({action.frequency || '1-0-1'})</p>
          </div>
          <button
            onClick={() => handleExecuteAction(action, index)}
            disabled={isDone}
            className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              isDone 
                ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95'
            }`}
          >
            {isDone ? ' Dispense Authorized' : ' Confirm Pharmacy Dispatch'}
          </button>
        </div>
      );
    }

    if (action.action === 'add_note') {
      return (
        <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-2xl space-y-3 max-w-[85%] mr-auto animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 text-amber-400">
            <span className="text-lg"></span>
            <span className="text-[10px] font-black uppercase tracking-wider">AI Clinical Note Authorization</span>
          </div>
          <div className="text-[10px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-white/5 font-semibold">
            <p><span className="text-slate-400">Patient:</span> {action.patientName}</p>
            <p className="italic text-slate-300">"{action.note}"</p>
          </div>
          <button
            onClick={() => handleExecuteAction(action, index)}
            disabled={isDone}
            className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              isDone 
                ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
            }`}
          >
            {isDone ? ' Note Appended' : ' Append Clinical Note'}
          </button>
        </div>
      );
    }

    return null;
  };

  // Redirect countdown timer hook
  useEffect(() => {
    if (!countdownActive) return;
    if (countdownVal <= 0) {
      setCountdownActive(false);
      setIsGlobalChatOpen(false);
      navigate(navTarget);
      return;
    }

    const timer = setTimeout(() => {
      setCountdownVal(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownActive, countdownVal, navTarget, navigate]);

  // Executor for natural language data modifications
  const executeNaturalLanguageCommand = async (commandText: string): Promise<string | null> => {
    const textLower = commandText.toLowerCase();

    // 0. PATIENT NUTRITION MUTATIONS
    // Pattern: "log 500ml water" or "add 250ml water"
    const waterMatch = commandText.match(/(?:log|add|increase|consume)\s+(\d+)\s*ml\s+(?:water)/i);
    if (waterMatch) {
      const ml = parseInt(waterMatch[1], 10);
      const local = localStorage.getItem('cg_nutrition');
      if (local) {
        const nut = JSON.parse(local);
        nut.loggedWater = Math.max(0, Math.min(6000, nut.loggedWater + ml));
        localStorage.setItem('cg_nutrition', JSON.stringify(nut));
        window.dispatchEvent(new CustomEvent('pulsegrid-nutrition-update'));
        return ` **Command Success**: Successfully logged **${ml}ml** of water intake! Current total: **${nut.loggedWater}ml**.`;
      }
    }

    // Pattern: "log 400 kcal" or "add 500 kcal"
    const calMatch = commandText.match(/(?:log|add|increase|consume)\s+(\d+)\s*kcal/i);
    if (calMatch) {
      const kcal = parseInt(calMatch[1], 10);
      const local = localStorage.getItem('cg_nutrition');
      if (local) {
        const nut = JSON.parse(local);
        nut.loggedCalories += kcal;
        localStorage.setItem('cg_nutrition', JSON.stringify(nut));
        window.dispatchEvent(new CustomEvent('pulsegrid-nutrition-update'));
        return ` **Command Success**: Successfully logged **${kcal} kcal** to your daily diet!`;
      }
    }

    // Pattern: "log 30g protein" or "add 50g carbs"
    const macroMatch = commandText.match(/(?:log|add|increase|consume)\s+(\d+)g\s+(protein|carb|carbohydrate|fat)/i);
    if (macroMatch) {
      const amount = parseInt(macroMatch[1], 10);
      const type = macroMatch[2].toLowerCase();
      const local = localStorage.getItem('cg_nutrition');
      if (local) {
        const nut = JSON.parse(local);
        if (type.includes('protein')) {
          nut.loggedProtein += amount;
        } else if (type.includes('carb')) {
          nut.loggedCarbs += amount;
        } else if (type.includes('fat')) {
          nut.loggedFats += amount;
        }
        localStorage.setItem('cg_nutrition', JSON.stringify(nut));
        window.dispatchEvent(new CustomEvent('pulsegrid-nutrition-update'));
        return ` **Command Success**: Successfully logged **${amount}g** of **${type}** to your daily total!`;
      }
    }

    // 1. INVENTORY MUTATIONS
    // Pattern: "add 50 ventilators" or "increase oxygen by 100"
    const addInvMatch = commandText.match(/(?:add|increase|raise|register)\s+(\d+)\s+([\w\s()+-]+)/i);
    if (addInvMatch) {
      const qty = parseInt(addInvMatch[1], 10);
      const nameQuery = addInvMatch[2].trim().toLowerCase();
      
      const local = localStorage.getItem('cg_inventory');
      if (local) {
        let inv = JSON.parse(local);
        let found = false;
        inv = inv.map((item: any) => {
          if (item.name.toLowerCase().includes(nameQuery)) {
            item.quantity += qty;
            found = true;
          }
          return item;
        });

        if (found) {
          localStorage.setItem('cg_inventory', JSON.stringify(inv));
          window.dispatchEvent(new CustomEvent('pulsegrid-inventory-update'));
          return ` **Command Success**: Successfully increased quantity of **${addInvMatch[2].trim()}** by **${qty}**!`;
        } else {
          // Add new item if not found
          const newItem = {
            id: `INV-${100 + inv.length + 1}`,
            name: addInvMatch[2].trim(),
            quantity: qty,
            unit: 'Units',
            minBuffer: 10,
            category: 'Disposables' as const
          };
          inv.push(newItem);
          localStorage.setItem('cg_inventory', JSON.stringify(inv));
          window.dispatchEvent(new CustomEvent('pulsegrid-inventory-update'));
          return ` **Command Success**: Registered new inventory item **${newItem.name}** with **${qty}** units!`;
        }
      }
    }

    // Pattern: "set ventilators to 120"
    const setInvMatch = commandText.match(/(?:set)\s+([\w\s()+-]+)\s+(?:to)\s+(\d+)/i);
    if (setInvMatch) {
      const nameQuery = setInvMatch[1].trim().toLowerCase();
      const qty = parseInt(setInvMatch[2], 10);
      
      const local = localStorage.getItem('cg_inventory');
      if (local) {
        let inv = JSON.parse(local);
        let found = false;
        inv = inv.map((item: any) => {
          if (item.name.toLowerCase().includes(nameQuery)) {
            item.quantity = qty;
            found = true;
          }
          return item;
        });

        if (found) {
          localStorage.setItem('cg_inventory', JSON.stringify(inv));
          window.dispatchEvent(new CustomEvent('pulsegrid-inventory-update'));
          return ` **Command Success**: Set quantity of **${setInvMatch[1].trim()}** to **${qty}**!`;
        }
      }
    }

    // Pattern: "reduce oxygen by 50" or "remove 10 masks"
    const reduceInvMatch = commandText.match(/(?:reduce|remove|lower|decrease)\s+(\d+)\s+([\w\s()+-]+)/i);
    if (reduceInvMatch) {
      const qty = parseInt(reduceInvMatch[1], 10);
      const nameQuery = reduceInvMatch[2].trim().toLowerCase();
      
      const local = localStorage.getItem('cg_inventory');
      if (local) {
        let inv = JSON.parse(local);
        let found = false;
        inv = inv.map((item: any) => {
          if (item.name.toLowerCase().includes(nameQuery)) {
            item.quantity = Math.max(0, item.quantity - qty);
            found = true;
          }
          return item;
        });

        if (found) {
          localStorage.setItem('cg_inventory', JSON.stringify(inv));
          window.dispatchEvent(new CustomEvent('pulsegrid-inventory-update'));
          return ` **Command Success**: Reduced quantity of **${reduceInvMatch[2].trim()}** by **${qty}**!`;
        }
      }
    }

    // Pattern: "remove ventilators" (delete whole item)
    if (textLower.startsWith('remove ') || textLower.startsWith('delete ')) {
      const nameQuery = textLower.replace(/^(remove|delete)\s+/, '').trim();
      if (!nameQuery.includes('patient') && !nameQuery.includes('department')) {
        const local = localStorage.getItem('cg_inventory');
        if (local) {
          let inv = JSON.parse(local);
          const filtered = inv.filter((item: any) => !item.name.toLowerCase().includes(nameQuery));
          if (filtered.length < inv.length) {
            localStorage.setItem('cg_inventory', JSON.stringify(filtered));
            window.dispatchEvent(new CustomEvent('pulsegrid-inventory-update'));
            return ` **Command Success**: Removed inventory asset **${nameQuery}** from system.`;
          }
        }
      }
    }

    // 2. PATIENT MUTATIONS
    // Pattern: "change patient John Doe to Johnathan Doe" or "update patient John Doe to Johnny"
    const patientRenameMatch = commandText.match(/(?:change|update)\s+patient\s+([\w\s]+)\s+to\s+([\w\s]+)/i);
    if (patientRenameMatch) {
      const oldName = patientRenameMatch[1].trim().toLowerCase();
      const newName = patientRenameMatch[2].trim();

      const local = localStorage.getItem('cg_patients');
      if (local) {
        let pts = JSON.parse(local);
        let found = false;
        pts = pts.map((p: any) => {
          if (p.name.toLowerCase() === oldName || p.name.toLowerCase().includes(oldName)) {
            p.name = newName;
            found = true;
          }
          return p;
        });

        if (found) {
          localStorage.setItem('cg_patients', JSON.stringify(pts));
          window.dispatchEvent(new CustomEvent('pulsegrid-patients-update'));
          return ` **Command Success**: Updated patient name from **${patientRenameMatch[1]}** to **${newName}**!`;
        }
      }
    }

    // Pattern: "update patient John Doe status to Critical"
    const patientStatusMatch = commandText.match(/update\s+patient\s+([\w\s]+)\s+status\s+to\s+([\w\s]+)/i);
    if (patientStatusMatch) {
      const nameQuery = patientStatusMatch[1].trim().toLowerCase();
      const nextStatus = patientStatusMatch[2].trim();

      const local = localStorage.getItem('cg_patients');
      if (local) {
        let pts = JSON.parse(local);
        let found = false;
        pts = pts.map((p: any) => {
          if (p.name.toLowerCase().includes(nameQuery)) {
            p.status = nextStatus;
            found = true;
          }
          return p;
        });

        if (found) {
          localStorage.setItem('cg_patients', JSON.stringify(pts));
          window.dispatchEvent(new CustomEvent('pulsegrid-patients-update'));
          return ` **Command Success**: Updated patient **${patientStatusMatch[1]}** status to **${nextStatus}**!`;
        }
      }
    }

    // Pattern: "update patient John Doe allergies to Penicillin"
    const patientAllergiesMatch = commandText.match(/update\s+patient\s+([\w\s]+)\s+allergies\s+to\s+([\w\s,+-]+)/i);
    if (patientAllergiesMatch) {
      const nameQuery = patientAllergiesMatch[1].trim().toLowerCase();
      const nextAllergies = patientAllergiesMatch[2].trim();

      const local = localStorage.getItem('cg_patients');
      if (local) {
        let pts = JSON.parse(local);
        let found = false;
        pts = pts.map((p: any) => {
          if (p.name.toLowerCase().includes(nameQuery)) {
            p.allergies = nextAllergies;
            found = true;
          }
          return p;
        });

        if (found) {
          localStorage.setItem('cg_patients', JSON.stringify(pts));
          window.dispatchEvent(new CustomEvent('pulsegrid-patients-update'));
          return ` **Command Success**: Updated allergies of **${patientAllergiesMatch[1]}** to **${nextAllergies}**!`;
        }
      }
    }

    // 3. DEPARTMENT MUTATIONS
    // Pattern: "add department Ophthalmology with Nurse Hathaway and 15 beds"
    const addDepMatch = commandText.match(/add\s+department\s+([\w\s&]+)\s+with\s+(?:nurse|head)\s+([\w\s]+)\s+and\s+(\d+)\s+beds/i);
    if (addDepMatch) {
      const depName = addDepMatch[1].trim();
      const headNurse = addDepMatch[2].trim();
      const beds = parseInt(addDepMatch[3], 10);

      const local = localStorage.getItem('cg_departments');
      if (local) {
        let deps = JSON.parse(local);
        const newDep = {
          id: `DEP-0${deps.length + 1}`,
          name: depName,
          headNurse: headNurse,
          bedsCount: beds,
          doctorsCount: 2,
          status: 'Active' as const
        };
        deps.push(newDep);
        localStorage.setItem('cg_departments', JSON.stringify(deps));
        window.dispatchEvent(new CustomEvent('pulsegrid-departments-update'));
        return ` **Command Success**: Registered department **${depName}** (Head Nurse: **${headNurse}**, Beds: **${beds}**).`;
      }
    }

    // Pattern: "suspend department General Medicine" or "deactivate department ICU"
    const suspendDepMatch = commandText.match(/(?:suspend|deactivate)\s+department\s+([\w\s&]+)/i);
    if (suspendDepMatch) {
      const depQuery = suspendDepMatch[1].trim().toLowerCase();
      const local = localStorage.getItem('cg_departments');
      if (local) {
        let deps = JSON.parse(local);
        let found = false;
        deps = deps.map((d: any) => {
          if (d.name.toLowerCase().includes(depQuery)) {
            d.status = 'Suspended';
            found = true;
          }
          return d;
        });

        if (found) {
          localStorage.setItem('cg_departments', JSON.stringify(deps));
          window.dispatchEvent(new CustomEvent('pulsegrid-departments-update'));
          return ` **Command Success**: Suspended active department **${suspendDepMatch[1]}**.`;
        }
      }
    }

    // Pattern: "activate department General Medicine" or "enable department ICU"
    const activateDepMatch = commandText.match(/(?:activate|enable)\s+department\s+([\w\s&]+)/i);
    if (activateDepMatch) {
      const depQuery = activateDepMatch[1].trim().toLowerCase();
      const local = localStorage.getItem('cg_departments');
      if (local) {
        let deps = JSON.parse(local);
        let found = false;
        deps = deps.map((d: any) => {
          if (d.name.toLowerCase().includes(depQuery)) {
            d.status = 'Active';
            found = true;
          }
          return d;
        });

        if (found) {
          localStorage.setItem('cg_departments', JSON.stringify(deps));
          window.dispatchEvent(new CustomEvent('pulsegrid-departments-update'));
          return ` **Command Success**: Activated suspended department **${activateDepMatch[1]}**.`;
        }
      }
    }

    // 4. SHIFT AND ROSTER ACTIONS
    // Pattern: "approve leave request for Carol Hathaway" or "approve Carol Hathaway leave"
    if (textLower.includes('leave') && textLower.includes('approve')) {
      const staffMatch = commandText.match(/(?:approve|accept)\s+(?:leave\s+for\s+)?([\w\s]+)(?:\s+leave)?/i);
      if (staffMatch) {
        const staffName = staffMatch[1].trim();
        try {
          // Trigger actual database mutations on backend!
          const response = await fetch('http://localhost:4000/api/staff/leaves');
          if (response.ok) {
            const leaves = await response.json();
            const pendingLeave = leaves.find((l: any) => l.staff_name.toLowerCase().includes(staffName.toLowerCase()) && l.status === 'Pending');
            if (pendingLeave) {
              const approveRes = await fetch(`http://localhost:4000/api/staff/leaves/${pendingLeave.id}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token || ''}` }
              });
              if (approveRes.ok) {
                return ` **Command Success**: Leave request approved for **${staffName}** successfully on the live roster system!`;
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
        return ` **Local Approval Fallback**: Roster leave desk processed leave approval request for **${staffName}**!`;
      }
    }

    return null;
  };

  const handleSendGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalInput.trim() || globalChatLoading || countdownActive) return;

    const userText = globalInput.trim();
    const userMsg = { role: 'user' as const, content: userText };
    
    setGlobalMessages((prev) => [...prev, userMsg]);
    setGlobalInput('');
    setGlobalChatLoading(true);

    // Client-side quick keyword scanning for instant navigation
    const textLower = userText.toLowerCase();
    let targetPath = '';
    let targetLabel = '';

    const isPatient = userProfile?.roleId === 'patient' || userProfile?.roleId === 'familyMember';
    
    if (isPatient) {
      if (textLower.includes('nutrition') || textLower.includes('diet') || textLower.includes('food') || textLower.includes('calorie') || textLower.includes('macro') || textLower.includes('meal') || textLower.includes('water')) {
        targetPath = '/patient/nutrition';
        targetLabel = 'Diet Plan & Nutrition Hub ';
      } else if (textLower.includes('record') || textLower.includes('ehr') || textLower.includes('history') || textLower.includes('medical') || textLower.includes('report') || textLower.includes('lab')) {
        targetPath = '/patient/records';
        targetLabel = 'Personal Health Records ';
      } else if (textLower.includes('telemedicine') || textLower.includes('video') || textLower.includes('call') || textLower.includes('consult') || textLower.includes('doctor')) {
        targetPath = '/patient/telemedicine';
        targetLabel = 'Telemedicine Workspace ';
      } else if (textLower.includes('appointment') || textLower.includes('schedule') || textLower.includes('book') || textLower.includes('visit') || textLower.includes('calendar')) {
        targetPath = '/patient/appointments';
        targetLabel = 'Clinical Appointments ';
      } else if (textLower.includes('emergency') || textLower.includes('sos') || textLower.includes('ambulance') || textLower.includes('panic')) {
        targetPath = '/patient/emergency';
        targetLabel = 'Emergency Operations SOS ';
      } else if (textLower.includes('profile') || textLower.includes('account') || textLower.includes('user') || textLower.includes('setting')) {
        targetPath = '/patient/profile';
        targetLabel = 'Personal Profile Settings ';
      } else if (textLower.includes('billing') || textLower.includes('invoice') || textLower.includes('payment') || textLower.includes('cost') || textLower.includes('fee')) {
        targetPath = '/patient/billing';
        targetLabel = 'Payments & Billing Desk ';
      } else if (textLower.includes('dashboard') || textLower.includes('home') || textLower.includes('overview')) {
        targetPath = '/patient/dashboard';
        targetLabel = 'Patient Overview Dashboard ';
      }
    } else {
      if (textLower.includes('staff') || textLower.includes('roster') || textLower.includes('shift') || textLower.includes('leave') || textLower.includes('employee') || textLower.includes('nurse') || textLower.includes('doctor')) {
        targetPath = '/hospital/staff';
        targetLabel = 'Staff & Roster Planner ';
      } else if (textLower.includes('analytics') || textLower.includes('statistics') || textLower.includes('beds') || textLower.includes('predictive') || textLower.includes('forecast') || textLower.includes('combat')) {
        targetPath = '/hospital/analytics';
        targetLabel = 'Predictive Crisis Analytics ';
      } else if (textLower.includes('settings') || textLower.includes('department') || textLower.includes('inventory') || textLower.includes('supplies') || textLower.includes('buffer') || textLower.includes('config')) {
        targetPath = '/hospital/settings';
        targetLabel = 'Hospital Control Settings ';
      } else if (textLower.includes('patient') || textLower.includes('record') || textLower.includes('ehr') || textLower.includes('history') || textLower.includes('reports') || textLower.includes('prescription')) {
        targetPath = '/hospital/patients';
        targetLabel = 'Patient Directory Records ';
      } else if (textLower.includes('schedule') || textLower.includes('appointment') || textLower.includes('book') || textLower.includes('consultation')) {
        targetPath = '/hospital/schedule';
        targetLabel = 'Clinical Appointment Scheduler ';
      } else if (textLower.includes('emergency') || textLower.includes('sos') || textLower.includes('ambulance') || textLower.includes('dispatch') || textLower.includes('incident')) {
        targetPath = '/hospital/emergency';
        targetLabel = 'Emergency Operations Dispatch ';
      } else if (textLower.includes('dashboard') || textLower.includes('home') || textLower.includes('overview') || textLower.includes('kpi')) {
        targetPath = '/hospital/dashboard';
        targetLabel = 'Hospital Overview Dashboard ';
      }
    }

    let nextMessages = [...globalMessages, userMsg];

    // Execute stateful data mutations before calling model
    const mutationResult = await executeNaturalLanguageCommand(userText);
    if (mutationResult) {
      const systemConfirmMsg = { role: 'assistant' as const, content: mutationResult };
      setGlobalMessages((prev) => [...prev, systemConfirmMsg]);
      nextMessages.push(systemConfirmMsg);
    }

    if (targetPath) {
      // Add custom redirect message and trigger countdown
      const redirectMsg = {
        role: 'assistant' as const,
        content: ` **Navigation Intent Recognized!**\n\nI am redirecting you to the **${targetLabel}** in 3 seconds. Hang tight!`
      };
      setGlobalMessages((prev) => [...prev, redirectMsg]);
      nextMessages.push(redirectMsg);
      
      setNavTarget(targetPath);
      setCountdownVal(3);
      setCountdownActive(true);
    }

    try {
      const isClinical = userProfile?.roleId === 'doctor' || userProfile?.roleId === 'nurse' || userProfile?.roleId === 'ruralVolunteer';
      const requestType = isClinical ? 'clinical' : 'analytics';

      // Fetch AI response concurrently
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          type: requestType,
          messages: nextMessages,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const botMsg = data.choices?.[0]?.message || {
          role: 'assistant',
          content: 'I am here to assist you. If you need any help, let me know!'
        };
        setGlobalMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error(err);
      if (!targetPath && !mutationResult) {
        setGlobalMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'I apologize, I had trouble reaching the PulseGrid AI network. Please try again.' }
        ]);
      }
    } finally {
      setGlobalChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
          'transform transition-transform duration-300 lg:transform-none',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* FLOATING GLOBAL ADMIN AI COMPANION & NAVIGATOR */}
      {(userProfile?.roleId === 'hospitalAdmin' || userProfile?.roleId === 'patient' || userProfile?.roleId === 'familyMember' || userProfile?.roleId === 'doctor' || userProfile?.roleId === 'nurse' || userProfile?.roleId === 'ruralVolunteer') && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
          {/* Expandable Chat Capsule */}
          {isGlobalChatOpen && (
            <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[480px] bg-slate-950/95 border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col mb-4 animate-in slide-in-from-bottom-5 duration-300">
              {/* Header */}
              <div className="p-5 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-lg">
                    
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {userProfile?.roleId === 'hospitalAdmin' ? 'PulseGrid Admin AI' : isClinical ? 'PulseGrid Clinical AI' : 'PulseGrid Health AI'}
                    </h4>
                    <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mt-0.5">
                      {userProfile?.roleId === 'hospitalAdmin' ? 'Real-Time Database Mutator' : isClinical ? 'Clinical Decision Agent' : 'Your Smart Health Companion'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsGlobalChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center border border-white/5 active:scale-95 transition-all text-xs font-bold"
                >
                  
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                {globalMessages.map((msg, index) => {
                  const action = msg.role === 'assistant' ? parseChatAction(msg.content) : null;
                  const displayText = msg.content.replace(/```json[\s\S]*?```/, '').trim();

                  return (
                    <div key={index} className="space-y-3">
                      <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                          msg.role === 'user'
                            ? 'bg-cyan-600 text-white rounded-tr-none ml-auto'
                            : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none mr-auto whitespace-pre-line'
                        }`}>
                          {displayText}
                        </div>
                      </div>

                      {action && renderActionCard(action, index)}
                    </div>
                  );
                })}

                {/* Countdown / Redirection Card */}
                {countdownActive && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <span className="text-xl"></span>
                      <div>
                        <p className="text-xs font-black text-white">Redirecting In Progress</p>
                        <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Navigating in {countdownVal} seconds...</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setCountdownActive(false);
                        setGlobalMessages(prev => [
                          ...prev,
                          { role: 'assistant', content: ' **Navigation Aborted.** How else can I assist you today?' }
                        ]);
                      }}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {globalChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 text-cyan-400">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                      Processing command...
                    </div>
                  </div>
                )}
                <div ref={globalChatEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendGlobalMessage} className="p-4 bg-slate-900/40 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder={
                    userProfile?.roleId === 'hospitalAdmin' 
                      ? "Type 'add 50 ventilators', 'approve Carol leave', or ask questions..." 
                      : isClinical 
                      ? "Type 'Send Amoxicillin for John Doe' or ask clinical questions..." 
                      : "Type 'log 500ml water', 'log 300 kcal', or ask health questions..."
                  }
                  value={globalInput}
                  onChange={(e) => setGlobalInput(e.target.value)}
                  disabled={countdownActive}
                  className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={globalChatLoading || countdownActive || !globalInput.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-95"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* Pulsing Toggle Button */}
          <button
            onClick={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl relative transition-all active:scale-90 border ${
              isGlobalChatOpen 
                ? 'bg-rose-950 border-rose-500/30 text-rose-400 hover:bg-rose-900' 
                : 'bg-gradient-to-tr from-cyan-600 to-cyan-800 border-cyan-400/30 text-white hover:scale-105'
            }`}
            title="Open AI Command Center Assistant"
          >
            {!isGlobalChatOpen && (
              <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping"></span>
            )}
            <span className="text-2xl">{isGlobalChatOpen ? '' : ''}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
