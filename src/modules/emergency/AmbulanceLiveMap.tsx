import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';

type DriverStatus = 'available' | 'on_duty' | 'offline';
type RequestStatus = 'pending' | 'accepted' | 'enroute' | 'completed';

interface EmergencyRequest {
  id: string;
  patient: string;
  location: string;
  distance: string;
  priority: 'critical' | 'high' | 'medium';
  time: string;
}

const MOCK_REQUESTS: EmergencyRequest[] = [
  { id: 'SOS-001', patient: 'John Doe', location: '456 Main St, Apt 2B', distance: '1.2 km', priority: 'critical', time: '2 min ago' },
  { id: 'SOS-002', patient: 'Anonymous', location: 'Central Park, Gate 3', distance: '3.4 km', priority: 'high', time: '5 min ago' },
];

const AmbulanceLiveMap: React.FC = () => {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('available');
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('pending');
  const [eta, setEta] = useState(8);

  // Simulate countdown when en route
  useEffect(() => {
    if (requestStatus === 'enroute' && eta > 0) {
      const t = setTimeout(() => setEta(e => e - 1), 3000);
      return () => clearTimeout(t);
    }
  }, [requestStatus, eta]);

  const acceptRequest = (req: EmergencyRequest) => {
    setActiveRequest(req);
    setRequestStatus('accepted');
    setDriverStatus('on_duty');
  };

  const startNavigation = () => setRequestStatus('enroute');

  const completeRun = () => {
    setActiveRequest(null);
    setRequestStatus('pending');
    setDriverStatus('available');
    setEta(8);
  };

  const priorityColor: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  };

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl"></span> Live Dispatch & Navigation
          </h1>
          <p className="text-gray-400 mt-1">Receive emergency requests and navigate with real-time GPS routing.</p>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1.5">
          {(['available', 'offline'] as DriverStatus[]).map(s => (
            <button
              key={s}
              onClick={() => !activeRequest && setDriverStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                driverStatus === s
                  ? s === 'available' ? 'bg-green-600 text-white' : 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {s === 'available' ? ' Available' : ' Offline'}
            </button>
          ))}
          {driverStatus === 'on_duty' && (
            <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white"> On Duty</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Simulated Map */}
        <div className="lg:col-span-2 relative bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center">
          {/* Fake map grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(#4a9eff 1px, transparent 1px), linear-gradient(90deg, #4a9eff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {requestStatus === 'enroute' && activeRequest ? (
            <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-4xl animate-pulse">
                
              </div>
              <div>
                <p className="text-gray-400 text-sm">Navigating to</p>
                <p className="text-white font-bold text-xl mt-1">{activeRequest.location}</p>
              </div>
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl px-8 py-5 flex gap-10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{eta}</p>
                  <p className="text-xs text-gray-400 mt-1">min ETA</p>
                </div>
                <div className="border-l border-gray-700" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{activeRequest.distance}</p>
                  <p className="text-xs text-gray-400 mt-1">away</p>
                </div>
              </div>
              <Button variant="primary" onClick={completeRun}>Mark as Completed </Button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-3 opacity-50">
              <span className="text-5xl"></span>
              <p className="text-gray-400 font-medium">Live map will appear when you accept a request</p>
            </div>
          )}
        </div>

        {/* Requests Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">
              {activeRequest ? ' Active Dispatch' : ` Incoming Requests (${MOCK_REQUESTS.length})`}
            </h2>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {activeRequest ? (
              <div className="space-y-4">
                <div className={`border rounded-xl p-4 ${priorityColor[activeRequest.priority]}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase">{activeRequest.priority} Priority</span>
                    <span className="text-xs opacity-70">{activeRequest.id}</span>
                  </div>
                  <p className="text-white font-semibold">{activeRequest.patient}</p>
                  <p className="text-sm opacity-80 mt-1"> {activeRequest.location}</p>
                </div>

                {requestStatus === 'accepted' && (
                  <Button variant="primary" fullWidth onClick={startNavigation}>
                     Start Navigation
                  </Button>
                )}
              </div>
            ) : driverStatus === 'offline' ? (
              <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                <span className="text-3xl mb-2"></span>
                <p className="text-gray-400 text-sm">You are offline. Go Available to receive requests.</p>
              </div>
            ) : (
              MOCK_REQUESTS.map((req) => (
                <div key={req.id} className={`border rounded-xl p-4 ${priorityColor[req.priority]}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{req.priority}</span>
                    <span className="text-xs opacity-70">{req.time}</span>
                  </div>
                  <p className="text-white font-semibold mb-0.5">{req.patient}</p>
                  <p className="text-sm opacity-80 mb-1"> {req.location}</p>
                  <p className="text-sm font-semibold mb-3">{req.distance} away</p>
                  <Button variant="primary" fullWidth onClick={() => acceptRequest(req)}>
                    Accept Dispatch
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Trip Stats */}
          <div className="border-t border-gray-800 p-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Today', value: '3' },
              { label: 'Avg ETA', value: '7m' },
              { label: 'Rating', value: '4.9⭐' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-white font-bold">{stat.value}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AmbulanceLiveMap;
