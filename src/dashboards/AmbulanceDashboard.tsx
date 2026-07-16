// ============================================================
// PULSEGRID — PREMIUM AMBULANCE DRIVER COMMAND DASHBOARD
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { fetchActiveEmergencies, updateEmergencyStatus } from '../services/emergencyService';
import DashboardWidget from '../components/ui/DashboardWidget';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const SOCKET_URL = 'http://localhost:4000';
const DEFAULT_AMBULANCE_COORDS: [number, number] = [40.3481, -74.6471]; // Princeton Hospital HQ Standby

export const AmbulanceDashboard: React.FC = () => {
  const { token, userProfile } = useAuthStore();

  // Duty Status (Online/Offline)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const cached = localStorage.getItem('cg_ambulance_duty');
    return cached === 'true';
  });

  // Navigation / Queue separation tabs
  const [activePanel, setActivePanel] = useState<'requests' | 'navigation'>('requests');

  // Emergency & Telemetry states
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<any | null>(null);
  const [ambulanceCoords, setAmbulanceCoords] = useState<[number, number]>(DEFAULT_AMBULANCE_COORDS);
  const [patientCoords, setPatientCoords] = useState<[number, number] | null>(null);

  // Completed missions tally
  const [completedCount, setCompletedCount] = useState<number>(() => {
    const saved = localStorage.getItem('cg_completed_missions');
    return saved ? parseInt(saved) : 3;
  });

  // Telemetry Simulation speed
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  // Refs for mapping and websockets
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const socketRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Cache duty state changes
  const handleToggleDuty = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    localStorage.setItem('cg_ambulance_duty', nextState.toString());
    
    if (!nextState) {
      // Disconnect socket and clear markers when going offline
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setActiveEmergency(null);
      setPatientCoords(null);
      setIsSimulating(false);
      setSimStep(0);
    }
  };

  // 1. Poll active trauma requests (Only if ONLINE)
  useEffect(() => {
    if (!token || !isOnline) return;

    const syncEmergencies = async () => {
      try {
        const list = await fetchActiveEmergencies(token);
        
        // Match accepted emergency for this ambulance unit
        const currentActive = list.find(
          (req: any) => req.status === 'DISPATCHED' && req.ambulanceId === userProfile?.id
        );
        if (currentActive) {
          setActiveEmergency(currentActive);
          setPatientCoords([currentActive.latitude, currentActive.longitude]);
        }

        // Available alerts waiting in the local sector
        const pendingList = list.filter((req: any) => req.status === 'PENDING');
        setEmergencies(pendingList);
      } catch (err) {
        console.error('Failed to load active emergencies:', err);
      }
    };

    syncEmergencies();
    const interval = setInterval(syncEmergencies, 3500);

    return () => clearInterval(interval);
  }, [token, userProfile, isOnline]);

  // 2. Initialize Geolocation for Ambulance Driver (Only if ONLINE)
  useEffect(() => {
    if (!isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setAmbulanceCoords(coords);
        },
        (err) => {
          console.warn('[Ambulance Geolocation] Using Princeton Hospital standby coordinates.', err);
        },
        { enableHighAccuracy: true }
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          if (!isSimulating) {
            setAmbulanceCoords(coords);
          }
        },
        (err) => {
          console.error('[Ambulance Geolocation] Watch tracking error:', err);
        },
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnline, isSimulating]);

  // 3. Connect Socket for Real-Time Dispatch Alerts (Only if ONLINE & assigned)
  useEffect(() => {
    if (!activeEmergency || !isOnline) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join-emergency', activeEmergency.id);

    // Sync moving target if patient updates position
    socket.on('location-updated', (data: { role: 'patient' | 'ambulance'; latitude: number; longitude: number }) => {
      if (data.role === 'patient') {
        setPatientCoords([data.latitude, data.longitude]);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeEmergency, isOnline]);

  // 4. Emit ambulance location over socket
  useEffect(() => {
    if (activeEmergency && isOnline && socketRef.current) {
      socketRef.current.emit('update-emergency-location', {
        requestId: activeEmergency.id,
        role: 'ambulance',
        latitude: ambulanceCoords[0],
        longitude: ambulanceCoords[1]
      });
    }
  }, [ambulanceCoords, activeEmergency, isOnline]);

  // 5. Leaflet Map setup and dynamic rendering (Only when Navigation tab is active)
  useEffect(() => {
    if (!isOnline || activePanel !== 'navigation' || !activeEmergency || !patientCoords || !mapRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        patientMarkerRef.current = null;
        ambulanceMarkerRef.current = null;
        routeLineRef.current = null;
      }
      return;
    }

    // Initialize Map Instance
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: patientCoords,
        zoom: 15,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);
    }

    const map = mapInstanceRef.current;

    const createCustomIcon = (emoji: string, bgClass: string, isPulsing: boolean = false) => {
      return L.divIcon({
        html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-lg ${bgClass} border-2 border-white shadow-lg ${isPulsing ? 'animate-ping' : ''}">${emoji}</div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Update patient marker
    if (patientMarkerRef.current) {
      patientMarkerRef.current.setLatLng(patientCoords);
    } else {
      patientMarkerRef.current = L.marker(patientCoords, {
        icon: createCustomIcon('', 'bg-green-500/20')
      }).addTo(map).bindPopup('<b>Patient GPS Location</b>');
    }

    // Update ambulance marker
    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.setLatLng(ambulanceCoords);
    } else {
      ambulanceMarkerRef.current = L.marker(ambulanceCoords, {
        icon: createCustomIcon('', 'bg-red-500/20', true)
      }).addTo(map).bindPopup('<b>AMB-402 (Active Unit)</b>');
    }

    // Draw route polyline
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([patientCoords, ambulanceCoords]);
    } else {
      routeLineRef.current = L.polyline([patientCoords, ambulanceCoords], {
        color: '#06b6d4',
        weight: 5,
        opacity: 0.8,
        dashArray: '5, 10'
      }).addTo(map);
    }

    // Fit bounds to show both
    const bounds = L.latLngBounds([patientCoords, ambulanceCoords]);
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [activePanel, activeEmergency, patientCoords, ambulanceCoords, isOnline]);

  // 6. Simulate Movement Step-by-Step LERP Cycle
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isSimulating && activeEmergency && patientCoords && isOnline) {
      const startCoords = DEFAULT_AMBULANCE_COORDS;
      const endCoords = patientCoords;

      intervalId = setInterval(() => {
        setSimStep((step) => {
          const nextStep = step + 1;
          const progress = nextStep / 40; // 40 steps to destination

          if (progress >= 1) {
            setAmbulanceCoords(endCoords);
            setIsSimulating(false);
            clearInterval(intervalId);
            return 0;
          }

          const currentLat = startCoords[0] + (endCoords[0] - startCoords[0]) * progress;
          const currentLng = startCoords[1] + (endCoords[1] - startCoords[1]) * progress;
          setAmbulanceCoords([currentLat, currentLng]);

          return nextStep;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSimulating, activeEmergency, patientCoords, isOnline]);

  // Accept Emergency
  const handleAccept = async (id: string, lat: number, lng: number) => {
    if (!token) return;

    try {
      const updated = await updateEmergencyStatus(token, id, 'DISPATCHED', userProfile?.id);
      setActiveEmergency(updated);
      setPatientCoords([lat, lng]);
      setAmbulanceCoords(DEFAULT_AMBULANCE_COORDS);
      
      // Auto transition to Map Navigation panel
      setActivePanel('navigation');
      alert(` Emergency Accepted! Tactical Navigation has initialized.`);
    } catch (err) {
      console.error('Failed to accept emergency:', err);
    }
  };

  // Resolve Emergency
  const handleResolve = async () => {
    if (!token || !activeEmergency) return;

    try {
      await updateEmergencyStatus(token, activeEmergency.id, 'RESOLVED', userProfile?.id);
      setActiveEmergency(null);
      setPatientCoords(null);
      setIsSimulating(false);
      setSimStep(0);
      
      // Tally completed mission
      const nextTally = completedCount + 1;
      setCompletedCount(nextTally);
      localStorage.setItem('cg_completed_missions', nextTally.toString());
      
      // Redirect back to request queue
      setActivePanel('requests');
      alert(` Emergency resolved! Standing by for next dispatch alert.`);
    } catch (err) {
      console.error('Failed to resolve emergency:', err);
    }
  };

  // Route distance calculation helper
  const getRouteDistance = () => {
    if (!patientCoords) return '0.0 km';
    const latDiff = patientCoords[0] - ambulanceCoords[0];
    const lngDiff = patientCoords[1] - ambulanceCoords[1];
    const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
    return `${dist.toFixed(2)} km`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 text-slate-100">
      {/* Roster Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
             Tactical Ambulance Dispatch Command
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Unit: <span className="font-mono text-cyan-400 font-bold">AMB-402</span> | Attending Paramedic: <span className="text-slate-300 font-bold">{userProfile?.displayName || 'Driver Team'}</span>
          </p>
        </div>

        {/* Sliding Work status toggle */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardWidget
          title="Pending Queue SOS"
          value={isOnline ? emergencies.length.toString() : '--'}
          icon=""
          iconColor="text-rose-500"
        />
        <DashboardWidget
          title="Missions Completed Today"
          value={completedCount.toString()}
          icon=""
          iconColor="text-emerald-500"
        />
      </div>

      {/* Duty Status Router Container */}
      {!isOnline ? (
        /* OFFLINE PANEL */
        <div className="bg-slate-950/40 border border-white/5 p-12 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto shadow-md">
          <span className="text-5xl animate-pulse"></span>
          <h3 className="text-lg font-black text-white">Ambulance Team Offline</h3>
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
        <div className="space-y-6">
          {/* Action Tabs for Panel separation */}
          <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 max-w-md">
            <button
              onClick={() => setActivePanel('requests')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activePanel === 'requests'
                  ? 'bg-slate-950 text-cyan-400 border border-white/5 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
               Dispatch Alerts ({emergencies.length})
            </button>
            <button
              onClick={() => setActivePanel('navigation')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activePanel === 'navigation'
                  ? 'bg-slate-950 text-cyan-400 border border-white/5 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
               Tactical Map {activeEmergency && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </button>
          </div>

          {/* Panel Render Router */}
          {activePanel === 'requests' ? (
            /* PANEL 1: INCIDENT DISPATCH QUEUE */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                    <span></span> Active SOS Dispatch Requests Queue
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
                              "{req.description || 'No initial dispatch symptoms added.'}"
                            </p>
                          </div>
                          <Button 
                            onClick={() => handleAccept(req.id, req.latitude, req.longitude)}
                            className="bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider py-3 px-5 rounded-xl shadow-lg active:scale-95 flex-shrink-0"
                          >
                            Accept & Route 
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Status information right panel */}
              <div className="space-y-4 lg:col-span-1">
                <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Unit Telemetry</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Standby Base Station</span>
                      <span className="text-xs text-white font-bold">Princeton Hospital HQ</span>
                    </div>
                    <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">GPS Position</span>
                      <span className="text-xs text-cyan-400 font-bold font-mono">
                        {ambulanceCoords[0].toFixed(5)}, {ambulanceCoords[1].toFixed(5)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* PANEL 2: TACTICAL ROUTE NAVIGATION MAP */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {!activeEmergency ? (
                <div className="lg:col-span-3 bg-slate-950/40 border border-white/5 p-12 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-3 shadow-md">
                  <span className="text-4xl"></span>
                  <h4 className="text-white font-black">No Active Routing Assigned</h4>
                  <p className="text-xs text-slate-500 max-w-xs font-semibold leading-relaxed">
                    Tactical map is offline. Select and accept a trauma incident in the Dispatch Queue to start routing.
                  </p>
                  <Button
                    onClick={() => setActivePanel('requests')}
                    className="bg-cyan-600 hover:bg-cyan-500 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl"
                  >
                    View Queue 
                  </Button>
                </div>
              ) : (
                <>
                  {/* Map Viewer */}
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="overflow-hidden p-0 border border-white/5 rounded-[2.5rem] bg-slate-950/40">
                      <div className="p-4 bg-slate-900/60 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="animate-ping w-2.5 h-2.5 rounded-full bg-rose-500" />
                            Tactical Navigation Map
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">
                            TICKET ID: {activeEmergency.id.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button 
                            onClick={() => {
                              setIsSimulating(true);
                              setSimStep(0);
                            }}
                            disabled={isSimulating}
                            className="bg-cyan-600 hover:bg-cyan-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex-1 sm:flex-initial"
                          >
                             Simulate Drive
                          </Button>
                          <Button 
                            onClick={handleResolve}
                            className="bg-rose-600 hover:bg-rose-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex-1 sm:flex-initial"
                          >
                             Resolve Clear
                          </Button>
                        </div>
                      </div>

                      {/* Map Container */}
                      <div className="relative">
                        <div ref={mapRef} className="w-full h-[400px] z-0" />
                        
                        {isSimulating && (
                          <div className="absolute top-4 left-4 bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 z-10 shadow-2xl backdrop-blur-md max-w-xs">
                            <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              Active Simulation Telemetry
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-semibold leading-relaxed">
                              Driving towards patient coordinates. Current coordinates are broadcasting live to hospital operators and clinical desks.
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Route information ledger */}
                  <div className="space-y-4 lg:col-span-1">
                    <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Route Details</h3>
                      
                      <div className="space-y-3 font-semibold">
                        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                          <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Patient GPS</span>
                          <span className="text-xs text-white font-mono font-bold">
                            {patientCoords ? `${patientCoords[0].toFixed(5)}, ${patientCoords[1].toFixed(5)}` : 'Syncing...'}
                          </span>
                        </div>
                        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                          <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Live Coordinates</span>
                          <span className="text-xs text-cyan-400 font-mono font-bold">
                            {ambulanceCoords[0].toFixed(5)}, {ambulanceCoords[1].toFixed(5)}
                          </span>
                        </div>
                        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                          <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Remaining Distance</span>
                          <span className="text-xs text-emerald-400 font-black font-mono">
                            {getRouteDistance()}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Patient Card</h3>
                      <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Attending Notes</span>
                        <p className="text-xs text-slate-300 font-medium italic leading-relaxed">
                          "{activeEmergency.description || 'No symptoms or details specified by patient.'}"
                        </p>
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmbulanceDashboard;
