import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

import { useAuthStore } from '../store/authStore';

const FamilyMemberDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'scheduler' | 'emergency'>('feed');

  const [isLoading, setIsLoading] = useState(true);
  const [connectedMembers, setConnectedMembers] = useState<any[]>([]);
  const [upcomingCare, setUpcomingCare] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/family/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setConnectedMembers(data.connectedMembers || []);
          setUpcomingCare(data.upcomingCare || []);
        }
      } catch (error) {
        console.error('Failed to load family dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchDashboard();
  }, [token]);

  if (isLoading) {
    return (
      <div className="p-12 text-slate-400 font-bold italic text-center animate-pulse">
         Connecting to Family Care Network...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <span></span> Family Care Hub
          </h2>
          <p className="text-slate-400 font-medium mt-2 text-lg">
            Monitor, manage, and care for your loved ones from anywhere.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
             Link Family Member
          </Button>
          <Button variant="primary" className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20">
             Trigger Family SOS
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900 border border-white/5 rounded-2xl scrollbar-hide">
        {[
          { id: 'feed', label: 'Linked Member Feed', icon: '' },
          { id: 'scheduler', label: 'Care Scheduler', icon: '' },
          { id: 'emergency', label: 'Emergency Watch', icon: '' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner'
                : 'text-slate-400 hover:bg-white/5 border border-transparent'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'feed' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-black text-white">Linked Member Feed</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {connectedMembers.map((member) => (
                <div key={member.id} className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] hover:border-cyan-500/30 transition-all shadow-xl group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-4xl border border-white/5">
                        {member.avatar}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{member.name}</h4>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{member.relation} • {member.id}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      member.status === 'Admitted' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  
                  <div className="bg-slate-950 rounded-2xl p-4 border border-white/5 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Current Location</span>
                      <span className="text-cyan-400 text-sm font-bold">{member.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Last Update</span>
                      <span className="text-white text-sm">{member.lastUpdate}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-rose-500/5 rounded-xl p-3 border border-rose-500/10 text-center">
                      <p className="text-[10px] text-rose-400/70 font-black uppercase mb-1">Heart</p>
                      <p className="text-rose-400 font-bold">{member.vitals.heartRate} <span className="text-[10px]">bpm</span></p>
                    </div>
                    <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10 text-center">
                      <p className="text-[10px] text-blue-400/70 font-black uppercase mb-1">BP</p>
                      <p className="text-blue-400 font-bold">{member.vitals.bloodPressure}</p>
                    </div>
                    <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 text-center">
                      <p className="text-[10px] text-emerald-400/70 font-black uppercase mb-1">SpO2</p>
                      <p className="text-emerald-400 font-bold">{member.vitals.spo2}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scheduler' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              Family Care Scheduler
              <span className="text-sm font-normal text-slate-400 ml-4 bg-slate-900 px-3 py-1 rounded-full border border-white/5">Manage appointments and medicine reminders</span>
            </h3>
            
            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
              <div className="space-y-4">
                {upcomingCare.map((care) => (
                  <div key={care.id} className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        care.type === 'Medication' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {care.type === 'Medication' ? '' : ''}
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{care.title}</h4>
                        <p className="text-slate-400 text-sm">{care.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{care.status}</span>
                      <Button variant="outline" className="text-xs py-1.5 border-white/10 hover:bg-white/5 text-white">
                        {care.type === 'Medication' ? 'Mark Taken' : 'Reschedule'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                  + Add New Reminder or Appointment
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <h3 className="text-2xl font-black text-white flex items-center gap-2">
              Emergency Watch
              <span className="text-sm font-normal text-slate-400 ml-4 bg-slate-900 px-3 py-1 rounded-full border border-white/5">Live tracking during emergency alerts</span>
            </h3>

            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 text-center shadow-xl">
               <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border border-emerald-500/20">
                 
               </div>
               <h4 className="text-2xl font-bold text-white mb-2">All Clear</h4>
               <p className="text-slate-400 max-w-md mx-auto mb-8">
                 None of your linked family members currently have an active SOS alert or are in ambulance transit.
               </p>
               
               <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl inline-block text-left">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Test Emergency Tracking</p>
                  <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 w-full">
                    Simulate Transit View
                  </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyMemberDashboard;
