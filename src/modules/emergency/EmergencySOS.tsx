import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

type SOSStatus = 'idle' | 'sending' | 'pending' | 'dispatched' | 'no-ambulance';
type TabId = 'map' | 'ai-chat';
type CallStatus = 'idle' | 'dialing' | 'connected' | 'ended';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SOCKET_URL = 'http://localhost:4000';
const DEFAULT_PATIENT_COORDS: [number, number] = [40.3431, -74.6551];
const DEFAULT_HOSPITAL_COORDS: [number, number] = [40.3481, -74.6471];

const EmergencySOS: React.FC = () => {
  const { token, userProfile } = useAuthStore();

  // Status & Telemetry States
  const [status, setStatus] = useState<SOSStatus>('idle');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [simulateAvailability, setSimulateAvailability] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('map');

  // Real-time Coordinate States
  const [patientCoords, setPatientCoords] = useState<[number, number]>(DEFAULT_PATIENT_COORDS);
  const [ambulanceCoords, setAmbulanceCoords] = useState<[number, number] | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('Calculated en route...');

  // UI Siren & Timing States
  const [sirenColor, setSirenColor] = useState<'red' | 'blue'>('red');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callDuration, setCallDuration] = useState(0);

  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: " **[PulseGrid FirstAid AI Activated]**\n\nNo active ambulance units were able to accept your dispatch within the emergency window.\n\nWe have patched your coordinates through to 112 emergency services. While we await their arrival, please describe your immediate symptoms below. I am ready to guide you through step-by-step First-Aid instructions."
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Refs for Map, Markers, Sockets
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);

  // 1. Initialize Browser Geolocation watch
  useEffect(() => {
    if ('geolocation' in navigator) {
      // Get initial position quickly
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setPatientCoords(coords);
          console.log('[Patient Geolocation] Initialized at:', coords);
        },
        (error) => {
          console.warn('[Patient Geolocation] Failed to get initial position. Falling back to default Princeton coords.', error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );

      // Watch for position updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setPatientCoords(coords);
          console.log('[Patient Geolocation] Location updated:', coords);
        },
        (error) => {
          console.error('[Patient Geolocation] Watch error:', error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.warn('[Patient Geolocation] Geolocation is not supported by this browser.');
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create Map centered on Princeton Area
    const map = L.map(mapRef.current, {
      center: patientCoords,
      zoom: 15,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark-mode Sleek Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    const createCustomIcon = (emoji: string, bgClass: string) => {
      return L.divIcon({
        html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-lg ${bgClass} border-2 border-white shadow-lg">${emoji}</div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Patient Marker (YOU)
    patientMarkerRef.current = L.marker(patientCoords, {
      icon: createCustomIcon('', 'bg-green-500/20')
    }).addTo(map).bindPopup('<b>YOU (SOS Location)</b>');

    // Princeton-Plainsboro Hospital Marker
    hospitalMarkerRef.current = L.marker(DEFAULT_HOSPITAL_COORDS, {
      icon: createCustomIcon('', 'bg-red-500/20')
    }).addTo(map).bindPopup('<b>Princeton-Plainsboro Hospital</b>');

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Move patient marker whenever patientCoords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !patientMarkerRef.current) return;

    patientMarkerRef.current.setLatLng(patientCoords);
    map.panTo(patientCoords);

    // Emit our moving coordinate to the socket if we have an active request
    if (status === 'dispatched' && activeRequestId && socketRef.current) {
      socketRef.current.emit('update-emergency-location', {
        requestId: activeRequestId,
        role: 'patient',
        latitude: patientCoords[0],
        longitude: patientCoords[1]
      });
    }
  }, [patientCoords, status, activeRequestId]);

  // 4. Connect to Socket when request is active
  useEffect(() => {
    if (!activeRequestId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket.io backend
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join-emergency', activeRequestId);
    console.log('[Socket] Joining emergency room:', activeRequestId);

    // Listen for coordinate updates from the ambulance
    socket.on('location-updated', (data: { role: 'patient' | 'ambulance'; latitude: number; longitude: number }) => {
      if (data.role === 'ambulance') {
        const ambLoc: [number, number] = [data.latitude, data.longitude];
        setAmbulanceCoords(ambLoc);
        setStatus('dispatched');
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeRequestId]);

  // 5. Update Map Markers, polyline, and distances when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const createCustomIcon = (emoji: string, bgClass: string, isPulsing: boolean = false) => {
      return L.divIcon({
        html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-lg ${bgClass} border-2 border-white shadow-lg ${isPulsing ? 'animate-ping' : ''}">${emoji}</div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Remove old ambulance marker
    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.remove();
      ambulanceMarkerRef.current = null;
    }

    // Remove old routing line
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (status === 'dispatched' && ambulanceCoords) {
      // Plot ambulance marker
      ambulanceMarkerRef.current = L.marker(ambulanceCoords, {
        icon: createCustomIcon('', 'bg-red-500/20', true)
      }).addTo(map).bindPopup('<b>AMB-402 (Dispatched)</b><br/>En Route - Sirens Active');

      // Draw route connecting patient & ambulance
      routeLineRef.current = L.polyline([patientCoords, ambulanceCoords], {
        color: '#06b6d4',
        weight: 5,
        opacity: 0.8,
        dashArray: '5, 10'
      }).addTo(map);

      // Fit map view to encompass both patient and ambulance
      const bounds = L.latLngBounds([patientCoords, ambulanceCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });

      // Calculate simple straight-line distance
      const distance = map.distance(patientCoords, ambulanceCoords); // in meters
      const km = (distance / 1000).toFixed(2);
      const mins = Math.max(1, Math.round(distance / 250)); // Approx 15 km/h in traffic
      setEstimatedArrival(`${km} km (${mins} mins away)`);
    } else {
      setEstimatedArrival('Standby / Calculating...');
    }
  }, [status, ambulanceCoords, patientCoords]);

  // 6. Polling effect to track status transitions (PENDING -> DISPATCHED)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeRequestId && status === 'pending') {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:4000/api/emergency/active', {
            headers: {
              'Authorization': `Bearer ${token || ''}`,
            }
          });
          if (response.ok) {
            const list = await response.json();
            const currentReq = list.find((req: any) => req.id === activeRequestId);
            if (currentReq) {
              if (currentReq.status === 'DISPATCHED') {
                setStatus('dispatched');
                setActiveTab('map');
              } else if (currentReq.status === 'RESOLVED') {
                reset();
              }
            }
          }
        } catch (e) {
          console.error('[Polling Error] Failed to update emergency request:', e);
        }
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeRequestId, status, token]);

  // 11. 10-second dispatch timeout: if no ambulance accepts within 10 seconds, move to no-ambulance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (activeRequestId && status === 'pending') {
      timeoutId = setTimeout(() => {
        console.log('[SOS Dispatch Timeout] 10 seconds exceeded with no driver acceptance. Activating PulseGrid FirstAid AI.');
        setStatus('no-ambulance');
        setActiveTab('ai-chat');
      }, 10000); // 10 seconds timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeRequestId, status]);

  // 7. Siren Light Color Cycle
  useEffect(() => {
    let cycleId: NodeJS.Timeout;
    if (status === 'dispatched') {
      cycleId = setInterval(() => {
        setSirenColor((prev) => (prev === 'red' ? 'blue' : 'red'));
      }, 250);
    }
    return () => {
      if (cycleId) clearInterval(cycleId);
    };
  }, [status]);

  // 8. Dialer Call Duration Timer
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (callStatus === 'connected') {
      timerId = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [callStatus]);

  // 9. Auto-scroll Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // 10. Core Functions
  const triggerSOSDirectly = async () => {
    if (status !== 'idle') return;
    setStatus('sending');

    try {
      // 1. Check if there are any active/approved ambulance drivers
      const ambResponse = await fetch('http://localhost:4000/api/emergency/ambulances', {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        }
      });
      
      let hasAmbulances = false;
      if (ambResponse.ok) {
        const ambulances = await ambResponse.json();
        if (Array.isArray(ambulances) && ambulances.length > 0) {
          hasAmbulances = true;
        }
      }

      if (!hasAmbulances) {
        console.log('[SOS Trigger] No active/approved ambulance drivers in the system.');
        setStatus('no-ambulance');
        setActiveTab('ai-chat');
        return;
      }

      // 2. Make active API request to trigger SOS emergency in database
      const response = await fetch('http://localhost:4000/api/emergency/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          latitude: patientCoords[0],
          longitude: patientCoords[1],
          description: `SOS Triggered by patient. Browser coords: ${patientCoords[0]}, ${patientCoords[1]}.`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger emergency SOS');
      }

      console.log('[API Emergency Created]:', data);
      setActiveRequestId(data.id);
      
      // Strict real-time state: wait for a real driver to click "Accept & Route"
      setStatus('pending');

    } catch (err) {
      console.error('[SOS Trigger Error]:', err);
      setStatus('no-ambulance');
      setActiveTab('ai-chat');
    }
  };

  const handleCall112 = () => {
    setCallStatus('dialing');
    setTimeout(() => {
      setCallStatus('connected');
    }, 1500);
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      setCallStatus('idle');
    }, 500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAiLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: inputMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsAiLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to PulseGrid AI');
      }

      const botMsg = data.choices?.[0]?.message || {
        role: 'assistant',
        content: 'I apologize, but I am experiencing trouble formulating my response. Please continue talking to emergency 112 operators immediately.',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: ` **Server Connection Issue**\n\nCould not reach the PulseGrid AI triaging engine. Please ensure your backend server is active and your \`GROQ_API_KEY\` is configured in the backend environment (\`.env\`).\n\n**Please call 112 immediately.**`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const reset = () => {
    setStatus('idle');
    setActiveRequestId(null);
    setAmbulanceCoords(null);
    setCallStatus('idle');
    setActiveTab('map'); // Instantly show map tab when cleared/cancelled
    setMessages([
      {
        role: 'assistant',
        content: " **[PulseGrid FirstAid AI Activated]**\n\nNo active ambulance units were able to accept your dispatch within the emergency window.\n\nWe have patched your coordinates through to 112 emergency services. While we await their arrival, please describe your immediate symptoms below. I am ready to guide you through step-by-step First-Aid instructions."
      }
    ]);
  };

  const formatDuration = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto">
      

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl"></span> Emergency SOS
        </h1>
        <p className="text-gray-400 mt-1">One-click real-time dispatch dashboard. Tracks and coordinates medical response.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: SOS Controls */}
        <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center gap-6 shadow-xl">
          
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center gap-6 py-6">
              <p className="text-gray-400 text-center text-sm font-medium">Click the button below once to instantly trigger emergency dispatch</p>
              <div className="relative w-44 h-44 my-4">
                <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-red-500/10 animate-ping" style={{ animationDelay: '0.3s' }} />
                <button
                  onClick={triggerSOSDirectly}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:scale-95 transition-all shadow-[0_0_40px_rgba(220,38,38,0.4)] flex flex-col items-center justify-center select-none"
                >
                  <span className="text-5xl text-white drop-shadow"></span>
                  <span className="text-white font-extrabold text-lg tracking-wider mt-1">SOS</span>
                </button>
              </div>
            </div>
          )}

          {status === 'sending' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-yellow-400">Locking Coordinates...</h3>
              <p className="text-gray-400 text-sm text-center">Acquiring high-resolution browser GPS and creating emergency ticket...</p>
            </div>
          )}

          {status === 'pending' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400">SOS Transmitted</h3>
              <p className="text-gray-400 text-sm">Emergency coordinates locked. Awaiting operator dispatch clearance...</p>
              <span className="text-xs text-gray-500 font-mono mt-2 bg-gray-950 px-3 py-1 rounded">Ticket: {activeRequestId?.substring(0, 8)}...</span>
            </div>
          )}

          {status === 'dispatched' && (
            <div className="flex flex-col items-center gap-4 text-center py-4 w-full">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-4xl animate-bounce">
                
              </div>
              <h3 className="text-2xl font-bold text-green-400">Ambulance Dispatched!</h3>
              <p className="text-gray-400 text-sm">Your emergency request is active. First responder unit is en route.</p>
              
              <div className="bg-gray-950 border border-gray-850 rounded-xl p-4 w-full my-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400 text-sm font-semibold">Estimated Arrival</span>
                  <span className="text-white font-black text-xl">{estimatedArrival}</span>
                </div>
              </div>

              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center text-xs bg-gray-950 border border-gray-850 px-3 py-2 rounded-lg">
                  <span className="text-gray-500">Dispatch Code:</span>
                  <span className="text-white font-mono font-bold">{activeRequestId?.substring(0, 8).toUpperCase()}-EMS</span>
                </div>
                <div className="flex justify-between items-center text-xs bg-gray-950 border border-gray-850 px-3 py-2 rounded-lg">
                  <span className="text-gray-500">Patient Coordinates:</span>
                  <span className="text-cyan-400 font-bold font-mono">{patientCoords[0].toFixed(5)}, {patientCoords[1].toFixed(5)}</span>
                </div>
              </div>

              <button onClick={reset} className="text-xs text-gray-500 hover:text-red-400 transition-colors mt-4">Cancel Emergency</button>
            </div>
          )}

          {status === 'no-ambulance' && (
            <div className="flex flex-col gap-5 py-4 w-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-3 animate-pulse">
                  
                </div>
                <h3 className="text-2xl font-black text-red-500">Dispatch Interrupted</h3>
                <p className="text-gray-400 text-xs mt-1">No physical ambulance units are available in your sector.</p>
              </div>

              {callStatus === 'idle' && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCall112}
                    className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 animate-bounce transition-all active:scale-95"
                  >
                    <span></span> CALL EMERGENCY SERVICES (112)
                  </button>
                  <button
                    onClick={() => setActiveTab('ai-chat')}
                    className="w-full bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
                  >
                    <span></span> CONSULT PULSEGRID FIRSTAID AI
                  </button>
                </div>
              )}

              {/* Dialer Active Screen */}
              {callStatus !== 'idle' && (
                <div className="bg-gray-950 border border-gray-850 rounded-xl p-5 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center text-2xl border border-red-500/30 animate-pulse">
                    
                  </div>
                  <div>
                    <p className="text-red-400 text-sm font-bold tracking-widest uppercase">
                      {callStatus === 'dialing' ? 'DIALING 112...' : 'CALL CONNECTED'}
                    </p>
                    <p className="text-white text-xs mt-1 text-gray-500">
                      {callStatus === 'dialing' ? 'Patching GPS coordinates to dispatch...' : 'Broadcasting your emergency coordinates...'}
                    </p>
                  </div>
                  {callStatus === 'connected' && (
                    <span className="text-white font-mono font-bold text-2xl bg-gray-900 border border-gray-800 px-4 py-1.5 rounded-lg">
                      {formatDuration(callDuration)}
                    </span>
                  )}
                  <button
                    onClick={handleEndCall}
                    className="mt-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    End Emergency Call
                  </button>
                </div>
              )}

              <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-300 transition-colors mx-auto mt-2">Clear Emergency Alert</button>
            </div>
          )}

        </div>

        {/* Right Column: Tabbed View (OpenStreetMap Map & PulseGrid AI Chat) */}
        <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-xl min-h-[460px]">
          
          {/* Tab Header bar */}
          <div className="flex border-b border-gray-800 bg-gray-950 p-2 justify-between items-center">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'map'
                    ? 'bg-gray-900 text-white border border-gray-800'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                 Live GPS Map
              </button>
              <button
                onClick={() => setActiveTab('ai-chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                  activeTab === 'ai-chat'
                    ? 'bg-gray-900 text-white border border-gray-800'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                 PulseGrid FirstAid AI
                {status === 'no-ambulance' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border border-gray-950 rounded-full animate-ping" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">OSM Tile Service</span>
            </div>
          </div>

          {/* Tab content area */}
          <div className="flex-1 flex flex-col relative min-h-[380px]">
            
            {/* Live Leaflet Map Container */}
            <div 
              className="absolute inset-0 flex flex-col z-0 transition-opacity duration-300"
              style={{ opacity: activeTab === 'map' ? 1 : 0, pointerEvents: activeTab === 'map' ? 'auto' : 'none' }}
            >
              <div ref={mapRef} className="w-full flex-1" style={{ minHeight: '380px' }} />
              
              {/* Telemetry bottom bar */}
              <div className="grid grid-cols-3 gap-1 bg-gray-950 border-t border-gray-850 p-3">
                <div className="text-center">
                  <span className="text-[9px] text-gray-500 block uppercase tracking-wider">Map Coordinates</span>
                  <span className="text-xs font-bold text-white font-mono">{patientCoords[0].toFixed(4)}, {patientCoords[1].toFixed(4)}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-gray-500 block uppercase tracking-wider">Distance / ETA</span>
                  <span className="text-xs font-bold text-white">
                    {estimatedArrival}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-gray-500 block uppercase tracking-wider">Ambulance Siren</span>
                  <span className={`text-[10px] font-bold ${status === 'dispatched' ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                    {status === 'dispatched' ? ' ACTIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>

            {/* PulseGrid AI Chat Container */}
            <div 
              className="absolute inset-0 z-10 flex flex-col bg-gray-950 transition-opacity duration-300"
              style={{ opacity: activeTab === 'ai-chat' ? 1 : 0, pointerEvents: activeTab === 'ai-chat' ? 'auto' : 'none' }}
            >
              {/* Message log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-cyan-600 text-white rounded-tr-none'
                        : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none prose prose-invert max-w-none'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="whitespace-pre-line">
                          {msg.content}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2 text-cyan-400">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                      PulseGrid FirstAid AI is formulating medical advice...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-850 p-3 bg-gray-900 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isAiLoading || status === 'idle'}
                  placeholder={status === 'idle' ? "Trigger SOS first to consult emergency triage AI..." : "Describe symptoms (e.g. heavy leg bleeding, chest pressure)..."}
                  className="flex-1 bg-gray-950 border border-gray-850 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isAiLoading || status === 'idle'}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center"
                >
                  Send
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default EmergencySOS;
