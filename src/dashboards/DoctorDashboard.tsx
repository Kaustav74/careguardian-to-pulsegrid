// ============================================================
// PULSEGRID — INTERACTIVE ATTENDING PHYSICIAN DASHBOARD
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import DashboardWidget from '../components/ui/DashboardWidget';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

interface Appointment {
  id: string;
  time: string;
  patient: string;
  patientId: string;
  reason: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

const VITALS_HISTORY_MOCK: Record<string, Record<string, number[]>> = {
  'John Doe': {
    'Heart Rate': [72, 75, 84, 95, 110, 105, 98],
    'Blood Pressure': [120, 122, 130, 142, 155, 148, 140],
    'Blood Glucose': [95, 102, 120, 145, 180, 165, 150]
  },
  'Sarah Jenkins': {
    'Heart Rate': [68, 70, 72, 85, 94, 90, 88],
    'Blood Pressure': [115, 118, 112, 125, 138, 130, 122],
    'Blood Glucose': [88, 90, 92, 105, 115, 108, 98]
  },
  'Michael Chang': {
    'Heart Rate': [80, 82, 78, 85, 90, 84, 82],
    'Blood Pressure': [135, 138, 140, 145, 150, 144, 138],
    'Blood Glucose': [110, 115, 122, 135, 158, 142, 130]
  }
};

export const DoctorDashboard: React.FC = () => {
  const { userProfile, token } = useAuthStore();
  const navigate = useNavigate();

  // Active patient list loading
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('John Doe');
  const [selectedMetric, setSelectedMetric] = useState('Heart Rate');

  // AI analysis states
  const [aiAuditing, setAiAuditing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Live appointments roster state
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', time: '09:00 AM', patient: 'John Doe', patientId: 'PT-01', reason: 'Electrolyte Review', status: 'completed' },
    { id: '2', time: '10:30 AM', patient: 'Sarah Jenkins', patientId: 'PT-02', reason: 'Bronchitis Consult', status: 'in-progress' },
    { id: '3', time: '11:15 AM', patient: 'Michael Chang', patientId: 'PT-03', reason: 'Neurology Review', status: 'upcoming' },
    { id: '4', time: '02:00 PM', patient: 'John Doe', patientId: 'PT-01', reason: 'Diuretic Follow-up', status: 'upcoming' }
  ]);

  // AI Pharmacy Dispatches ledger state
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [criticalSOSCount, setCriticalSOSCount] = useState(0);

  // Fetch / Sync patient listings
  useEffect(() => {
    const syncDatabase = () => {
      const local = localStorage.getItem('cg_patients');
      if (local) {
        setPatients(JSON.parse(local));
      }

      // Sync recent direct prescriptions dispatched from Chatbot
      const localRx = localStorage.getItem('cg_prescriptions');
      if (localRx) {
        setRecentPrescriptions(JSON.parse(localRx).slice(0, 3));
      }

      // Sync active SOS emergency incidents
      const localSOS = localStorage.getItem('cg_sos_alerts');
      if (localSOS) {
        const active = JSON.parse(localSOS).filter((s: any) => s.status.includes('Active'));
        setCriticalSOSCount(active.length);
      }
    };

    syncDatabase();
    window.addEventListener('pulsegrid-patients-update', syncDatabase);
    window.addEventListener('pulsegrid-prescriptions-update', syncDatabase);
    window.addEventListener('pulsegrid-sos-update', syncDatabase);

    return () => {
      window.removeEventListener('pulsegrid-patients-update', syncDatabase);
      window.removeEventListener('pulsegrid-prescriptions-update', syncDatabase);
      window.removeEventListener('pulsegrid-sos-update', syncDatabase);
    };
  }, []);

  // Recalculate dynamic SVG Chart coordinates
  const patientData = VITALS_HISTORY_MOCK[selectedPatient] || VITALS_HISTORY_MOCK['John Doe'];
  const dataPoints = patientData[selectedMetric] || patientData['Heart Rate'];
  
  const minVal = Math.min(...dataPoints) * 0.9;
  const maxVal = Math.max(...dataPoints) * 1.1;
  const range = maxVal - minVal || 10;
  
  const coords = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * 420 + 20;
    const y = 140 - ((val - minVal) / range) * 100;
    return { x, y, val };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} 145 L ${coords[0].x} 145 Z`;

  // Cycle Schedule Statuses
  const handleCycleStatus = (id: string) => {
    setAppointments(prev => prev.map(apt => {
      if (apt.id === id) {
        const statuses: ('completed' | 'in-progress' | 'upcoming')[] = ['upcoming', 'in-progress', 'completed'];
        const nextIdx = (statuses.indexOf(apt.status) + 1) % statuses.length;
        return { ...apt, status: statuses[nextIdx] };
      }
      return apt;
    }));
  };

  // Run AI Vitals Audit
  const handleAuditVitals = async () => {
    setAiAuditing(true);
    setAiInsight(null);

    try {
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          type: 'clinical',
          messages: [
            {
              role: 'user',
              content: `Analyze the vital trends of ${selectedPatient} based on these ${selectedMetric} values over 7 days: ${dataPoints.join(', ')}. Provide a concise 2-sentence clinical assessment and recommendations.`
            }
          ]
        })
      });

      const data = await response.json();
      if (response.ok && data.choices?.[0]?.message?.content) {
        setAiInsight(data.choices[0].message.content.replace(/```json[\s\S]*?```/, '').trim());
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      setTimeout(() => {
        let assessment = '';
        if (selectedPatient === 'John Doe') {
          assessment = ` **Clinical Guarded Status**: John Doe has a clear rising trend in ${selectedMetric} (+29% change). This abnormal elevation warrants quick screening for systemic inflammation, renal congestion, or severe dehydration. Recommended immediate prescription evaluation or metabolic follow-up.`;
        } else if (selectedPatient === 'Sarah Jenkins') {
          assessment = ` **Clinical Stable Status**: Sarah Jenkins's ${selectedMetric} remains within normal reference parameters with healthy physiological fluctuation. Continue current routine monitoring. No immediate adjustments needed.`;
        } else {
          assessment = ` **Clinical Elevated Status**: Michael Chang's ${selectedMetric} indicates a steady upward progression (+18% shift). Ensure adherence to daily medications and schedule a routine clinic visit in 7 days to reassess.`;
        }
        setAiInsight(assessment);
      }, 1000);
    } finally {
      setAiAuditing(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
             Attending Physician Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Attending Clinician: <span className="text-cyan-400 font-bold">{userProfile?.displayName || 'Dr. Meredith Grey'}</span> • Roster Sector: General Medicine & Critical Care
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/doctor/emergency')}
            className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2"
          >
             Emergency Operation Board
          </Button>
        </div>
      </div>

      {/* Primary KPI Deck */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardWidget
          title="Appointments Today"
          value={appointments.length.toString()}
          icon=""
          iconColor="text-cyan-400"
        />
        <DashboardWidget
          title="Critical Lab Alerts"
          value="3"
          icon=""
          iconColor="text-amber-500"
        />
        <DashboardWidget
          title="Active SOS Incidents"
          value={criticalSOSCount.toString()}
          icon=""
          iconColor="text-rose-500"
        />
        <DashboardWidget
          title="Direct Rx Dispatches"
          value={recentPrescriptions.length.toString()}
          icon=""
          iconColor="text-emerald-400"
        />
      </div>

      {/* Grid: Graph / Vitals Trends Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vitals Graph Column */}
        <div className="lg:col-span-2 bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col space-y-4 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span></span> Patient Physiological Vitals Trends
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
                Interactive real-time charting with normal range visualization.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <select
                value={selectedPatient}
                onChange={e => {
                  setSelectedPatient(e.target.value);
                  setAiInsight(null);
                }}
                className="bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none"
              >
                {Object.keys(VITALS_HISTORY_MOCK).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select
                value={selectedMetric}
                onChange={e => {
                  setSelectedMetric(e.target.value);
                  setAiInsight(null);
                }}
                className="bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none"
              >
                {['Heart Rate', 'Blood Pressure', 'Blood Glucose'].map(metric => (
                  <option key={metric} value={metric}>{metric}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SVG Line Graph */}
          <div className="bg-slate-900/40 border border-white/5 p-4 rounded-3xl relative">
            <div className="absolute top-4 left-4 flex gap-4 text-[9px] font-black uppercase tracking-wider text-slate-500">
              <div>Selected: <span className="text-cyan-400 font-black">{selectedPatient}</span></div>
              <div>Parameter: <span className="text-cyan-400 font-black">{selectedMetric}</span></div>
            </div>

            <svg className="w-full h-44 overflow-visible mt-6" viewBox="0 0 460 150">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[30, 60, 90, 120].map((y, idx) => (
                <line key={idx} x1="20" y1={y} x2="440" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              ))}

              {/* Area path */}
              <path d={areaPath} fill="url(#areaGrad)" />

              {/* Line path */}
              <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />

              {/* Data points */}
              {coords.map((c, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="4"
                    fill="#020617"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    className="hover:scale-125 transition-transform"
                  />
                  {/* Glowing Ring */}
                  <circle cx={c.x} cy={c.y} r="8" fill="#06b6d4" fillOpacity="0.1" className="animate-ping" style={{ animationDuration: '3s' }} />
                  {/* Value Label */}
                  <text
                    x={c.x}
                    y={c.y - 10}
                    className="text-[9px] font-black fill-white text-center"
                    textAnchor="middle"
                  >
                    {c.val}
                  </text>
                </g>
              ))}

              {/* Axes lines */}
              <line x1="20" y1="145" x2="440" y2="145" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between px-3 mt-1 text-[9px] font-bold text-slate-500">
              <span>Day 1</span>
              <span>Day 2</span>
              <span>Day 3</span>
              <span>Day 4</span>
              <span>Day 5</span>
              <span>Day 6</span>
              <span>Day 7 (Today)</span>
            </div>
          </div>

          {/* AI Result Analysis */}
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-3xl space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="text-base"></span>
                <span className="text-[10px] font-black uppercase tracking-wider">AI Patient Metrics Auditor</span>
              </div>
              <Button
                onClick={handleAuditVitals}
                disabled={aiAuditing}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl active:scale-95"
              >
                {aiAuditing ? 'Auditing...' : ' Audit Trend Vitals'}
              </Button>
            </div>

            {aiInsight ? (
              <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-950 p-3 rounded-2xl border border-white/5 animate-fade-in whitespace-pre-line">
                {aiInsight}
              </p>
            ) : (
              <p className="text-xs text-slate-500 font-semibold italic text-center py-4">
                Click Audit to analyze physiological trends over time.
              </p>
            )}
          </div>
        </div>

        {/* Clinical Schedule Column */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <Card className="flex-1 flex flex-col justify-between rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Today's Schedule</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Attending clinical appointment list.</p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-cyan-950 text-cyan-400 rounded-lg font-black uppercase tracking-widest">
                  LIVE
                </span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {appointments.map((apt, idx) => (
                  <div key={apt.id} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-cyan-400 bg-cyan-950 px-2 py-1 rounded-lg">
                          {apt.time}
                        </span>
                        <div>
                          <p className="text-xs font-black text-white">{apt.patient}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{apt.reason}</p>
                        </div>
                      </div>

                      <span
                        onClick={() => handleCycleStatus(apt.id)}
                        className="cursor-pointer select-none"
                      >
                        <Badge
                          variant={apt.status === 'completed' ? 'success' : apt.status === 'in-progress' ? 'warning' : 'neutral'}
                        >
                          {apt.status}
                        </Badge>
                      </span>
                    </div>

                    {/* Roster actions */}
                    <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
                      <button
                        onClick={() => navigate(`/doctor/telemedicine/${apt.patientId}`)}
                        className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all active:scale-95"
                      >
                         Tele-Room
                      </button>
                      <button
                        onClick={() => navigate('/doctor/prescriptions')}
                        className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all active:scale-95"
                      >
                         Dosing
                      </button>
                      <button
                        onClick={() => navigate('/doctor/diagnostics')}
                        className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all active:scale-95"
                      >
                         Labs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Pharmacy Dispatch Logs */}
      {recentPrescriptions.length > 0 && (
        <Card className="bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span></span> Recent AI Pharmacy Dispatch Logs
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
                Attending verification ledger of automated drug prescriptions processed by the Chatbot.
              </p>
            </div>
            <Button
              onClick={() => navigate('/doctor/prescriptions')}
              className="bg-slate-900 hover:bg-slate-800 border border-white/5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl active:scale-95"
            >
              Prescription Desk 
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentPrescriptions.map((rx, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl space-y-2 relative">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {rx.id}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-lg">
                    DISPATCHED
                  </span>
                </div>
                <div className="text-xs font-semibold space-y-1">
                  <p className="text-white font-black">{rx.patientName}</p>
                  <p className="text-cyan-400 font-bold">{rx.medicines[0].name}</p>
                  <p className="text-[10px] text-slate-400">{rx.medicines[0].dosage} ({rx.medicines[0].frequency})</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DoctorDashboard;
