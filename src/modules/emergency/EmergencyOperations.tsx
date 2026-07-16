// ============================================================
// PULSEGRID — EMERGENCY OPERATIONS DASHBOARD (RBAC-AWARE)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveEmergencies, fetchAmbulances, updateEmergencyStatus, overrideTriage } from '../../services/emergencyService';

const SOCKET_URL = 'http://localhost:4000';
const DEFAULT_HOSPITAL_COORDS: [number, number] = [40.3481, -74.6471];

interface EmergencyRequest {
  id: string;
  patientId: string;
  latitude: number;
  longitude: number;
  status: 'PENDING' | 'DISPATCHED' | 'RESOLVED' | 'CANCELLED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string | null;
  operatorId: string | null;
  ambulanceId: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    patientProfile?: {
      fullName: string;
      bloodGroup: string | null;
      phone: string;
    };
  };
  ambulance?: {
    ambulanceDriverProfile?: {
      fullName: string;
      ambulanceRegNumber: string;
      vehicleType: string;
    };
  };
}

const EmergencyOperations: React.FC = () => {
  const { token, userProfile } = useAuthStore();

  // Core data states
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('');

  // Audio-visual Notification Toast State
  const [toastNotification, setToastNotification] = useState<EmergencyRequest | null>(null);
  const [sirenToggle, setSirenToggle] = useState<'red' | 'blue'>('red');

  // Map state and refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  
  // Real-time ambulance tracking state
  const [ambulanceCoords, setAmbulanceCoords] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<string>('Standby...');

  // Simulation state
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any>(null);

  // 1. Synthesize emergency chime via Web Audio API
  const playEmergencyAlertSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (freq: number, duration: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      // Play electronic medical siren chime (alternating pitches)
      playTone(880, 0.35, 0);
      playTone(660, 0.35, 0.4);
      playTone(880, 0.35, 0.8);
    } catch (e) {
      console.warn('[Web Audio] Tone playback was blocked by browser autoplay policy:', e);
    }
  };

  // 2. Load initially and setup Socket + polling
  useEffect(() => {
    if (!token) return;

    loadData();

    // Establish Socket.io connection for zero-latency alerts
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[EmergencySocket] Operational connection established.');
    });

    // Real-time Event: New Emergency SOS triggered
    socket.on('new-emergency', (newRequest: EmergencyRequest) => {
      console.log('[EmergencySocket] Real-time SOS alert received!', newRequest);
      setEmergencies((prev) => {
        // Prevent double insertion
        if (prev.some((e) => e.id === newRequest.id)) return prev;
        return [newRequest, ...prev];
      });
      setToastNotification(newRequest);
      playEmergencyAlertSound();
    });

    // Real-time Event: Emergency Request updated by another operator or system
    socket.on('emergency-updated', (updatedRequest: EmergencyRequest) => {
      console.log('[EmergencySocket] Real-time emergency update received.', updatedRequest);
      setEmergencies((prev) =>
        prev.map((e) => (e.id === updatedRequest.id ? updatedRequest : e))
      );
      
      setSelectedEmergency((current) => {
        if (current?.id === updatedRequest.id) {
          // If our active request got updated, synchronize it
          return updatedRequest;
        }
        return current;
      });
    });

    // Poll DB every 6 seconds as a backup sync mechanism
    const pollingInterval = setInterval(loadData, 6000);

    return () => {
      socket.disconnect();
      clearInterval(pollingInterval);
    };
  }, [token]);

  // Load backend active requests and available ambulances
  const loadData = async () => {
    try {
      const [emergenciesData, ambulancesData] = await Promise.all([
        fetchActiveEmergencies(token!),
        fetchAmbulances(token!)
      ]);
      setEmergencies(emergenciesData);
      setAmbulances(ambulancesData);
    } catch (e) {
      console.error('[EmergencyOps] Failed to sync operational queue:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Siren color shift cycle (visual feedback)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emergencies.some((e) => e.status === 'PENDING')) {
      interval = setInterval(() => {
        setSirenToggle((prev) => (prev === 'red' ? 'blue' : 'red'));
      }, 350);
    }
    return () => clearInterval(interval);
  }, [emergencies]);

  // 3. Leaflet Map setup and maintenance
  useEffect(() => {
    if (!mapRef.current) return;

    // Center hospital coordinates
    const map = L.map(mapRef.current, {
      center: DEFAULT_HOSPITAL_COORDS,
      zoom: 14,
      zoomControl: false
    });
    mapInstanceRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Premium Slate Dark layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    // Initial hospital marker
    const hospitalIcon = L.divIcon({
      html: `<div class="w-9 h-9 rounded-full flex items-center justify-center text-xl bg-red-600/30 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>`,
      className: 'custom-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    hospitalMarkerRef.current = L.marker(DEFAULT_HOSPITAL_COORDS, { icon: hospitalIcon })
      .addTo(map)
      .bindPopup('<b>PulseGrid Base HQ</b>');

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Handle map updates whenselected emergency patient or en-route coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedEmergency) return;

    // Invalidate size to ensure Leaflet renders correctly after transition
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    const patientCoords: [number, number] = [selectedEmergency.latitude, selectedEmergency.longitude];

    // Reset/Setup Patient Marker
    if (patientMarkerRef.current) {
      patientMarkerRef.current.remove();
    }
    
    const patientIcon = L.divIcon({
      html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-red-500/20 border-2 border-red-500 animate-pulse"></div>`,
      className: 'custom-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    patientMarkerRef.current = L.marker(patientCoords, { icon: patientIcon })
      .addTo(map)
      .bindPopup(`<b>Patient Incident Location</b><br/>"${selectedEmergency.description || 'SOS Triggered'}"`);

    // Draw route and ambulance marker if dispatched
    if (selectedEmergency.status === 'DISPATCHED' && ambulanceCoords) {
      if (ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current.remove();
      }
      
      const ambIcon = L.divIcon({
        html: `<div class="w-9 h-9 rounded-full flex items-center justify-center text-xl bg-cyan-600/30 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.55)]"></div>`,
        className: 'custom-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      
      ambulanceMarkerRef.current = L.marker(ambulanceCoords, { icon: ambIcon })
        .addTo(map)
        .bindPopup(`<b>Ambulance Driver</b><br/>En Route to SOS Incident`);

      if (routeLineRef.current) {
        routeLineRef.current.remove();
      }
      
      routeLineRef.current = L.polyline([ambulanceCoords, patientCoords], {
        color: '#22d3ee',
        weight: 4,
        opacity: 0.75,
        dashArray: '8, 8'
      }).addTo(map);

      // Encompass both patient and ambulance
      const bounds = L.latLngBounds([patientCoords, ambulanceCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });

      // Calculate simple distance telemetry
      const distMeters = map.distance(patientCoords, ambulanceCoords);
      const km = (distMeters / 1000).toFixed(2);
      const timeMins = Math.max(1, Math.round(distMeters / 220)); // Approx 13km/h driving speed
      setEta(`${km} km (${timeMins} min ETA)`);
    } else {
      // Standby or Pending
      if (ambulanceMarkerRef.current) ambulanceMarkerRef.current.remove();
      if (routeLineRef.current) routeLineRef.current.remove();
      
      map.setView(patientCoords, 15);
      setEta('Awaiting Ambulance Dispatch...');
    }
  }, [selectedEmergency, ambulanceCoords]);

  // 5. Setup Coordinate Interpolator/Simulator for dispatch mapping
  useEffect(() => {
    // Clean up previous simulation loop
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    if (!selectedEmergency || selectedEmergency.status !== 'DISPATCHED') {
      setAmbulanceCoords(null);
      return;
    }

    // Start coordinates (Hospital HQ Base)
    let startLat = DEFAULT_HOSPITAL_COORDS[0];
    let startLng = DEFAULT_HOSPITAL_COORDS[1];
    
    // End coordinates (Patient GPS Location)
    const endLat = selectedEmergency.latitude;
    const endLng = selectedEmergency.longitude;

    setAmbulanceCoords([startLat, startLng]);

    let step = 0;
    const maxSteps = 40; // Simulated interpolation steps

    simulationIntervalRef.current = setInterval(() => {
      step += 1;
      if (step >= maxSteps) {
        // Ambulance has reached patient destination
        setAmbulanceCoords([endLat, endLng]);
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        return;
      }

      // Linear interpolation to patient
      const progress = step / maxSteps;
      const currentLat = startLat + (endLat - startLat) * progress;
      const currentLng = startLng + (endLng - startLng) * progress;

      setAmbulanceCoords([currentLat, currentLng]);

      // Emit new coordinate updates to active sockets for other views
      if (socketRef.current) {
        socketRef.current.emit('update-emergency-location', {
          requestId: selectedEmergency.id,
          role: 'ambulance',
          latitude: currentLat,
          longitude: currentLng
        });
      }
    }, 2500); // Shift every 2.5s

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [selectedEmergency?.id, selectedEmergency?.status]);

  // Triage Override event
  const handleTriageOverride = async (emergencyId: string, priorityValue: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    try {
      // Optimistic updates for seamless frontend transitions
      setEmergencies((prev) =>
        prev.map((e) => (e.id === emergencyId ? { ...e, priority: priorityValue } : e))
      );
      setSelectedEmergency((current) => {
        if (current?.id === emergencyId) {
          return { ...current, priority: priorityValue };
        }
        return current;
      });

      await overrideTriage(token!, emergencyId, priorityValue);
      console.log(`[EmergencyOps] Successfully triaged emergency ${emergencyId} -> ${priorityValue}`);
    } catch (e) {
      alert('Triage override request failed. Please check network connectivity.');
      loadData(); // Revert state from DB
    }
  };

  // Dispatch ambulance
  const handleDispatchAmbulance = async (emergencyId: string) => {
    if (!selectedAmbulanceId) {
      alert('Please select an ambulance unit to dispatch first.');
      return;
    }
    setIsDispatching(true);

    try {
      const updated = await updateEmergencyStatus(token!, emergencyId, 'DISPATCHED', selectedAmbulanceId);
      
      // Sync local lists
      setEmergencies((prev) =>
        prev.map((e) => (e.id === emergencyId ? { ...e, status: 'DISPATCHED', ambulanceId: selectedAmbulanceId } : e))
      );
      setSelectedEmergency((current) => {
        if (current?.id === emergencyId) {
          return { ...current, status: 'DISPATCHED', ambulanceId: selectedAmbulanceId, ambulance: updated.ambulance };
        }
        return current;
      });
      setSelectedAmbulanceId('');
      console.log(`[EmergencyOps] Ambulance ${selectedAmbulanceId} dispatched to SOS ${emergencyId}`);
    } catch (err) {
      alert('Ambulance dispatch command failed.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Mark resolved
  const handleMarkResolved = async (emergencyId: string) => {
    try {
      await updateEmergencyStatus(token!, emergencyId, 'RESOLVED');
      
      // Remove from active operations display
      setEmergencies((prev) => prev.filter((e) => e.id !== emergencyId));
      setSelectedEmergency(null);
      setAmbulanceCoords(null);
      
      console.log(`[EmergencyOps] Emergency incident ${emergencyId} marked as RESOLVED.`);
    } catch (err) {
      alert('Failed to resolve incident.');
    }
  };

  // Color mapping configurations for tags
  const priorityTagStyles = {
    CRITICAL: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    HIGH: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    LOW: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  };

  const priorityButtons = [
    { value: 'CRITICAL', label: ' Critical', color: 'bg-rose-950 hover:bg-rose-900 border-rose-600 text-rose-400' },
    { value: 'HIGH', label: ' High', color: 'bg-orange-950 hover:bg-orange-900 border-orange-600 text-orange-400' },
    { value: 'MEDIUM', label: ' Med', color: 'bg-amber-950 hover:bg-amber-900 border-amber-600 text-amber-400' },
    { value: 'LOW', label: ' Low', color: 'bg-emerald-950 hover:bg-emerald-900 border-emerald-600 text-emerald-400' }
  ] as const;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-8">
      {/* 1. Real-time Emergency Audio-Visual banner */}
      {toastNotification && (
        <div className="bg-red-950 border border-red-500/40 rounded-2xl p-4 flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center gap-4">
            <span
              className={`w-4 h-4 rounded-full animate-ping ${
                sirenToggle === 'red' ? 'bg-red-500' : 'bg-blue-500'
              }`}
            />
            <div>
              <p className="font-extrabold text-white text-base"> CRITICAL EMERGENCY TRAUMA ALERT RECEIVED</p>
              <p className="text-gray-300 text-sm mt-0.5">
                Patient: <span className="text-white font-bold">{toastNotification.patient?.patientProfile?.fullName || 'Anonymous Patient'}</span> • Blood Type: {toastNotification.patient?.patientProfile?.bloodGroup || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedEmergency(toastNotification);
                setToastNotification(null);
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-950"
            >
              Respond & Track
            </button>
            <button
              onClick={() => setToastNotification(null)}
              className="text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest px-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600"></span>
            </span>
            Emergency Operations Center
          </h2>
          <p className="text-gray-400 text-sm mt-1">Receive zero-latency trauma SOS triggers, manage medical priority, and coordinate fleet dispatches.</p>
        </div>

        {/* Dynamic metrics bar */}
        <div className="flex gap-3">
          <div className="bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Alerts</span>
            <span className="text-2xl font-black text-rose-500">{emergencies.filter(e => e.status === 'PENDING').length}</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Dispatched Units</span>
            <span className="text-2xl font-black text-cyan-400">{emergencies.filter(e => e.status === 'DISPATCHED').length}</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ICU Capacity</span>
            <span className="text-2xl font-black text-emerald-400">4/12 Beds</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left Column: Alerts List / Priority Queue */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-rose-600 rounded-full inline-block"></span>
            Priority Incident Queue
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 italic font-bold">
                 Syncing Command Channels...
              </div>
            ) : emergencies.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-850 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center">
                <span className="text-5xl mb-4"></span>
                <h4 className="text-white font-bold text-lg">System Secure</h4>
                <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-black">No Active Emergencies in Progress</p>
              </div>
            ) : (
              emergencies.map((em) => (
                <div
                  key={em.id}
                  onClick={() => setSelectedEmergency(em)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-4 select-none ${
                    selectedEmergency?.id === em.id
                      ? 'bg-rose-500/5 border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-3 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        em.status === 'PENDING' ? 'bg-rose-600 text-white animate-pulse' : 'bg-cyan-600 text-white'
                      }`}
                    >
                      {em.status}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {new Date(em.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white mb-0.5">
                      {em.patient?.patientProfile?.fullName || 'Anonymous Patient'}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      Blood Group: <span className="text-white font-semibold">{em.patient?.patientProfile?.bloodGroup || 'Unknown'}</span> • Phone: {em.patient?.patientProfile?.phone || 'N/A'}
                    </p>
                  </div>

                  {/* Description Box */}
                  {em.description && (
                    <div className="bg-black/30 border border-gray-800 rounded-xl p-3 text-xs text-gray-300 italic">
                      "{em.description}"
                    </div>
                  )}

                  {/* Action row containing Triage Override tags */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-850">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Triage Level</span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${priorityTagStyles[em.priority]}`}>
                        {em.priority}
                      </span>
                    </div>

                    {/* Single-click Triage Override buttons */}
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                      {priorityButtons.map((btn) => (
                        <button
                          key={btn.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriageOverride(em.id, btn.value);
                          }}
                          className={`px-1 py-1.5 rounded-lg border text-[10px] font-black transition-all ${
                            em.priority === btn.value
                              ? btn.color + ' border-2 shadow-inner scale-95'
                              : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800/50'
                          }`}
                        >
                          {btn.value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Tracking Console & Map */}
        <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-[2.5rem] p-6 flex flex-col shadow-inner overflow-hidden h-full">
          {selectedEmergency ? (
            <div className="flex flex-col h-full space-y-5 animate-slide-in">
              {/* Incident Header */}
              <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-rose-500 tracking-tight">Active Incident Console</h3>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Coordinating response for:{' '}
                    <span className="text-white font-bold">
                      {selectedEmergency.patient?.patientProfile?.fullName || 'Anonymous Patient'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEmergency(null)}
                  className="text-xs text-gray-500 hover:text-white font-bold uppercase tracking-wider"
                >
                  Close Console
                </button>
              </div>

              {/* Map view container */}
              <div className="relative flex-1 rounded-3xl border border-gray-800 overflow-hidden bg-gray-950 min-h-[300px]">
                <div ref={mapRef} className="absolute inset-0 z-0" />
                
                {/* Telemetry floating HUD */}
                <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur border border-gray-800 px-4 py-3 rounded-2xl z-10 flex justify-between items-center shadow-2xl">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Ambulance ETA Telemetry</span>
                    <span className="text-sm font-black text-white font-mono">{eta}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">GPS Position</span>
                    <span className="text-xs font-black text-cyan-400 font-mono">
                      {selectedEmergency.latitude.toFixed(5)}, {selectedEmergency.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls bar */}
              <div className="bg-black/30 border border-gray-850 p-5 rounded-3xl space-y-4">
                {selectedEmergency.status === 'PENDING' ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Ambulance Fleet Dispatch Dispatcher</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={selectedAmbulanceId}
                        onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="">-- Choose Ambulance Unit --</option>
                        {ambulances.map((amb) => (
                          <option key={amb.id} value={amb.id}>
                             {amb.ambulanceDriverProfile?.fullName || 'Driver'} ({amb.ambulanceDriverProfile?.vehicleType || 'Unit'})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDispatchAmbulance(selectedEmergency.id)}
                        disabled={isDispatching || !selectedAmbulanceId}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-emerald-950"
                      >
                        {isDispatching ? 'Dispatching...' : 'Dispatch Unit '}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-400/20 flex items-center justify-center text-2xl">
                        
                      </div>
                      <div>
                        <h5 className="font-extrabold text-white text-sm">
                          {selectedEmergency.ambulance?.ambulanceDriverProfile?.fullName || 'Ambulance Driver'}
                        </h5>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Unit: {selectedEmergency.ambulance?.ambulanceDriverProfile?.vehicleType} • {selectedEmergency.ambulance?.ambulanceDriverProfile?.ambulanceRegNumber}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleMarkResolved(selectedEmergency.id)}
                      className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-950"
                    >
                      Complete Incident & Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-20 select-none">
              <div className="w-44 h-44 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center text-7xl mb-8 animate-[spin_30s_linear_infinite]">
                
              </div>
              <h3 className="text-2xl font-black text-white">Monitoring Command Frequencies</h3>
              <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest font-bold">Scanning network for incoming trauma SOS triggers...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyOperations;
