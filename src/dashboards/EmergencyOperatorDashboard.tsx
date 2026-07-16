import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchActiveEmergencies, fetchAmbulances, updateEmergencyStatus } from '../services/emergencyService';

const EmergencyOperatorDashboard: React.FC = () => {
  const { token, userProfile } = useAuthStore();
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);

  useEffect(() => {
    if (token) {
      loadData();
      const interval = setInterval(loadData, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [token]);

  const loadData = async () => {
    try {
      const [emData, ambData] = await Promise.all([
        fetchActiveEmergencies(token!),
        fetchAmbulances(token!)
      ]);
      setEmergencies(emData);
      setAmbulances(ambData);
    } catch (error) {
      console.error('Failed to load emergency data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatch = async (emergencyId: string, ambulanceId: string) => {
    try {
      await updateEmergencyStatus(token!, emergencyId, 'DISPATCHED', ambulanceId);
      loadData();
      setSelectedEmergency(null);
    } catch (error) {
      alert('Dispatch failed');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-white p-6 gap-8 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
            </span>
            SOS Command Center
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Active Emergency Monitoring</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-slate-900 border border-white/5 px-6 py-3 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Alerts</span>
              <span className="text-2xl font-black text-rose-500">{emergencies.filter(e => e.status === 'PENDING').length}</span>
           </div>
           <div className="bg-slate-900 border border-white/5 px-6 py-3 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fleet Ready</span>
              <span className="text-2xl font-black text-emerald-500">{ambulances.length}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Alerts List */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-hidden">
           <h2 className="text-xl font-black flex items-center gap-3">
             <span className="w-2 h-8 bg-rose-600 rounded-full"></span>
             Priority Alerts
           </h2>
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="p-12 text-center opacity-20 font-black italic">SCANNING NETWORK...</div>
              ) : emergencies.length === 0 ? (
                <div className="p-12 bg-slate-900/50 rounded-[2.5rem] border border-white/5 text-center opacity-30">
                   <p className="text-5xl mb-4"></p>
                   <p className="font-bold">No Active Emergencies</p>
                   <p className="text-xs mt-2 tracking-widest uppercase">System Secure</p>
                </div>
              ) : (
                emergencies.map(em => (
                  <button 
                    key={em.id}
                    onClick={() => setSelectedEmergency(em)}
                    className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all group ${
                      selectedEmergency?.id === em.id 
                        ? 'bg-rose-600/10 border-rose-500 shadow-[0_0_40px_-10px_rgba(225,29,72,0.3)]' 
                        : 'bg-slate-900 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                         em.status === 'PENDING' ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-600 text-white'
                       }`}>
                         {em.status}
                       </span>
                       <span className="text-[10px] text-slate-500 font-bold">{new Date(em.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-rose-400 transition-colors">
                      {em.patient?.patientProfile?.fullName || 'Anonymous Patient'}
                    </h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
                      {em.patient?.patientProfile?.bloodGroup ? `Blood: ${em.patient.patientProfile.bloodGroup}` : 'Blood Type Unknown'}
                    </p>
                    <div className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                       <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                       GPS: {em.latitude.toFixed(4)}, {em.longitude.toFixed(4)}
                    </div>
                  </button>
                ))
              )}
           </div>
        </div>

        {/* Dispatch Console */}
        <div className="lg:col-span-7 bg-slate-900 rounded-[3rem] border border-white/5 p-8 flex flex-col shadow-inner overflow-hidden">
           {selectedEmergency ? (
             <div className="flex flex-col h-full animate-in slide-in-from-right duration-500">
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-8">
                   <div>
                      <h3 className="text-3xl font-black mb-2 text-rose-500">Emergency Details</h3>
                      <p className="text-slate-400 font-medium">Patient: <span className="text-white">{selectedEmergency.patient?.patientProfile?.fullName}</span></p>
                   </div>
                   <button 
                    onClick={() => setSelectedEmergency(null)}
                    className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest"
                   >
                     Close Panel
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                   <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Location Data</p>
                      <p className="text-lg font-bold">Lat: {selectedEmergency.latitude}</p>
                      <p className="text-lg font-bold">Lng: {selectedEmergency.longitude}</p>
                   </div>
                   <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Medical Notes</p>
                      <p className="text-sm font-medium text-slate-300 italic">"{selectedEmergency.description || 'No description provided'}"</p>
                   </div>
                </div>

                <h4 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Available Units for Dispatch</h4>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                   {ambulances.length === 0 ? (
                     <p className="p-8 text-center text-rose-400 font-bold bg-rose-500/10 rounded-3xl border border-rose-500/20">NO UNITS AVAILABLE IN THIS SECTOR</p>
                   ) : (
                     ambulances.map(amb => (
                       <div key={amb.id} className="bg-black/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl border border-emerald-500/20"></div>
                             <div>
                                <h5 className="text-lg font-bold group-hover:text-emerald-400 transition-colors">
                                   {amb.ambulanceDriverProfile?.fullName || 'Ambulance Driver'}
                                </h5>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                                   {amb.ambulanceDriverProfile?.vehicleType} • {amb.ambulanceDriverProfile?.ambulanceRegNumber}
                                </p>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleDispatch(selectedEmergency.id, amb.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/10 transition-all active:scale-95"
                          >
                            Dispatch Unit
                          </button>
                       </div>
                     ))
                   )}
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center text-8xl mb-8 animate-[spin_20s_linear_infinite]">
                  
                </div>
                <h3 className="text-3xl font-black">Waiting for Incoming SOS</h3>
                <p className="mt-2 tracking-widest uppercase text-xs font-bold">All systems nominal</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyOperatorDashboard;
