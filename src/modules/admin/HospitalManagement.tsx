// ============================================================
// PULSEGRID — HEALTHCARE NETWORKS OPERATIONS MANAGEMENT
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

interface HospitalNode {
  id: string;
  userId: string;
  name: string;
  adminName: string;
  email: string;
  phone: string;
  regNumber: string;
  type: string;
  beds: number;
  icu: number;
  address: string;
  region: string;
  status: 'Active' | 'Offline';
}

export const HospitalManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [hospitals, setHospitals] = useState<HospitalNode[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Modals visibility state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form states
  const [newHospital, setNewHospital] = useState({
    fullName: '',
    email: '',
    phone: '',
    hospitalName: '',
    hospitalRegNumber: '',
    hospitalType: 'Public',
    numberOfBeds: 150,
    icuCapacity: 15,
    address: ''
  });

  const [selectedHospitalForBalance, setSelectedHospitalForBalance] = useState<HospitalNode | null>(null);
  const [balanceForm, setBalanceForm] = useState({
    numberOfBeds: 0,
    icuCapacity: 0
  });

  const [transferForm, setTransferForm] = useState({
    fromHospital: '',
    toHospital: '',
    patientName: '',
    priority: 'HIGH'
  });

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Fetch real-world hospital nodes from database
  const fetchHospitals = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/admin/hospitals', {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setHospitals(data as HospitalNode[]);
      }
    } catch (err) {
      console.error('Failed to load healthcare network nodes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [token]);

  // Dynamic Trigger to notify Admin audit ledger and Toast
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // 2. Add New Hospital Node (Real DB Write)
  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospital.email || !newHospital.hospitalName || !newHospital.hospitalRegNumber) {
      triggerToast(' Please enter all required fields.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/hospitals', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newHospital)
      });

      if (response.ok) {
        triggerToast(` Registered hospital "${newHospital.hospitalName}" successfully!`);
        setIsAddModalOpen(false);
        // Reset form
        setNewHospital({
          fullName: '',
          email: '',
          phone: '',
          hospitalName: '',
          hospitalRegNumber: '',
          hospitalType: 'Public',
          numberOfBeds: 150,
          icuCapacity: 15,
          address: ''
        });
        fetchHospitals();
      } else {
        const errData = await response.json();
        triggerToast(` Error: ${errData.error || 'Failed to register node'}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Network connection error.');
    }
  };

  // 3. Resource Bed Capacity Balancing (Real DB Write)
  const handleBalanceResources = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalForBalance) return;

    try {
      const response = await fetch('http://localhost:4000/api/admin/hospitals/balance', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          profileId: selectedHospitalForBalance.id,
          numberOfBeds: balanceForm.numberOfBeds,
          icuCapacity: balanceForm.icuCapacity
        })
      });

      if (response.ok) {
        triggerToast(` Balanced bed resources for "${selectedHospitalForBalance.name}".`);
        setIsBalanceModalOpen(false);
        fetchHospitals();
      } else {
        triggerToast(' Resource rebalancing failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Dispatch Cross-Hospital Transfer (Real Audit Write)
  const handleTransferPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromHospital || !transferForm.toHospital || !transferForm.patientName) {
      triggerToast(' Please select both hospitals and type patient name.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/hospitals/transfer', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(transferForm)
      });

      if (response.ok) {
        triggerToast(` Dispatched cross-hospital transfer for patient ${transferForm.patientName}!`);
        setIsTransferModalOpen(false);
        setTransferForm({
          fromHospital: '',
          toHospital: '',
          patientName: '',
          priority: 'HIGH'
        });
      } else {
        triggerToast(' Transfer request rejected.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter hospitals based on regional selection
  const filteredHospitals = selectedRegion === 'All'
    ? hospitals
    : hospitals.filter(h => h.region === selectedRegion);

  // Collect regions list
  const regionsList = ['All', 'Northeast Division', 'West Coast Division', 'Southern Division', 'Midwest Division', 'Rural Division A'];

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto text-slate-100 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-950 border border-cyan-500/30 rounded-2xl px-5 py-3.5 text-white shadow-2xl animate-fade-in font-bold text-xs">
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl"></span> Healthcare Networks Command
          </h1>
          <p className="text-slate-400 mt-1 font-semibold text-xs">
            Manage clinic nodes, balance regional intensive ICU resources, and dispatch clinical emergency transfers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/20 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
          >
             Cross-Hospital Transfer
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
             Register Hospital Chain
          </button>
        </div>
      </div>

      {/* Global Capacities Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Node Clinics', value: hospitals.length, color: 'text-cyan-400' },
          { label: 'Total Emergency Beds', value: hospitals.reduce((acc, curr) => acc + curr.beds, 0), color: 'text-white' },
          { label: 'Total ICU Space Units', value: hospitals.reduce((acc, curr) => acc + curr.icu, 0), color: 'text-white' },
          { label: 'Operational Networks', value: Array.from(new Set(hospitals.map(h => h.region))).length, color: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 shadow-lg font-semibold">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-[10px] mt-1 block font-black uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Regions Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
        {regionsList.map((reg) => (
          <button
            key={reg}
            onClick={() => setSelectedRegion(reg)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
              selectedRegion === reg
                ? 'bg-cyan-950 text-cyan-400 border-cyan-500/20 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* Hospital Nodes Grid */}
      {isLoading ? (
        <div className="text-center p-12 text-slate-400 font-bold italic">
           Querying Healthcare Network nodes from SQLite DB...
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-md">
          <span className="text-4xl"></span>
          <h3 className="text-white font-black text-sm">No Regional Nodes Registered</h3>
          <p className="text-slate-500 text-xs font-semibold max-w-xs leading-relaxed">
            There are no clinical network systems registered under the selected region query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {filteredHospitals.map((h) => (
            <div key={h.id} className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 space-y-5 hover:border-cyan-500/20 transition-all shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                {/* Hospital Identification */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white leading-tight">{h.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-wider">{h.regNumber}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    h.status === 'Active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border border-white/5'
                  }`}>
                    {h.status}
                  </span>
                </div>

                {/* Region Tag */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-slate-950 text-cyan-400 border border-cyan-500/10 rounded-lg text-[9px] font-black uppercase tracking-wider">
                     {h.region}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                     {h.type}
                  </span>
                </div>

                <hr className="border-white/5" />

                {/* Capacity indicators */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5 text-xs font-semibold">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-black">Beds Capacity</span>
                    <span className="text-white font-bold flex items-center gap-1.5">
                       {h.beds} Total Beds
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-black">ICU Support</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                       {h.icu} ICU Beds
                    </span>
                  </div>
                </div>

                {/* Contact detail */}
                <div className="text-xs text-slate-400 font-semibold space-y-1 bg-slate-950/10 p-3 rounded-xl border border-white/5 font-mono">
                  <div> Clinical Chief: <span className="text-slate-200">{h.adminName}</span></div>
                  <div> Secure Email: <span className="text-slate-200">{h.email}</span></div>
                  <div> Secure Hotline: <span className="text-slate-200">{h.phone}</span></div>
                  <div> Location Address: <span className="text-slate-300 font-sans block mt-1 leading-relaxed">{h.address}</span></div>
                </div>
              </div>

              {/* Adjust capacity resource balancing */}
              <button
                onClick={() => {
                  setSelectedHospitalForBalance(h);
                  setBalanceForm({ numberOfBeds: h.beds, icuCapacity: h.icu });
                  setIsBalanceModalOpen(true);
                }}
                className="w-full mt-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/5"
              >
                 Balance Bed Capacities
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ADD HOSPITAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in text-xs font-semibold">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-white">Register Healthcare Node</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Initialize a new administrative node into PulseGrid DB.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white text-base font-bold">×</button>
            </div>

            <form onSubmit={handleAddHospital} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Hospital Chain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Princeton-Plainsboro Teaching Hospital"
                  value={newHospital.hospitalName}
                  onChange={e => setNewHospital({...newHospital, hospitalName: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Reg License Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REG-987654"
                    value={newHospital.hospitalRegNumber}
                    onChange={e => setNewHospital({...newHospital, hospitalRegNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Node Type</label>
                  <select
                    value={newHospital.hospitalType}
                    onChange={e => setNewHospital({...newHospital, hospitalType: e.target.value})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                    <option value="Charity">Charity / Rural NGO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Emergency Bed capacity</label>
                  <input
                    type="number"
                    value={newHospital.numberOfBeds}
                    onChange={e => setNewHospital({...newHospital, numberOfBeds: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">ICU capacity</label>
                  <input
                    type="number"
                    value={newHospital.icuCapacity}
                    onChange={e => setNewHospital({...newHospital, icuCapacity: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-4">
                <h4 className="text-[10px] text-cyan-400 uppercase tracking-widest font-black">Chief Administrator Profile</h4>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Admin Chief"
                    value={newHospital.fullName}
                    onChange={e => setNewHospital({...newHospital, fullName: e.target.value})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Secure Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. chief@hospital.com"
                      value={newHospital.email}
                      onChange={e => setNewHospital({...newHospital, email: e.target.value})}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Hotline Phone</label>
                    <input
                      type="text"
                      placeholder="555-123-456"
                      value={newHospital.phone}
                      onChange={e => setNewHospital({...newHospital, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Address Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 456 Clinical Blvd, San Francisco, CA"
                  value={newHospital.address}
                  onChange={e => setNewHospital({...newHospital, address: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                >
                  Register Node 
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOURCE REBALANCING MODAL */}
      {isBalanceModalOpen && selectedHospitalForBalance && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] max-w-sm w-full p-6 space-y-6 shadow-2xl animate-fade-in text-xs font-semibold">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-white"> Resource Balancing</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedHospitalForBalance.name}</p>
              </div>
              <button onClick={() => setIsBalanceModalOpen(false)} className="text-slate-500 hover:text-white text-base font-bold">×</button>
            </div>

            <form onSubmit={handleBalanceResources} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Emergency Beds</label>
                <input
                  type="number"
                  value={balanceForm.numberOfBeds}
                  onChange={e => setBalanceForm({...balanceForm, numberOfBeds: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">ICU Support Beds</label>
                <input
                  type="number"
                  value={balanceForm.icuCapacity}
                  onChange={e => setBalanceForm({...balanceForm, icuCapacity: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                >
                  Apply Balance 
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CROSS-HOSPITAL TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] max-w-sm w-full p-6 space-y-6 shadow-2xl animate-fade-in text-xs font-semibold">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-white"> Cross-Hospital Transfer</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Initiate critical transfer between regional medical centers.</p>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-500 hover:text-white text-base font-bold">×</button>
            </div>

            <form onSubmit={handleTransferPatient} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bruce Wayne"
                  value={transferForm.patientName}
                  onChange={e => setTransferForm({...transferForm, patientName: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Origin Center *</label>
                <select
                  required
                  value={transferForm.fromHospital}
                  onChange={e => setTransferForm({...transferForm, fromHospital: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                >
                  <option value="">Select Origin...</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.name}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Destination Center *</label>
                <select
                  required
                  value={transferForm.toHospital}
                  onChange={e => setTransferForm({...transferForm, toHospital: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                >
                  <option value="">Select Destination...</option>
                  {hospitals.filter(h => h.name !== transferForm.fromHospital).map(h => (
                    <option key={h.id} value={h.name}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Triage Priority</label>
                <select
                  value={transferForm.priority}
                  onChange={e => setTransferForm({...transferForm, priority: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                >
                  <option value="CRITICAL"> CRITICAL RED</option>
                  <option value="HIGH"> HIGH YELLOW</option>
                  <option value="MEDIUM"> STABLE GREEN</option>
                </select>
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                >
                  Dispatch Transfer 
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagement;
