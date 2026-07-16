import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { fetchTelemedicineAppointment, updateTelemedicineStatus } from '../../services/telemedicineService';
import type { TelemedicineAppointment } from '../../types';

const SOCKET_URL = 'http://localhost:4000';

const TelemedicineWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, token } = useAuthStore();
  const isDoctor = userProfile?.roleId === 'doctor';

  const [appointment, setAppointment] = useState<TelemedicineAppointment | null>(null);
  const [inCall, setInCall] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);

  // Load appointment details
  useEffect(() => {
    if (id && token) {
      fetchTelemedicineAppointment(token, id)
        .then(setAppointment)
        .catch(err => console.error('Load Error:', err));
    }
  }, [id, token]);

  // WebRTC Setup
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && id) {
        socketRef.current.emit('signal', {
          roomId: id,
          signalData: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("[WebRTC] Received remote track");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteConnected(false);
      }
    };

    // Add local tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, streamRef.current!);
      });
    }

    return pc;
  }, [id]);

  // Handle Signal Exchange
  useEffect(() => {
    if (!inCall || !id) return;

    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join-room', id);

    socketRef.current.on('user-joined', async () => {
      console.log("[Socket] Remote user joined, creating offer...");
      peerRef.current = createPeerConnection();
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current?.emit('signal', {
        roomId: id,
        signalData: { type: 'offer', offer }
      });
    });

    socketRef.current.on('signal', async (data: any) => {
      const { signalData } = data;

      if (signalData.type === 'offer') {
        console.log("[Socket] Received offer, creating answer...");
        peerRef.current = createPeerConnection();
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(signalData.offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socketRef.current?.emit('signal', {
          roomId: id,
          signalData: { type: 'answer', answer }
        });
      } else if (signalData.type === 'answer') {
        console.log("[Socket] Received answer...");
        await peerRef.current?.setRemoteDescription(new RTCSessionDescription(signalData.answer));
      } else if (signalData.type === 'candidate') {
        console.log("[Socket] Received candidate...");
        try {
          await peerRef.current?.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.close();
    };
  }, [inCall, id, createPeerConnection]);

  // Hardware Sync
  useEffect(() => {
    const handleHardwareSync = async () => {
      if (!streamRef.current || !inCall) return;

      // Handle Video
      if (videoOff) {
        streamRef.current.getVideoTracks().forEach(t => {
          t.stop();
          streamRef.current?.removeTrack(t);
        });
      } else {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true });
          const t = s.getVideoTracks()[0];
          streamRef.current.addTrack(t);
          if (peerRef.current) {
            const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(t);
            else peerRef.current.addTrack(t, streamRef.current);
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
            localVideoRef.current.srcObject = streamRef.current;
          }
        } catch (e) {}
      }

      // Handle Audio
      if (micMuted) {
        streamRef.current.getAudioTracks().forEach(t => {
          t.stop();
          streamRef.current?.removeTrack(t);
        });
      } else {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          const t = s.getAudioTracks()[0];
          streamRef.current.addTrack(t);
          if (peerRef.current) {
            const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'audio');
            if (sender) sender.replaceTrack(t);
            else peerRef.current.addTrack(t, streamRef.current);
          }
        } catch (e) {}
      }
    };
    handleHardwareSync();
  }, [videoOff, micMuted, inCall]);

  const startMedia = async () => {
    try {
      const constraints = { video: !videoOff, audio: !micMuted };
      if (!constraints.video && !constraints.audio) {
        streamRef.current = new MediaStream();
      } else {
        streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
      return true;
    } catch (err: any) {
      setMediaError(`Hardware Error: ${err.message}`);
      return false;
    }
  };

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    socketRef.current?.disconnect();
    peerRef.current?.close();
    setRemoteConnected(false);
  }, []);

  const handleJoinCall = async () => {
    const success = await startMedia();
    if (success) setInCall(true);
  };

  const handleEndCall = async () => {
    if (id && token && isDoctor) {
      await updateTelemedicineStatus(token, id, 'COMPLETED').catch(console.error);
    }
    stopMedia();
    setInCall(false);
    navigate(isDoctor ? '/doctor/schedule' : '/patient/dashboard');
  };

  const remoteName = isDoctor
    ? appointment?.patient?.patientProfile?.fullName || 'Patient'
    : appointment?.doctor?.doctorProfile?.fullName || 'Doctor';

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-slate-100">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Telemedicine Session</h1>
          <p className="text-slate-400 font-medium">Virtual Consultation Room</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${remoteConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            {remoteConnected ? '● Connection Established' : '○ Waiting for peer...'}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
        <div className="lg:col-span-3 bg-black rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden relative shadow-2xl">
          {inCall ? (
            <div className="flex-1 relative flex items-center justify-center">
              {/* Remote Participant Video */}
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-1000 ${remoteConnected ? 'opacity-100' : 'opacity-0'}`}
                />
                {!remoteConnected && (
                  <div className="text-center animate-pulse">
                    <div className="w-40 h-40 rounded-full bg-white/5 flex items-center justify-center text-6xl mb-8 mx-auto border border-white/10 shadow-2xl"></div>
                    <h3 className="text-2xl font-bold text-white mb-2">{remoteName}</h3>
                    <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs">Awaiting Entry...</p>
                  </div>
                )}
              </div>

              {/* Local Video - PIP */}
              <div className="absolute top-10 right-10 w-72 h-44 bg-slate-900 rounded-[2rem] border-2 border-white/10 overflow-hidden shadow-2xl z-30 transition-all duration-500">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-700 ${videoOff ? 'opacity-0' : 'opacity-100'}`}
                />
                {videoOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                    <div className="text-5xl mb-3"></div>
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Privacy Active</span>
                  </div>
                )}
              </div>

              {/* HUD Controls */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-slate-900/90 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/10 z-40 shadow-2xl">
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                    micMuted ? 'bg-rose-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span className="text-2xl">{micMuted ? '' : ''}</span>
                </button>
                
                <button
                  onClick={() => setVideoOff(!videoOff)}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                    videoOff ? 'bg-rose-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span className="text-2xl">{videoOff ? '' : ''}</span>
                </button>

                <div className="w-px h-12 bg-white/10 mx-2" />

                <button
                  onClick={handleEndCall}
                  className="px-12 h-16 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest shadow-2xl"
                >
                  End Session
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
              <div className="w-48 h-48 rounded-[4rem] bg-indigo-500/10 flex items-center justify-center text-8xl mb-12 border border-indigo-500/20 shadow-2xl"></div>
              <h2 className="text-5xl font-black mb-6 text-white tracking-tighter">Enter Consulting Room</h2>
              <button
                onClick={handleJoinCall}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 px-20 rounded-3xl text-2xl shadow-2xl transition-all active:scale-95"
              >
                Join Now
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-8 opacity-40 grayscale pointer-events-none">
          <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border border-white/5 flex-1 shadow-inner">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">P2P Encryption</h3>
             <div className="space-y-6">
                <div className="p-5 bg-black/40 rounded-3xl border border-white/5 shadow-xl">
                   <p className="text-[9px] text-indigo-400 font-black uppercase mb-2 tracking-widest">Protocol</p>
                   <p className="text-sm font-bold text-white">WebRTC / STUN</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemedicineWorkspace;
