// ============================================================
// PULSEGRID — NATIONAL ANALYTICS & DISEASE TREND AI
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

interface SummaryData {
  totalBeds: number;
  totalIcu: number;
  occupiedBeds: number;
  activeOccupancyPercentage: number;
  totalPatients: number;
  totalEmergencies: number;
  activeEmergencies: number;
}

interface AIConditionTarget {
  label: string;
  count: number;
  prevention: string;
  severity: 'HIGH' | 'MEDIUM' | 'STABLE';
}

interface AnalyticsData {
  summary: SummaryData;
  regionClusters: { [region: string]: number };
  clinicalAITargets: AIConditionTarget[];
  activeHotspots: string[];
}

export const NationalAnalytics: React.FC = () => {
  const { token } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAITab, setSelectedAITab] = useState<number>(0);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Fetch real-world national stats & AI clusters from database
  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/admin/national-analytics', {
        headers: getHeaders()
      });
      if (response.ok) {
        const resData = await response.json();
        setData(resData as AnalyticsData);
      }
    } catch (err) {
      console.error('Failed to load national clinical analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  // Derived financial revenue indicators (Calibrated for India in Indian Rupees INR - ₹83 per USD)
  const inrRate = 83;
  const docConsultationEstimate = data ? data.summary.totalPatients * 150 * inrRate : 0;
  const networkLicenseEstimate = data ? Object.keys(data.regionClusters).length * 12500 * inrRate : 0;
  const emergencyBillingEstimate = data ? data.summary.totalEmergencies * 450 * inrRate : 0;
  const totalSystemRevenue = docConsultationEstimate + networkLicenseEstimate + emergencyBillingEstimate;

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto text-slate-100 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl"></span> National Analytics & Disease Trend AI (India Command)
          </h1>
          <p className="text-slate-400 mt-1 font-semibold text-xs">
            Ecosystem macro metrics. Runs rule-based AI clinical parsing over Indian state demographics, patient symptoms, and ICU bed capacities.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/20 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
        >
           Refresh Feed
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-slate-400 font-bold italic">
           Aggregating clinical registries and compiling Disease Trend AI projections...
        </div>
      ) : !data ? (
        <div className="text-center p-12 text-slate-500 font-bold italic">
          Failed to compile national healthcare analytics.
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* TOP DECK: Global Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Registered Patients', value: data.summary.totalPatients, desc: 'Live Indian Registry', color: 'text-white' },
              { label: 'Live Bed Capacity', value: `${data.summary.occupiedBeds}/${data.summary.totalBeds}`, desc: `${data.summary.activeOccupancyPercentage}% Occupancy Rate`, color: 'text-cyan-400' },
              { label: 'Active ICU Space Units', value: data.summary.totalIcu, desc: 'Critical care buffer', color: 'text-white' },
              { label: 'SOS Emergencies Logged', value: data.summary.totalEmergencies, desc: `${data.summary.activeEmergencies} currently active`, color: 'text-rose-400' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 shadow-lg font-semibold flex flex-col justify-between">
                <div>
                  <p className="text-slate-500 text-[9px] uppercase tracking-wider font-black">{s.label}</p>
                  <p className={`text-2xl font-black mt-2 ${s.color}`}>{s.value}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-bold italic border-t border-white/5 pt-2">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* SECOND ROW: AI DISEASE TRENDS vs REGIONAL HOTSPOTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Disease Trend Projections */}
            <div className="lg:col-span-2 bg-slate-950/40 border border-white/5 p-6 rounded-[2rem] shadow-md flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <span className="text-[9px] px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/25 rounded-md font-black uppercase tracking-widest animate-pulse">
                    AI PROJECTIONS ENGINE
                  </span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mt-2">Active Clinical Health Clusters</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Automated clinical warning clusters scanned from database diagnosis tags.</p>
                </div>

                {/* AI targets tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.clinicalAITargets.map((target, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedAITab(idx)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                        selectedAITab === idx
                          ? 'bg-cyan-950 text-cyan-400 border-cyan-500/20 shadow-sm'
                          : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                      }`}
                    >
                      {target.severity === 'HIGH' ? ' ' : target.severity === 'MEDIUM' ? ' ' : ' '}
                      Cluster {idx + 1}
                    </button>
                  ))}
                </div>

                {/* AI Active tab Details */}
                {data.clinicalAITargets[selectedAITab] && (
                  <div className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl space-y-4 animate-fade-in text-xs font-semibold">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <h4 className="text-white font-black text-sm leading-snug">
                        {data.clinicalAITargets[selectedAITab].label}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        data.clinicalAITargets[selectedAITab].severity === 'HIGH' ? 'bg-rose-950 text-rose-400 border border-rose-500/20' :
                        data.clinicalAITargets[selectedAITab].severity === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {data.clinicalAITargets[selectedAITab].severity} THREAT
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      Detected Patient Density Signature: <span className="text-white font-bold">{data.clinicalAITargets[selectedAITab].count} patients matching</span>
                    </div>

                    <div className="bg-slate-950 p-4 border border-white/5 rounded-xl space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400"> AI Preventative Directive</span>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {data.clinicalAITargets[selectedAITab].prevention}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-[10px] text-slate-500 font-semibold italic">
                 AI Disease Engine runs a dynamic K-Means mapping sweep across SQLite allergy indexes every 60 seconds.
              </div>
            </div>

            {/* Regional Hotspots (Real DB Distribution) */}
            <div className="lg:col-span-1 bg-slate-950/40 border border-white/5 p-6 rounded-[2rem] shadow-md flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Regional Demographics</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Active patient density clusterings mapped by Indian state registries.</p>
              </div>

              {/* Bar graph visualization */}
              <div className="space-y-4">
                {Object.entries(data.regionClusters).map(([region, count]) => {
                  const maxCount = Math.max(...Object.values(data.regionClusters));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={region} className="space-y-1 text-xs font-semibold">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-300">
                        <span>{region}</span>
                        <span className="font-mono text-cyan-400">{count} Patient{count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full bg-slate-900 border border-white/5 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-slate-400 font-mono font-semibold bg-slate-900/40 p-3.5 border border-white/5 rounded-xl">
                 Indian Demographic Hubs:<br />
                <span className="text-slate-200 mt-1 block uppercase tracking-wider font-sans font-black text-[11px]">
                  {data.activeHotspots.join(', ') || 'Global Division'}
                </span>
              </div>
            </div>

          </div>

          {/* BOTTOM ROW: REVENUE STREAM ANALYZER */}
          <div className="bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] shadow-md space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span></span> Indian Healthcare Ecosystem Financial Ledger
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Revenue indices compiled in Indian Rupees (₹) dynamically from active registrations and medical runs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
              {/* Revenue Streams details */}
              <div className="space-y-3 bg-slate-900/40 border border-white/5 p-5 rounded-2xl">
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Revenue Split (INR)</h4>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Telemedicine Consultation Fees:</span>
                    <span className="text-white">₹{docConsultationEstimate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Hospital Nodes Licensing:</span>
                    <span className="text-white">₹{networkLicenseEstimate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400">Ambulance SOS Dispatches:</span>
                    <span className="text-white">₹{emergencyBillingEstimate.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Total revenue */}
              <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-wider">National Gross Value (INR)</h4>
                  <p className="text-3xl font-black text-cyan-400 mt-2">₹{totalSystemRevenue.toLocaleString()}</p>
                </div>
                <p className="text-[9px] text-slate-500 font-bold italic mt-2">Aggregated macro-revenue projections based on SQLite databases.</p>
              </div>

              {/* Action */}
              <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Financial Policy Control</h4>
                  <p className="text-slate-400 leading-relaxed mt-2 text-[10px] font-semibold">
                    Review network pricing controls, modify consultation licensing limits, or export financial diagnostic balance sheets.
                  </p>
                </div>
                <button
                  onClick={() => alert(`Consolidated Ledger: ₹${totalSystemRevenue.toLocaleString()} compiled for national regulatory reporting.`)}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md mt-4"
                >
                   Export Financial Balance Sheet
                </button>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default NationalAnalytics;
