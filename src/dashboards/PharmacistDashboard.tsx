// ============================================================
// PULSEGRID — PHARMACIST CENTRAL DASHBOARD OVERVIEW
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DashboardWidget from '../components/ui/DashboardWidget';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  stock: number;
  minStock: number;
  price: number;
  isControlled: boolean;
  genericAlternatives: string;
}

interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  genericAlternative: string;
  interactionWarnings: string;
  isControlled: boolean;
}

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  medicines: string;
  counselingNotes: string | null;
  status: 'PENDING' | 'VALIDATED' | 'DISPENSED';
  createdAt: string;
}

interface ControlledLog {
  id: string;
  medicineName: string;
  patientName: string;
  quantity: number;
  pharmacistName: string;
  action: 'DISPENSED' | 'RESTOCKED';
  createdAt: string;
}

const PharmacistDashboard: React.FC = () => {
  const { userProfile, token } = useAuthStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [controlledLogs, setControlledLogs] = useState<ControlledLog[]>([]);
  const [dispatchDeliveryStatus, setDispatchDeliveryStatus] = useState<Record<string, string>>({});

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Prescriptions
      const rxRes = await fetch('http://localhost:4000/api/pharmacist/prescriptions', { headers });
      const rxData = rxRes.ok ? await rxRes.json() : [];

      // Inventory
      const invRes = await fetch('http://localhost:4000/api/pharmacist/inventory', { headers });
      const invData = invRes.ok ? await invRes.json() : { medicines: [] };

      // Controlled Substance Logs
      const logsRes = await fetch('http://localhost:4000/api/pharmacist/controlled-logs', { headers });
      const logsData = logsRes.ok ? await logsRes.json() : [];

      setPrescriptions(rxData);
      setMedicines(invData.medicines || []);
      setControlledLogs(logsData);
    } catch (error) {
      console.error('Failed to sync pharmacist telemetry:', error);
      setErrorMsg('Fulfillment Network offline. Please retry or contact technical desk.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Statistics
  const lowStockCount = medicines.filter(m => m.stock <= m.minStock).length;
  const pendingRxCount = prescriptions.filter(p => p.status === 'PENDING' || p.status === 'VALIDATED').length;
  const controlledDoseCount = controlledLogs.length;
  const totalStockSum = medicines.reduce((acc, curr) => acc + curr.stock, 0);

  // SVG Chart data for Controlled Substance dispatches
  const dispatchHistory = [4, 5, 8, 3, 7, 6, controlledDoseCount];
  const minVal = Math.min(...dispatchHistory) * 0.8;
  const maxVal = Math.max(...dispatchHistory) * 1.2;
  const range = maxVal - minVal || 10;
  
  const coords = dispatchHistory.map((val, idx) => {
    const x = (idx / (dispatchHistory.length - 1)) * 420 + 20;
    const y = 120 - ((val - minVal) / range) * 80;
    return { x, y, val };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} 130 L ${coords[0].x} 130 Z`;

  if (isLoading && medicines.length === 0) {
    return (
      <div className="p-12 text-slate-400 font-bold italic text-center animate-pulse">
         Accessing Controlled Substance Cabinets & Dashboard metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2.5">
            <span></span> Central Command Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            On-Duty Pharmacist: <span className="text-emerald-400 font-bold">{userProfile?.displayName || 'Albert Hofmann'}</span> • Sector: AIIMS Central Pharmacy Desk
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          className="bg-slate-900 border border-white/5 text-slate-300 hover:bg-slate-800 text-xs font-black uppercase px-4 py-2.5 rounded-xl"
        >
           Sync System Data
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold">
           {errorMsg}
        </div>
      )}

      {/* KPI Deck */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
        <DashboardWidget
          title="Fulfillment Roster"
          value={pendingRxCount.toString()}
          icon=""
          iconColor="text-emerald-400"
        />
        <DashboardWidget
          title="Low Stock Indicators"
          value={lowStockCount.toString()}
          icon=""
          iconColor={lowStockCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}
        />
        <DashboardWidget
          title="Total Stock Units"
          value={totalStockSum.toString()}
          icon=""
          iconColor="text-cyan-400"
        />
        <DashboardWidget
          title="Controlled Dispatches"
          value={controlledDoseCount.toString()}
          icon=""
          iconColor="text-purple-400"
        />
      </div>

      {/* Grid: Charts & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controlled Substance Dispatch Trend Chart */}
        <div className="lg:col-span-2 bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col space-y-4 shadow-md">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span></span> Controlled Substance Dispatches Trend
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
              Weekly log frequency for highly regulated Schedule H medical dispatches.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-4 rounded-3xl relative">
            <svg className="w-full h-40 overflow-visible mt-4" viewBox="0 0 460 140">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[20, 50, 80, 110].map((y, idx) => (
                <line key={idx} x1="20" y1={y} x2="440" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              ))}

              {/* Area path */}
              <path d={areaPath} fill="url(#areaGrad)" />

              {/* Line path */}
              <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

              {/* Data points */}
              {coords.map((c, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="4"
                    fill="#020617"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
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

              <line x1="20" y1="130" x2="440" y2="130" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between px-3 mt-1 text-[9px] font-bold text-slate-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun (Today)</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/pharmacy/prescriptions')}
              className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all text-center group"
            >
              <span className="text-2xl block mb-2"></span>
              <span className="text-xs font-bold text-white group-hover:text-emerald-400">Validate Rx</span>
            </button>
            <button
              onClick={() => navigate('/pharmacy/inventory')}
              className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all text-center group"
            >
              <span className="text-2xl block mb-2"></span>
              <span className="text-xs font-bold text-white group-hover:text-cyan-400">Manage Stocks</span>
            </button>
            <button
              onClick={() => navigate('/pharmacy/inventory')}
              className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all text-center group"
            >
              <span className="text-2xl block mb-2"></span>
              <span className="text-xs font-bold text-white group-hover:text-purple-400">Wholesalers</span>
            </button>
          </div>
        </div>

        {/* Schedule H Controlled Substances Ledger */}
        <div className="lg:col-span-1">
          <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">Schedule H Cabinet Logs</h4>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {controlledLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        log.action === 'DISPENSED'
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {log.medicineName} (x{log.quantity})
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-0.5">
                      <p>Pharmacist: <span className="text-white font-semibold">{log.pharmacistName}</span></p>
                      <p>Patient Target: <span className="text-white font-semibold">{log.patientName}</span></p>
                    </div>
                  </div>
                ))}

                {controlledLogs.length === 0 && (
                  <div className="text-center py-8 text-slate-500 italic text-xs">
                    No controlled substance cabinet logs recorded.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dispensation Billing Ledger & Courier Coordination */}
      <Card className="bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] shadow-md">
        <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span></span> Dispensed Prescriptions Billing & Courier Desk
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptions.filter(rx => rx.status === 'DISPENSED').map(rx => {
            const rxMeds = JSON.parse(rx.medicines) as PrescriptionItem[];
            let totalCost = 0;
            rxMeds.forEach(rm => {
              const dbMatch = medicines.find(m => m.name.toLowerCase().includes(rm.name.toLowerCase()));
              if (dbMatch) totalCost += dbMatch.price;
            });

            const deliveryStatus = dispatchDeliveryStatus[rx.id] || 'Delivered';

            return (
              <div key={rx.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded uppercase">
                      INVOICE PAID
                    </span>
                    <h5 className="text-xs font-bold text-white mt-1.5">Recipient: {rx.patientName}</h5>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block">Invoice Amount</span>
                    <span className="text-xs font-black text-white font-mono">₹{totalCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[10px]">
                  <span className="text-slate-400 font-semibold">Courier Sector Dispatch</span>
                  <span className={`font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    deliveryStatus.includes('Coordinating')
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/20'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {deliveryStatus}
                  </span>
                </div>

                {deliveryStatus.includes('Coordinating') && (
                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={() => setDispatchDeliveryStatus(prev => ({ ...prev, [rx.id]: 'Dispatched - In Transit' }))}
                      className="bg-slate-950 hover:bg-slate-800 border border-white/5 text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg text-slate-300"
                    >
                      Dispatch Courier 
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {prescriptions.filter(rx => rx.status === 'DISPENSED').length === 0 && (
            <div className="md:col-span-3 text-center py-6 text-slate-500 italic text-xs">
              No recent dispatches recorded.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PharmacistDashboard;
