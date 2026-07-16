// ============================================================
// PULSEGRID — AMBULANCE REQUESTS QUEUE TERMINAL
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveEmergencies, updateEmergencyStatus } from '../../services/emergencyService';
import DashboardWidget from '../../components/ui/DashboardWidget';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export const AmbulanceRequests: React.FC = () => {
  const { token, userProfile } = useAuthStore();
  const navigate = useNavigate();

  // Duty Availability
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const cached = localStorage.getItem('cg_ambulance_duty');
    return cached === 'true';
  });

  // Emergency queues
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [hasActiveRoute, setHasActiveRoute] = useState(false);

  // Cache duty state changes
  const handleToggleDuty = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    localStorage.setItem('cg_ambulance_duty', nextState.toString());
  };

  // Poll active emergencies (Only when ONLINE)
  useEffect(() => {
    if (!token || !isOnline) return;

    const syncRequests = async () => {
      try {
        const list = await fetchActiveEmergencies(token);
        
        // Find if this driver already has an active route
        const activeAssigned = list.some(
          (req: any) => req.status === 'DISPATCHED' && req.ambulanceId === userProfile?.id
        );
        setHasActiveRoute(activeAssigned);

        // Filter for pending alerts in the queue
        const pending = list.filter((req: any) => req.status === 'PENDING');
        setEmergencies(pending);
      } catch (err) {
        console.error('Failed to sync incoming requests:', err);
      }
    };

    syncRequests();
    const interval = setInterval(syncRequests, 3500);

    return () => clearInterval(interval);
  }, [token, userProfile, isOnline]);

  // Accept a dispatch request
  const handleAcceptRequest = async (id: string) => {
    if (!token) return;

    try {
      await updateEmergencyStatus(token, id, 'DISPATCHED', userProfile?.id);
      
      // Auto-route driver directly to the Tactical Navigation Map page
      alert(' Incident Accepted! Initiating tactical mapping and navigation routing.');
      navigate('/ambulance/map');
    } catch (err) {
      console.error('Failed to accept request:', err);
      alert('Failed to accept emergency dispatch request. Please check connection.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6 text-slate-100 animate-fade-in">
      {/* Roster Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
             SOS Dispatch Alerts Terminal
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Unit: <span className="font-mono text-cyan-400 font-bold">AMB-402</span> | Attending Paramedic: <span className="text-slate-300 font-bold">{userProfile?.displayName || 'Driver Team'}</span>
          </p>
        </div>

        {/* Work status switch */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-bold">
            {isOnline ? ' ON-DUTY (ONLINE)' : ' STANDBY (OFFLINE)'}
          </span>
          <button
            onClick={handleToggleDuty}
            className={`w-14 h-8 rounded-full p-1 transition-all ${
              isOnline ? 'bg-cyan-500' : 'bg-slate-800 border border-white/5'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                isOnline ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardWidget
          title="Incoming SOS Alerts"
          value={isOnline ? emergencies.length.toString() : '--'}
          icon=""
          iconColor="text-rose-500"
        />
        <DashboardWidget
          title="Active Navigation Routing"
          value={hasActiveRoute ? 'ACTIVE' : 'NONE'}
          icon=""
          iconColor="text-cyan-400"
        />
        <DashboardWidget
          title="Response Zone Sector"
          value="METRO SECTOR-4"
          icon=""
          iconColor="text-emerald-400"
        />
      </div>

      {/* Duty Status Router Container */}
      {!isOnline ? (
        /* OFFLINE PANEL */
        <div className="bg-slate-950/40 border border-white/5 p-12 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto shadow-md">
          <span className="text-5xl animate-pulse"></span>
          <h3 className="text-lg font-black text-white font-extrabold">Terminal Standby (Offline)</h3>
          <p className="text-xs text-slate-400 max-w-sm font-semibold leading-relaxed">
            You are currently offline. Polling networks are suspended and GPS telemetry remains unbroadcasted.
          </p>
          <Button
            onClick={handleToggleDuty}
            className="bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg active:scale-95"
          >
             Go Online & Start Duty
          </Button>
        </div>
      ) : (
        /* ONLINE PANELS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {hasActiveRoute && (
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-5 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                     Active Routing in Progress
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold">
                    You have an assigned emergency currently active. Proceed to the navigation tactical map to view routing and telemetry.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/ambulance/map')}
                  className="bg-cyan-600 hover:bg-cyan-500 text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-md active:scale-95 flex-shrink-0"
                >
                  Go to Map 
                </Button>
              </div>
            )}

            <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                <span></span> Active SOS Requests Queue
              </h3>
              
              {emergencies.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/5 rounded-3xl">
                  <span className="text-4xl mb-4"></span>
                  <h4 className="text-white font-bold text-sm">No Active Emergency Alarms</h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-xs font-semibold">
                    Standby status. The sector is secure. Keep this console open to receive immediate trauma updates.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emergencies.map((req) => (
                    <div key={req.id} className="p-5 bg-rose-950/15 border border-rose-500/20 rounded-2xl hover:border-rose-500/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-500/20 rounded-lg text-[9px] font-black tracking-widest uppercase">
                            CRITICAL SOS
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">
                            TICKET: {req.id.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-white font-black text-base">Acute Patient Trauma Alarm</h4>
                        <p className="text-xs text-cyan-400 font-mono font-semibold">
                          Coords: {req.latitude.toFixed(5)}, {req.longitude.toFixed(5)}
                        </p>
                        <p className="text-xs text-slate-300 font-medium italic">
                          "{req.description || 'No symptoms or details specified by patient.'}"
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={hasActiveRoute}
                        className="bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider py-3 px-5 rounded-xl shadow-lg active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Accept Dispatch 
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Telemetry info */}
          <div className="space-y-4 lg:col-span-1">
            <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Unit Standby Details</h3>
              <div className="space-y-3 font-semibold">
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">HQ Base Station</span>
                  <span className="text-xs text-white font-bold">Princeton Hospital HQ</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Dispatch System</span>
                  <span className="text-xs text-emerald-400 font-black">OPERATIONAL </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceRequests;
