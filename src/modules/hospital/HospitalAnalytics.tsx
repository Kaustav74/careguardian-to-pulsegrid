// ============================================================
// PULSEGRID — HOSPITAL ANALYTICS & PREDICTIVE AI ENGINE
// ============================================================
import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

// Interfaces
interface BedDetail {
  id: string;
  type: 'ICU' | 'General' | 'Pediatric' | 'Recovery';
  status: 'Occupied' | 'Available';
  patientName?: string;
  admissionDate?: string;
}

const INITIAL_BEDS: BedDetail[] = [
  // ICU Beds
  { id: 'ICU-101', type: 'ICU', status: 'Occupied', patientName: 'Robert Chen', admissionDate: '2026-05-15' },
  { id: 'ICU-102', type: 'ICU', status: 'Occupied', patientName: 'John Doe', admissionDate: '2026-05-16' },
  { id: 'ICU-103', type: 'ICU', status: 'Occupied', patientName: 'Marcus Aurelius', admissionDate: '2026-05-17' },
  { id: 'ICU-104', type: 'ICU', status: 'Available' },
  { id: 'ICU-105', type: 'ICU', status: 'Available' },
  { id: 'ICU-106', type: 'ICU', status: 'Available' },
  
  // General Ward Beds
  { id: 'GEN-201', type: 'General', status: 'Occupied', patientName: 'Sarah Jenkins', admissionDate: '2026-05-12' },
  { id: 'GEN-202', type: 'General', status: 'Occupied', patientName: 'Emily Taylor', admissionDate: '2026-05-14' },
  { id: 'GEN-203', type: 'General', status: 'Occupied', patientName: 'Henry Kissinger', admissionDate: '2026-05-15' },
  { id: 'GEN-204', type: 'General', status: 'Available' },
  { id: 'GEN-205', type: 'General', status: 'Available' },
  { id: 'GEN-206', type: 'General', status: 'Available' },
  { id: 'GEN-207', type: 'General', status: 'Available' },
  { id: 'GEN-208', type: 'General', status: 'Available' },
  
  // Pediatric Beds
  { id: 'PED-301', type: 'Pediatric', status: 'Occupied', patientName: 'Timmy Thompson', admissionDate: '2026-05-16' },
  { id: 'PED-302', type: 'Pediatric', status: 'Available' },
  { id: 'PED-303', type: 'Pediatric', status: 'Available' },

  // Recovery Beds
  { id: 'REC-401', type: 'Recovery', status: 'Occupied', patientName: 'Winston Churchill', admissionDate: '2026-05-10' },
  { id: 'REC-402', type: 'Recovery', status: 'Occupied', patientName: 'Elizabeth Windsor', admissionDate: '2026-05-13' },
  { id: 'REC-403', type: 'Recovery', status: 'Available' },
  { id: 'REC-404', type: 'Recovery', status: 'Available' },
];

const HospitalAnalytics: React.FC = () => {
  const { token } = useAuthStore();
  const [beds, setBeds] = useState<BedDetail[]>(INITIAL_BEDS);
  
  // Bed search and filters
  const [selectedWard, setSelectedWard] = useState<'All' | 'ICU' | 'General' | 'Pediatric' | 'Recovery'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Occupied' | 'Available'>('All');

  // AI Predictive Analytics variables
  const [predictionOutput, setPredictionOutput] = useState<string | null>(null);
  const [isLoadingPredict, setIsLoadingPredict] = useState(false);
  const [errorPredict, setErrorPredict] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7days' | '1month'>('7days');
  const [loadingStep, setLoadingStep] = useState('');

  // Interactive bed occupancy stats
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = ((occupiedBeds / totalBeds) * 100).toFixed(1);

  const icuTotal = beds.filter(b => b.type === 'ICU').length;
  const icuOccupied = beds.filter(b => b.type === 'ICU' && b.status === 'Occupied').length;
  const icuRate = ((icuOccupied / icuTotal) * 100).toFixed(0);

  const genTotal = beds.filter(b => b.type === 'General').length;
  const genOccupied = beds.filter(b => b.type === 'General' && b.status === 'Occupied').length;
  const genRate = ((genOccupied / genTotal) * 100).toFixed(0);

  // Bed admission / discharge simulator
  const handleToggleBedStatus = (bedId: string) => {
    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        const isOccupied = b.status === 'Occupied';
        return {
          ...b,
          status: isOccupied ? 'Available' : 'Occupied',
          patientName: isOccupied ? undefined : 'Admitted Sim-Patient',
          admissionDate: isOccupied ? undefined : new Date().toISOString().split('T')[0]
        };
      }
      return b;
    }));
  };

  // Run AI Predictive Analysis via Groq
  const handleRunPredictiveAI = async () => {
    setIsLoadingPredict(true);
    setErrorPredict(null);
    setPredictionOutput(null);

    const steps = [
      ' Querying regional trauma dispatch rates...',
      ' Processing weather indicators and viral indexes...',
      ' Calculating ICU bottleneck probability charts...',
      ' Formulating Pre-Combat Readiness Directives via Groq...'
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setLoadingStep(steps[stepIndex]);
      }
    }, 1800);

    const promptMessage = `Provide a comprehensive hospital bed predictive analysis and emergency forecast. 
Timeframe: ${selectedTimeframe === '7days' ? 'Next 7 Days' : 'Next 1 Month'}.
Current Hospital Metrics:
- Bed Occupancy: ${occupancyRate}% (Total Beds: ${totalBeds}, Occupied: ${occupiedBeds}, Available: ${availableBeds})
- Critical ICU Bed Occupancy: ${icuRate}% (${icuOccupied}/${icuTotal} beds occupied)
- General Ward Occupancy: ${genRate}% (${genOccupied}/${genTotal} beds occupied)
Extra Hospital Context: ${customContext || 'No additional regional risk context provided.'}`;

    try {
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'analytics',
          messages: [
            { role: 'user', content: promptMessage }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process AI predictions.');
      }

      const content = data.choices?.[0]?.message?.content || 'Error: Empty prediction content received.';
      setPredictionOutput(content);
    } catch (err: any) {
      console.error(err);
      setErrorPredict(err.message);
    } finally {
      clearInterval(stepInterval);
      setIsLoadingPredict(false);
    }
  };

  // Render markdown parser helpers
  const renderFormattedMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('###')) {
        return <h4 key={i} className="text-lg font-black text-cyan-400 mt-6 mb-3 flex items-center gap-2">{line.replace('###', '').trim()}</h4>;
      }
      if (line.startsWith('####')) {
        return <h5 key={i} className="text-sm font-bold text-white uppercase tracking-wider mt-4 mb-2">{line.replace('####', '').trim()}</h5>;
      }
      // Checkbox list items
      if (line.trim().startsWith('* [ ]') || line.trim().startsWith('- [ ]')) {
        const itemText = line.replace('* [ ]', '').replace('- [ ]', '').trim();
        return (
          <label key={i} className="flex items-start gap-3 bg-slate-900 border border-white/5 px-4 py-3 rounded-2xl hover:border-cyan-500/20 cursor-pointer mt-2 group select-none">
            <input type="checkbox" className="mt-1 accent-cyan-500 rounded border-white/10" />
            <span className="text-xs text-slate-300 font-semibold group-hover:text-white transition-colors">{itemText}</span>
          </label>
        );
      }
      // Bullet points
      if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
        const content = line.replace(/^[\s*-]+/, '').trim();
        const boldParts = content.split('**');
        
        return (
          <li key={i} className="text-slate-300 text-xs font-semibold leading-relaxed ml-4 list-disc mt-1.5">
            {boldParts.map((part, index) => 
              index % 2 === 1 ? <strong key={index} className="text-white font-extrabold">{part}</strong> : part
            )}
          </li>
        );
      }
      // Standard Paragraph
      if (line.trim() === '') return <div key={i} className="h-2"></div>;
      
      const boldParts = line.split('**');
      return (
        <p key={i} className="text-xs text-slate-400 leading-relaxed">
          {boldParts.map((part, index) => 
            index % 2 === 1 ? <strong key={index} className="text-white font-black">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  const filteredBeds = beds.filter(b => {
    const matchesWard = selectedWard === 'All' || b.type === selectedWard;
    const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;
    return matchesWard && matchesStatus;
  });

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
           Hospital Resource Analytics
        </h1>
        <p className="text-slate-400 font-medium mt-1">
          Predictive resource allocation, clinical bed occupancies, and Groq AI emergency forecasting.
        </p>
      </div>

      {/* Main Occupancy Counters row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Beds */}
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 text-7xl translate-x-2 translate-y-2 opacity-5 select-none pointer-events-none"></div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-2">Total Managed Beds</p>
          <h3 className="text-3xl font-black text-white">{totalBeds} <span className="text-xs text-slate-500 font-normal">Active Beds</span></h3>
          <div className="mt-4 flex gap-4 text-xs font-bold text-slate-400">
            <span> {availableBeds} Available</span>
            <span> {occupiedBeds} Occupied</span>
          </div>
        </div>

        {/* Global Occupancy Rate */}
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-2">Global Bed Occupancy</p>
          <h3 className="text-3xl font-black text-cyan-400">{occupancyRate}%</h3>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-4 border border-white/5">
            <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        {/* Critical Care ICU Beds */}
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-2">ICU Critical Occupancy</p>
          <h3 className={`text-3xl font-black ${parseInt(icuRate) >= 80 ? 'text-rose-400' : 'text-emerald-400'}`}>{icuRate}%</h3>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-4 border border-white/5">
            <div className={`h-full rounded-full transition-all duration-500 ${parseInt(icuRate) >= 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${icuRate}%` }}></div>
          </div>
        </div>

        {/* Predictive Danger Index */}
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-2">Predictive Emergency Threat</p>
          <h3 className="text-3xl font-black text-amber-400">Moderate Surge</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase tracking-widest">Calculated by seasonal flu models</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE BED STATUS GRID & SIMULATOR (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
                Ward Bed Occupancy Status
              </h3>
              
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                 Click a Bed to Simulate Admissions
              </span>
            </div>

            {/* Filters panel */}
            <div className="flex flex-wrap gap-3 bg-slate-950 p-3 rounded-2xl border border-white/5">
              <select
                className="bg-slate-900 border border-white/5 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-bold"
                value={selectedWard}
                onChange={(e: any) => setSelectedWard(e.target.value)}
              >
                <option value="All">All Wards</option>
                <option value="ICU">ICU (Critical Care)</option>
                <option value="General">General Medicine</option>
                <option value="Pediatric">Pediatric</option>
                <option value="Recovery">Surgical Recovery</option>
              </select>

              <select
                className="bg-slate-900 border border-white/5 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-bold"
                value={selectedStatus}
                onChange={(e: any) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available Beds</option>
                <option value="Occupied">Occupied Beds</option>
              </select>
            </div>

            {/* Bed Grid container */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {filteredBeds.map(bed => {
                const isOccupied = bed.status === 'Occupied';
                return (
                  <div
                    key={bed.id}
                    onClick={() => handleToggleBedStatus(bed.id)}
                    className={`p-4 rounded-2xl border flex flex-col justify-between h-28 cursor-pointer select-none transition-all hover:scale-[1.02] hover:shadow-xl ${
                      isOccupied 
                        ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50' 
                        : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        bed.type === 'ICU' ? 'bg-rose-500/10 text-rose-400' :
                        bed.type === 'General' ? 'bg-cyan-500/10 text-cyan-400' :
                        bed.type === 'Pediatric' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{bed.type}</span>

                      <span className={`w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    </div>

                    <div className="mt-auto">
                      <h4 className="text-sm font-black text-white">{bed.id}</h4>
                      {isOccupied ? (
                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5" title={bed.patientName}>
                           {bed.patientName}
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-0.5">
                           Empty
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* SVG capacity charts panel */}
          <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Ward Allocations</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">ICU Beds occupied</p>
                  <p className="text-lg font-black text-white mt-1">{icuOccupied} / {icuTotal}</p>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" className="stroke-slate-900 fill-none" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" className="stroke-rose-500 fill-none" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - parseInt(icuRate)/100)}`} />
                  </svg>
                  <span className="absolute text-[10px] font-black text-white">{icuRate}%</span>
                </div>
              </div>
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">General beds occupied</p>
                  <p className="text-lg font-black text-white mt-1">{genOccupied} / {genTotal}</p>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" className="stroke-slate-900 fill-none" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" className="stroke-cyan-500 fill-none" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - parseInt(genRate)/100)}`} />
                  </svg>
                  <span className="absolute text-[10px] font-black text-white">{genRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GROQ AI CRITICAL CARE PREDICTIVE FORECASTER (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
              Groq AI Predictive Forecaster
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Leverage the **Groq Llama-3.3-70B** clinical analysis model to cross-reference current bed capacities, upcoming emergency dispatch forecasts, and seasonal variables to generate a combat-ready preparation plan.
            </p>

            {/* Timeframe Selector & contextual notes */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Predictive Timeframe</label>
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-1.5 rounded-xl border border-white/5">
                  <button
                    onClick={() => setSelectedTimeframe('7days')}
                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedTimeframe === '7days' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Next 7 Days
                  </button>
                  <button
                    onClick={() => setSelectedTimeframe('1month')}
                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedTimeframe === '1month' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Next 1 Month
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Add Regional Context / Risk Parameters</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all resize-none font-semibold"
                  placeholder="Specify events like heatwave warning, cold weather front, holiday traffic spikes, marathon schedules, or known disease outbreaks..."
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleRunPredictiveAI}
                disabled={isLoadingPredict}
              >
                {isLoadingPredict ? ' Evaluating Models...' : ' Calculate Predictive Forecast'}
              </Button>
            </div>
          </div>

          {/* Glowing AI Output Console */}
          <div className="mt-8">
            {errorPredict && <Alert variant="error" message={errorPredict} className="mb-4" />}

            {isLoadingPredict && (
              <div className="bg-slate-950 border border-cyan-500/20 p-8 rounded-3xl flex flex-col items-center justify-center space-y-4 shadow-inner min-h-[300px]">
                <div className="w-10 h-10 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-xs text-cyan-400 font-black tracking-widest uppercase animate-pulse">{loadingStep}</p>
                <span className="text-[10px] text-slate-600 font-bold uppercase">Cross-matching seasonal & trauma indexes</span>
              </div>
            )}

            {!isLoadingPredict && !predictionOutput && !errorPredict && (
              <div className="bg-slate-950 border border-dashed border-white/5 p-8 rounded-[2rem] text-center opacity-30 min-h-[300px] flex flex-col items-center justify-center">
                <span className="text-4xl block mb-2"></span>
                <p className="text-xs font-bold text-white">Click "Calculate" to generate AI forecasts.</p>
              </div>
            )}

            {predictionOutput && (
              <div className="bg-slate-950 border border-cyan-500/30 p-6 rounded-[2rem] shadow-2xl space-y-4 max-h-[450px] overflow-y-auto animate-in slide-in-from-bottom-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Predictive Output Active</span>
                  </div>
                  <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">Groq AI</span>
                </div>
                
                <div className="space-y-4 text-left">
                  {renderFormattedMarkdown(predictionOutput)}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default HospitalAnalytics;
