// ============================================================
// PULSEGRID — PRESCRIPTION FULFILLMENT PAGE
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

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
  medicines: string; // JSON string
  counselingNotes: string | null;
  status: 'PENDING' | 'VALIDATED' | 'DISPENSED';
  createdAt: string;
}

const PharmacyPrescriptionsPage: React.FC = () => {
  const { token } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [counselingNotesInput, setCounselingNotesInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'VALIDATED' | 'DISPENSED'>('ALL');

  const fetchFulfillmentData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Prescriptions
      const rxRes = await fetch('http://localhost:4000/api/pharmacist/prescriptions', { headers });
      const rxData = rxRes.ok ? await rxRes.json() : [];

      // Inventory (for stock checks)
      const invRes = await fetch('http://localhost:4000/api/pharmacist/inventory', { headers });
      const invData = invRes.ok ? await invRes.json() : { medicines: [] };

      setPrescriptions(rxData);
      setMedicines(invData.medicines || []);

      if (selectedPrescription) {
        const fresh = rxData.find((r: Prescription) => r.id === selectedPrescription.id);
        if (fresh) setSelectedPrescription(fresh);
      }
    } catch (error) {
      console.error('Failed to sync prescription fulfillment data:', error);
      setErrorMsg('Fulfillment Network offline. Please retry or contact technical desk.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFulfillmentData();
    }
  }, [token]);

  const handleValidatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescription) return;

    try {
      const response = await fetch(`http://localhost:4000/api/pharmacist/prescriptions/${selectedPrescription.id}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ counselingNotes: counselingNotesInput })
      });

      if (response.ok) {
        setCounselingNotesInput('');
        await fetchFulfillmentData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to validate prescription');
      }
    } catch (err) {
      alert('Network error validating prescription');
    }
  };

  const handleDispensePrescription = async (prescriptionId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/pharmacist/prescriptions/${prescriptionId}/dispense`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchFulfillmentData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to dispense prescription');
      }
    } catch (err) {
      alert('Network error dispensing prescription');
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (filterStatus === 'ALL') return true;
    return rx.status === filterStatus;
  });

  if (isLoading && prescriptions.length === 0) {
    return (
      <div className="p-12 text-slate-400 font-bold italic text-center animate-pulse">
         Accessing Prescription Fulfillment Center...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2.5">
            <span></span> Prescription Fulfillment Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Validate e-prescriptions, verify drug-drug interactions, and log patient counseling parameters.
          </p>
        </div>
        <Button
          onClick={fetchFulfillmentData}
          className="bg-slate-900 border border-white/5 text-slate-300 hover:bg-slate-800 text-xs font-black uppercase px-4 py-2.5 rounded-xl"
        >
           Refresh Queue
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold animate-fade-in">
           {errorMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-900/50 border border-white/5 rounded-xl w-fit">
        {(['ALL', 'PENDING', 'VALIDATED', 'DISPENSED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all ${
              filterStatus === status
                ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Main Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescription Queue */}
        <div className="lg:col-span-1">
          <Card className="rounded-[2rem] bg-slate-950/40 border border-white/5 p-5">
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">Prescription Queue ({filteredPrescriptions.length})</h3>
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredPrescriptions.map((rx) => {
                const parsedMeds = JSON.parse(rx.medicines) as PrescriptionItem[];
                const hasControlled = parsedMeds.some(m => m.isControlled);

                return (
                  <div
                    key={rx.id}
                    onClick={() => {
                      setSelectedPrescription(rx);
                      setCounselingNotesInput(rx.counselingNotes || '');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedPrescription?.id === rx.id
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/5 bg-slate-900/40 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-emerald-400">
                        Rx: {rx.id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg ${
                        rx.status === 'DISPENSED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                          : rx.status === 'VALIDATED'
                          ? 'bg-blue-950 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/20 animate-pulse'
                      }`}>
                        {rx.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{rx.patientName}</p>
                    <p className="text-xs text-slate-400">Physician: {rx.doctorName}</p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {parsedMeds.length} Regimen(s)
                      </span>
                      {hasControlled && (
                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                           Controlled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredPrescriptions.length === 0 && (
                <div className="text-center py-8 text-slate-500 italic text-xs">
                  No prescriptions found matching filter.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Verification and Validation Board */}
        <div className="lg:col-span-2">
          {selectedPrescription ? (
            <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 space-y-6">
              {/* Profile */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded">
                    E-Prescription ID: {selectedPrescription.id}
                  </span>
                  <h3 className="text-xl font-black text-white mt-3">Patient: {selectedPrescription.patientName}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Authorized Prescriber: <span className="text-emerald-400">{selectedPrescription.doctorName}</span> • Issued: {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-4xl"></span>
              </div>

              {/* Regimens list */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Regimen Checklist</h4>
                <div className="space-y-3">
                  {(JSON.parse(selectedPrescription.medicines) as PrescriptionItem[]).map((med, idx) => {
                    const dbMatch = medicines.find(m => m.name.toLowerCase().includes(med.name.toLowerCase()));
                    const isLow = dbMatch ? dbMatch.stock <= dbMatch.minStock : true;

                    return (
                      <div key={idx} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{med.name}</span>
                            {med.isControlled && (
                              <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                Controlled Schedule H
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            Dosage: <span className="text-white">{med.dosage}</span> | Frequency: <span className="text-cyan-400 font-bold">{med.frequency}</span>
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end justify-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Pharmacy Stock</span>
                          <span className={`text-xs font-black ${
                            !dbMatch || dbMatch.stock === 0
                              ? 'text-red-400'
                              : isLow
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {dbMatch ? `${dbMatch.stock} units` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interaction Warnings */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Drug Interaction Checks</h4>
                {(() => {
                  const parsed = JSON.parse(selectedPrescription.medicines) as PrescriptionItem[];
                  const warnings = parsed.filter(m => m.interactionWarnings && m.interactionWarnings !== 'None');

                  if (warnings.length > 0) {
                    return (
                      <div className="space-y-2">
                        {warnings.map((w, idx) => (
                          <div key={idx} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-400">
                            <span className="text-xl"></span>
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider">Clinical Warning: {w.name}</p>
                              <p className="text-xs mt-1 leading-relaxed text-slate-300">{w.interactionWarnings}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-400 text-xs flex gap-3 items-center">
                      <span></span>
                      <span className="font-bold">Automated Drug-Drug Interaction analysis complete. 0 contraindications flagged.</span>
                    </div>
                  );
                })()}
              </div>

              {/* Counseling and validations */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                {selectedPrescription.status === 'PENDING' ? (
                  <form onSubmit={handleValidatePrescription} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Patient Counseling Notes</label>
                      <textarea
                        value={counselingNotesInput}
                        onChange={(e) => setCounselingNotesInput(e.target.value)}
                        rows={3}
                        placeholder="Log instructions (e.g. avoid dairy, drink plenty of water, take post-meals)..."
                        className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl w-full">
                       Validate Prescription & Record Notes
                    </Button>
                  </form>
                ) : selectedPrescription.status === 'VALIDATED' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-500">Counseling Notes Registered</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-mono">{selectedPrescription.counselingNotes}</p>
                    </div>
                    <Button
                      onClick={() => handleDispensePrescription(selectedPrescription.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl w-full"
                    >
                       Dispense & Synchronize Ledger
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center text-emerald-400 text-xs font-black uppercase tracking-wider">
                       Prescription Filled, Dispensed & Accounted
                    </div>
                    {selectedPrescription.counselingNotes && (
                      <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 text-xs text-slate-300">
                        <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Counseling Instructions Dispatched</span>
                        {selectedPrescription.counselingNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="bg-slate-950/20 border border-dashed border-white/5 rounded-[2.5rem] p-12 text-center text-slate-500 italic text-sm">
              Select an e-prescription from the left queue to verify details and dispense.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyPrescriptionsPage;
