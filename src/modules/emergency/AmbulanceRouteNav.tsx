// ============================================================
// PULSEGRID — TACTICAL ROUTE NAVIGATION SYSTEM (LEAFLET & OSM)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveEmergencies, updateEmergencyStatus } from '../../services/emergencyService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const SOCKET_URL = 'http://localhost:4000';
const DEFAULT_AMBULANCE_COORDS: [number, number] = [40.3481, -74.6471]; // Princeton Hospital HQ

export const AmbulanceRouteNav: React.FC = () => {
  const { token, userProfile } = useAuthStore();
  const navigate = useNavigate();

  // Duty Status cache
  const [isOnline] = useState<boolean>(() => {
    const cached = localStorage.getItem('cg_ambulance_duty');
    return cached === 'true';
  });

  // Emergency & Telemetry states
  const [activeEmergency, setActiveEmergency] = useState<any | null>(null);
  const [ambulanceCoords, setAmbulanceCoords] = useState<[number, number]>(DEFAULT_AMBULANCE_COORDS);
  const [patientCoords, setPatientCoords] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulation settings
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

  // 1. Fetch active assigned emergency initially and periodic poll
  useEffect(() => {
    if (!token || !isOnline) {
      setIsLoading(false);
      return;
    }

    const loadActiveRoute = async () => {
      try {
        const list = await fetchActiveEmergencies(token);
        
        // Match accepted emergency for this ambulance unit
        const currentActive = list.find(
          (req: any) => req.status === 'DISPATCHED' && req.ambulanceId === userProfile?.id
        );
        if (currentActive) {
          setActiveEmergency(currentActive);
          setPatientCoords([currentActive.latitude, currentActive.longitude]);
        } else {
          setActiveEmergency(null);
          setPatientCoords(null);
        }
      } catch (err) {
        console.error('Failed to load active route:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveRoute();
    const interval = setInterval(loadActiveRoute, 4000);

    return () => clearInterval(interval);
  }, [token, userProfile, isOnline]);

  // 2. Initialize Geolocation for Ambulance Driver (Only if ONLINE)
  useEffect(() => {
    if (!isOnline) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setAmbulanceCoords(coords);
        },
        (err) => {
          console.warn('[Ambulance Geolocation] Standby Princeton HQ coords applied.', err);
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
          console.error('[Ambulance Geolocation] Tracking error:', err);
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

  // 3. Connect Socket for Real-Time Coordinates sharing (Only if ONLINE & assigned)
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

    // Sync shifting patient coords
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
    if (!isOnline || !activeEmergency || !patientCoords || !mapRef.current) {
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

  }, [activeEmergency, patientCoords, ambulanceCoords, isOnline]);

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

  // Resolve Emergency
  const handleResolve = async () => {
    if (!token || !activeEmergency) return;

    try {
      await updateEmergencyStatus(token, activeEmergency.id, 'RESOLVED', userProfile?.id);
      
      // Update missions ledger
      const savedCount = localStorage.getItem('cg_completed_missions');
      const count = savedCount ? parseInt(savedCount) : 3;
      localStorage.setItem('cg_completed_missions', (count + 1).toString());
      
      // Notify components
      window.dispatchEvent(new CustomEvent('pulsegrid-sos-update'));
      
      alert(' Emergency Resolved Successfully! Returning to incident alert terminal.');
      navigate('/ambulance/requests');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold italic">
         Syncing Tactical Navigation Instruments...
      </div>
    );
  }

  // Not Online Standby state
  if (!isOnline) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-slate-100 pb-12">
        <div className="bg-slate-950/40 border border-white/5 p-12 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 shadow-md">
          <span className="text-5xl"></span>
          <h3 className="text-lg font-black text-white font-extrabold">Tactical Map Offline</h3>
          <p className="text-xs text-slate-400 max-w-sm font-semibold leading-relaxed">
            You are currently offline. Please set your duty status to Online in the dispatch terminal to access real-time mapping systems.
          </p>
          <Button
            onClick={() => navigate('/ambulance/requests')}
            className="bg-cyan-600 hover:bg-cyan-500 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg active:scale-95"
          >
            Go to Alerts Terminal 
          </Button>
        </div>
      </div>
    );
  }

  // Active Emergency Assigned check
  if (!activeEmergency) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-slate-100 pb-12">
        <div className="bg-slate-950/40 border border-white/5 p-12 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 shadow-md">
          <span className="text-5xl"></span>
          <h3 className="text-lg font-black text-white font-extrabold">No Active Routing Assigned</h3>
          <p className="text-xs text-slate-400 max-w-sm font-semibold leading-relaxed">
            There is currently no active routing assigned to AMB-402. Return to the Dispatch alerts queue to accept a trauma ticket.
          </p>
          <Button
            onClick={() => navigate('/ambulance/requests')}
            className="bg-cyan-600 hover:bg-cyan-500 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg active:scale-95"
          >
            View Active SOS Queue 
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6 text-slate-100 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
             Tactical Route Navigation Map
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Real-time Leaflet & OpenStreetMap routing coordinates tracking for unit <span className="text-cyan-400 font-bold font-mono">AMB-402</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/ambulance/requests')}
            className="bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl"
          >
             Alerts Queue ({activeEmergency ? '1 Active' : '0'})
          </Button>
        </div>
      </div>

      {/* Main Grid: Leaflet Map & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden p-0 border border-white/5 rounded-[2.5rem] bg-slate-950/40">
            <div className="p-4 bg-slate-900/60 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="animate-ping w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Live Routing Coordinates
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
                  className="bg-cyan-600 hover:bg-cyan-500 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex-1 sm:flex-initial"
                >
                   Simulate Route Drive
                </Button>
                <Button 
                  onClick={handleResolve}
                  className="bg-rose-600 hover:bg-rose-500 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex-1 sm:flex-initial"
                >
                   Resolve Clear Run
                </Button>
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div className="relative">
              <div ref={mapRef} className="w-full h-[420px] z-0" />
              
              {isSimulating && (
                <div className="absolute top-4 left-4 bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 z-10 shadow-2xl backdrop-blur-md max-w-xs">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Simulating Road Drive
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold leading-relaxed">
                    Driving towards patient. Live coordinates are broadcasting directly to clinical emergency desks in real-time.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Navigation Details</h3>
            
            <div className="space-y-3 font-semibold">
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Patient GPS Coords</span>
                <span className="text-xs text-white font-mono font-bold">
                  {patientCoords ? `${patientCoords[0].toFixed(5)}, ${patientCoords[1].toFixed(5)}` : 'Loading GPS...'}
                </span>
              </div>
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Ambulance GPS Coords</span>
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
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Patient Incident Sheet</h3>
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[9px] text-slate-500 block uppercase font-black tracking-wider">Attending Symptoms</span>
              <p className="text-xs text-slate-300 font-medium italic leading-relaxed">
                "{activeEmergency.description || 'No symptoms or details specified by patient.'}"
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceRouteNav;
