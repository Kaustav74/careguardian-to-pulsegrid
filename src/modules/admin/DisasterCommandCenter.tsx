// ============================================================
// PULSEGRID — DISASTER COMMAND & MASS BROADCAST AUTHORITY
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

interface BroadcastAlert {
  id: string;
  message: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  region: string;
  timestamp: string;
}

interface DisasterPlan {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface RegionalAlerts {
  [region: string]: 'NORMAL' | 'YELLOW' | 'AMBER' | 'RED';
}

export const DisasterCommandCenter: React.FC = () => {
  const { token } = useAuthStore();
  const [broadcasts, setBroadcasts] = useState<BroadcastAlert[]>([]);
  const [plans, setPlans] = useState<DisasterPlan[]>([]);
  const [regionalAlerts, setRegionalAlerts] = useState<RegionalAlerts>({});

  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('WARNING');
  const [selectedRegion, setSelectedRegion] = useState('Northern Division');

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // 1. Fetch live disaster datasets from persistent storage
  const loadCommandData = async () => {
    if (!token) return;
    try {
      const [bRes, rRes, pRes] = await Promise.all([
        fetch('http://localhost:4000/api/admin/broadcasts', { headers: getHeaders() }),
        fetch('http://localhost:4000/api/admin/regional-alerts', { headers: getHeaders() }),
        fetch('http://localhost:4000/api/admin/disaster-plans', { headers: getHeaders() })
      ]);

      if (bRes.ok && rRes.ok && pRes.ok) {
        const bData = await bRes.json();
        const rData = await rRes.json();
        const pData = await pRes.json();

        setBroadcasts(bData as BroadcastAlert[]);
        setRegionalAlerts(rData as RegionalAlerts);
        setPlans(pData as DisasterPlan[]);
      }
    } catch (err) {
      console.error('Failed to query disaster command matrices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommandData();
  }, [token]);

  // 2. Broadcast Mass Directive Alert
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      triggerToast(' Broadcast bulletin cannot be blank.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/broadcasts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, priority, region: selectedRegion })
      });

      if (response.ok) {
        triggerToast(' Mass Emergency Bulletin Broadcasted & Logged!');
        setMessage('');
        await loadCommandData();
      } else {
        triggerToast(' Failed to deploy emergency broadcast.');
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Connection error dispatching broadcast.');
    }
  };

  // 3. Update Regional Alert Escalation levels
  const handleEscalateRegion = async (region: string, level: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/regional-alerts/escalate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ region, level })
      });

      if (response.ok) {
        triggerToast(` Escalated ${region} Hazard Tier to ${level}!`);
        await loadCommandData();
      } else {
        triggerToast(' Failed to update regional alert level.');
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Connection error changing alert level.');
    }
  };

  // 4. Toggle active disaster response plans
  const handleTogglePlan = async (id: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/disaster-plans/toggle', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        triggerToast(' Response Plan Protocol Toggled & Logged!');
        await loadCommandData();
      } else {
        triggerToast(' Failed to toggle response plan.');
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Connection error toggling response plan.');
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto text-slate-100 pb-16">
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-950 border border-red-500/30 rounded-2xl px-5 py-3.5 text-white shadow-2xl animate-fade-in font-bold text-xs">
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl"></span> Disaster Command Center
          </h1>
          <p className="text-slate-400 mt-1 font-semibold text-xs">
            Coordinate emergency responses, broadcast regional alert directives, and actuate contingency medical pipelines.
          </p>
        </div>
        <span className="text-[10px] px-3 py-1 bg-red-950 text-red-400 border border-red-500/25 rounded-xl font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          BROADCAST AUTH ACTIVE
        </span>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-slate-400 font-bold italic">
           Activating Command Center Interfaces...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN: Regional Escalation & Response Plans */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Regional Hazard Escalations */}
            <div className="bg-slate-950/40 border border-white/5 p-5 rounded-[2rem] shadow-md space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Regional Escalation Grid</h3>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Control alert parameters dynamically across national zones.</p>
              </div>

              <div className="space-y-3">
                {Object.entries(regionalAlerts).map(([region, level]) => (
                  <div key={region} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white">{region}</h4>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        level === 'RED' ? 'bg-red-950 text-red-400 border border-red-500/10 animate-pulse' :
                        level === 'AMBER' ? 'bg-amber-950 text-amber-400 border border-amber-500/10' :
                        level === 'YELLOW' ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/10' :
                        'bg-slate-950 text-slate-400 border border-white/5'
                      }`}>
                        {level} TIER
                      </span>
                    </div>

                    <select
                      value={level}
                      onChange={(e) => handleEscalateRegion(region, e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white font-bold focus:outline-none focus:border-red-500/50"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="YELLOW">Yellow</option>
                      <option value="AMBER">Amber</option>
                      <option value="RED">Red Alert</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Disaster Response Plans Catalog */}
            <div className="bg-slate-950/40 border border-white/5 p-5 rounded-[2rem] shadow-md space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contingency Protocols</h3>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Actuate medical logistics rules and emergency support models.</p>
              </div>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-white">{plan.name}</h4>
                      <button
                        onClick={() => handleTogglePlan(plan.id)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                          plan.active
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-950 text-slate-500 border-white/5'
                        }`}
                      >
                        {plan.active ? 'ACTIVE' : 'STANDBY'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                      {plan.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Mass Broadcast Console */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Broadcaster Input Terminal */}
            <form onSubmit={handleBroadcast} className="bg-slate-950/40 border border-white/5 p-6 rounded-[2rem] shadow-md space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span></span> Broadcast Emergency Directive
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Send a real-time warning broadcast to clinic terminals and alert ledgers.</p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type emergency alert text here... E.g., Respiratory alert issued for Delhi NCR. Heavy PM2.5 levels detected. Asthmatics keep emergency inhalers ready."
                  rows={3}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 font-semibold leading-relaxed"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Target Region Division</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 font-bold"
                    >
                      <option value="All India">All India</option>
                      <option value="Northern Division">Northern Division (Delhi NCR)</option>
                      <option value="Western Division">Western Division (Mumbai)</option>
                      <option value="Southern Division">Southern Division (Bangalore)</option>
                      <option value="Eastern Division">Eastern Division (Kolkata)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 font-bold"
                    >
                      <option value="INFO">Information (Blue)</option>
                      <option value="WARNING">Warning (Amber)</option>
                      <option value="CRITICAL">Critical Emergency (Red)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md mt-4"
              >
                 Deploy Mass Emergency Broadcast Directive
              </button>
            </form>

            {/* Broadcasts Ledger logs */}
            <div className="bg-slate-950/40 border border-white/5 p-6 rounded-[2rem] shadow-md space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Chronological Broadcasts ledger</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Audit log of deployed mass warnings stored in dynamic files.</p>
              </div>

              <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-1">
                {broadcasts.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 font-bold italic text-xs">
                    No active emergency broadcasts logged.
                  </div>
                ) : (
                  broadcasts.map((b) => (
                    <div key={b.id} className="py-4 space-y-2 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center gap-2 flex-wrap text-[9px] font-black uppercase tracking-wider">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md ${
                            b.priority === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-500/20' :
                            b.priority === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-500/20' :
                            'bg-cyan-950 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {b.priority}
                          </span>
                          <span className="text-slate-300">{b.region}</span>
                        </div>
                        <span className="text-slate-500 font-mono">
                          {new Date(b.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                        {b.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default DisasterCommandCenter;
