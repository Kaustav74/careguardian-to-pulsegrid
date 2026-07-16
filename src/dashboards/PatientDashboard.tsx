// ============================================================
// PULSEGRID — PATIENT DASHBOARD
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { fetchTelemedicineAppointments } from '../services/telemedicineService';
import { triggerSOS } from '../services/emergencyService';
import type { TelemedicineAppointment } from '../types';

const PatientDashboard: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<TelemedicineAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Emergency State
  const [sosStatus, setSosStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [sosError, setSosError] = useState('');

  // Global Navigation AI Chat States
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [globalInput, setGlobalInput] = useState('');
  const [globalChatLoading, setGlobalChatLoading] = useState(false);
  const [globalMessages, setGlobalMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! I am your PulseGrid AI Companion. Describe what page you want to access (e.g. 'schedule an appointment', 'show my health records', 'emergency SOS'), or ask me clinical triage questions, and I will navigate you instantly!"
    }
  ]);
  const globalChatEndRef = useRef<HTMLDivElement>(null);
  
  // Navigation countdown states
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownVal, setCountdownVal] = useState(3);
  const [navTarget, setNavTarget] = useState('');

  // Auto scroll for global assistant
  useEffect(() => {
    globalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages, globalChatLoading]);

  // Redirect countdown timer hook
  useEffect(() => {
    if (!countdownActive) return;
    if (countdownVal <= 0) {
      setCountdownActive(false);
      setIsGlobalChatOpen(false);
      navigate(navTarget);
      return;
    }

    const timer = setTimeout(() => {
      setCountdownVal(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownActive, countdownVal, navTarget, navigate]);

  const handleSendGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalInput.trim() || globalChatLoading || countdownActive) return;

    const userText = globalInput.trim();
    const userMsg = { role: 'user' as const, content: userText };
    
    setGlobalMessages((prev) => [...prev, userMsg]);
    setGlobalInput('');
    setGlobalChatLoading(true);

    // Client-side quick keyword scanning for instant navigation
    const textLower = userText.toLowerCase();
    let targetPath = '';
    let targetLabel = '';

    if (textLower.includes('emergency') || textLower.includes('sos') || textLower.includes('danger') || textLower.includes('accident') || textLower.includes('ambulance') || textLower.includes('triage') || textLower.includes('help')) {
      targetPath = '/patient/emergency';
      targetLabel = 'Emergency SOS Command Room ';
    } else if (textLower.includes('appointment') || textLower.includes('schedule') || textLower.includes('book') || textLower.includes('doctor') || textLower.includes('consultation') || textLower.includes('visit')) {
      targetPath = '/patient/appointments';
      targetLabel = 'Appointment Scheduler ';
    } else if (textLower.includes('record') || textLower.includes('prescription') || textLower.includes('history') || textLower.includes('medication') || textLower.includes('report') || textLower.includes('lab') || textLower.includes('ehr')) {
      targetPath = '/patient/records';
      targetLabel = 'Electronic Health Records ';
    } else if (textLower.includes('telemedicine') || textLower.includes('video call') || textLower.includes('chat doctor') || textLower.includes('doctor consult') || textLower.includes('telehealth') || textLower.includes('symptom')) {
      targetPath = '/patient/telemedicine';
      targetLabel = 'Telemedicine Video Portal ';
    } else if (textLower.includes('profile') || textLower.includes('settings') || textLower.includes('account') || textLower.includes('address') || textLower.includes('phone') || textLower.includes('license')) {
      targetPath = '/patient/profile';
      targetLabel = 'Profile Settings ';
    } else if (textLower.includes('billing') || textLower.includes('payment') || textLower.includes('invoice') || textLower.includes('premium') || textLower.includes('subscription') || textLower.includes('cost')) {
      targetPath = '/patient/billing';
      targetLabel = 'Payments & Billing Desk ';
    } else if (textLower.includes('dashboard') || textLower.includes('home') || textLower.includes('overview')) {
      targetPath = '/patient/dashboard';
      targetLabel = 'Patient Dashboard Home ';
    }

    let nextMessages = [...globalMessages, userMsg];

    if (targetPath) {
      // Add custom redirect message and trigger countdown
      const redirectMsg = {
        role: 'assistant' as const,
        content: ` **Navigation Intent Recognized!**\n\nI am redirecting you to the **${targetLabel}** in 3 seconds. Hang tight!`
      };
      setGlobalMessages((prev) => [...prev, redirectMsg]);
      nextMessages.push(redirectMsg);
      
      setNavTarget(targetPath);
      setCountdownVal(3);
      setCountdownActive(true);
    }

    try {
      // Fetch AI response concurrently
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const botMsg = data.choices?.[0]?.message || {
          role: 'assistant',
          content: 'I am here to assist you. If you need any help, let me know!'
        };
        setGlobalMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error(err);
      if (!targetPath) {
        setGlobalMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'I apologize, I had trouble reaching the PulseGrid AI network. Please try again.' }
        ]);
      }
    } finally {
      setGlobalChatLoading(false);
    }
  };

  // PulseGrid AI Chat States
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! I am your PulseGrid Telemedicine AI assistant. Feel free to describe any symptoms you are experiencing today, and I will assist you with supportive information and telemedicine recommendations."
    }
  ]);
  const [inputSymptom, setInputSymptom] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymptom.trim() || isChatLoading) return;

    const userMsg = { role: 'user' as const, content: inputSymptom };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputSymptom('');
    setIsChatLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reach PulseGrid AI');
      }

      const botMsg = data.choices?.[0]?.message || {
        role: 'assistant',
        content: 'I apologize, but I am having trouble connecting to my reasoning engine right now. Please seek medical help if your symptoms are urgent.'
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: ' **Connection Error**\n\nCould not connect to the PulseGrid AI. Please verify that your backend server is active and your API key is configured.'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // PulseGrid Nutrition AI Chat States
  const [nutritionMessages, setNutritionMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! I am your PulseGrid Nutritionist AI. Share your nutritional goals, weight milestones, or ask for meal plan recommendations, and I will draft a personalized diet plan for you."
    }
  ]);
  const [inputNutrition, setInputNutrition] = useState('');
  const [isNutritionLoading, setIsNutritionLoading] = useState(false);
  const nutritionEndRef = useRef<HTMLDivElement>(null);

  const handleSendNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNutrition.trim() || isNutritionLoading) return;

    const userMsg = { role: 'user' as const, content: inputNutrition };
    setNutritionMessages((prev) => [...prev, userMsg]);
    setInputNutrition('');
    setIsNutritionLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          type: 'nutrition', // Parameter to trigger the nutritionist system message
          messages: [...nutritionMessages, userMsg],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reach PulseGrid AI');
      }

      const botMsg = data.choices?.[0]?.message || {
        role: 'assistant',
        content: 'I apologize, but I am having trouble connecting to my diet planning engine. Please try again soon.'
      };
      setNutritionMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setNutritionMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: ' **Connection Error**\n\nCould not connect to the PulseGrid Nutrition AI. Please verify that your backend server is active.'
        }
      ]);
    } finally {
      setIsNutritionLoading(false);
    }
  };

  useEffect(() => {
    nutritionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [nutritionMessages, isNutritionLoading]);

  useEffect(() => {
    if (token) {
      loadAppointments();
    }
  }, [token]);

  const loadAppointments = async () => {
    try {
      const data = await fetchTelemedicineAppointments(token!);
      const upcoming = data.filter(a => a.status === 'SCHEDULED' || a.status === 'ACTIVE');
      setAppointments(upcoming);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSOS = () => {
    if (!window.confirm('ARE YOU SURE? This will dispatch emergency services to your location immediately.')) return;

    setSosStatus('PENDING');
    
    if (!navigator.geolocation) {
      setSosStatus('ERROR');
      setSosError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await triggerSOS(
            token!,
            position.coords.latitude,
            position.coords.longitude,
            'Emergency SOS triggered from Patient Dashboard'
          );
          setSosStatus('SUCCESS');
          // Reset after 10 seconds or stay success
          setTimeout(() => setSosStatus('IDLE'), 10000);
        } catch (error: any) {
          setSosStatus('ERROR');
          setSosError(error.message || 'Failed to trigger SOS');
        }
      },
      (error) => {
        setSosStatus('ERROR');
        setSosError('Please enable location access to trigger SOS.');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Patient Dashboard</h2>
          <p className="text-slate-400 font-medium">Monitoring your health in real-time.</p>
        </div>
      </div>

      {/* Emergency SOS Banner - High Priority */}
      <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 shadow-2xl ${
        sosStatus === 'PENDING' ? 'bg-amber-500/20 border-amber-500 animate-pulse' :
        sosStatus === 'SUCCESS' ? 'bg-emerald-500/20 border-emerald-500 animate-in zoom-in-95' :
        sosStatus === 'ERROR' ? 'bg-rose-500/20 border-rose-500' :
        'bg-rose-600 border-white/10 hover:border-white/20'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-black text-white mb-2">
              {sosStatus === 'IDLE' && 'Emergency SOS Service'}
              {sosStatus === 'PENDING' && 'Locating You...'}
              {sosStatus === 'SUCCESS' && 'Help is on the Way!'}
              {sosStatus === 'ERROR' && 'Emergency Alert Failed'}
            </h3>
            <p className="text-white/80 font-medium text-lg">
              {sosStatus === 'IDLE' && 'Immediate medical dispatch to your current GPS coordinates.'}
              {sosStatus === 'PENDING' && 'Connecting to the nearest emergency dispatch center.'}
              {sosStatus === 'SUCCESS' && 'Ambulance has been dispatched. Please stay where you are.'}
              {sosStatus === 'ERROR' && sosError}
            </p>
          </div>
          <button 
            onClick={handleSOS}
            disabled={sosStatus === 'PENDING' || sosStatus === 'SUCCESS'}
            className={`px-12 py-6 rounded-[2rem] text-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-90 ${
              sosStatus === 'IDLE' ? 'bg-white text-rose-600 hover:bg-slate-100' :
              sosStatus === 'PENDING' ? 'bg-amber-500 text-white cursor-wait' :
              sosStatus === 'SUCCESS' ? 'bg-emerald-500 text-white' :
              'bg-white text-rose-600'
            }`}
          >
            {sosStatus === 'IDLE' && ' Request SOS'}
            {sosStatus === 'PENDING' && ' Signaling'}
            {sosStatus === 'SUCCESS' && ' Dispatched'}
            {sosStatus === 'ERROR' && 'Retry SOS'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Upcoming Consultations */}
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-bold text-white flex items-center gap-3">
             <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
             Upcoming Consultations
           </h3>
           <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="p-8 bg-slate-900 rounded-3xl border border-white/5 animate-pulse text-slate-500">Synchronizing...</div>
              ) : appointments.length === 0 ? (
                <div className="p-12 bg-slate-900 rounded-3xl border border-white/5 text-center opacity-30">
                   <p className="text-4xl mb-4"></p>
                   <p className="font-bold">No sessions scheduled.</p>
                </div>
              ) : (
                appointments.map(appt => (
                  <div key={appt.id} className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-xl">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl border border-indigo-500/20 shadow-inner">
                        
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                          Dr. {appt.doctor?.doctorProfile?.fullName || 'Specialist'}
                        </h4>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                          {new Date(appt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} • May {new Date(appt.scheduledTime).getDate()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/patient/telemedicine/${appt.id}`)}
                      className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                        appt.status === 'ACTIVE' 
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 animate-pulse' 
                          : 'bg-white/5 hover:bg-white/10 text-slate-400'
                      }`}
                    >
                      {appt.status === 'ACTIVE' ? 'Join Now' : 'Enter Room'}
                    </button>
                  </div>
                ))
              )}
           </div>
            {/* PulseGrid Nutritionist AI Card (Left/Middle Column) */}
            <div className="space-y-6 flex flex-col h-[520px]">
                         <h3 className="text-xl font-bold text-white flex items-center gap-3">
                           <span className="w-2 h-8 bg-emerald-500 rounded-full animate-pulse"></span>
                           PulseGrid Nutrition & Diet AI
                         </h3>
                         <div className="flex-1 bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl min-h-0">
                           
                           {/* Chat Log */}
                           <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                             {nutritionMessages.map((msg, index) => (
                               <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                                   msg.role === 'user'
                                     ? 'bg-emerald-600 text-white rounded-tr-none'
                                     : 'bg-slate-950 border border-white/5 text-slate-200 rounded-tl-none whitespace-pre-line'
                                 }`}>
                                   {msg.content}
                                 </div>
                               </div>
                             ))}
                             {isNutritionLoading && (
                               <div className="flex justify-start">
                                 <div className="bg-slate-950 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 text-emerald-400">
                                   <div className="flex gap-1">
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0s' }} />
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                                   </div>
                                   Drafting diet plan...
                                 </div>
                               </div>
                             )}
                             <div ref={nutritionEndRef} />
                           </div>
            
                           {/* Input Form */}
                           <form onSubmit={handleSendNutrition} className="border-t border-white/5 p-4 bg-slate-950 flex gap-2">
                             <input
                               type="text"
                               placeholder="Type food goals (e.g. build muscle, vegan diet)..."
                               value={inputNutrition}
                               onChange={(e) => setInputNutrition(e.target.value)}
                               className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                             />
                             <button
                               disabled={isNutritionLoading}
                               type="submit"
                               className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                             >
                               Send
                             </button>
                           </form>
                         </div>
                      </div>

        </div>

        {/* Right Sidebar: AI Helpers */}
        <div className="space-y-8 lg:col-span-1 flex flex-col">
          
          {/* PulseGrid Telemedicine AI Card */}
          <div className="space-y-6 flex flex-col h-[520px]">
             <h3 className="text-xl font-bold text-white flex items-center gap-3">
               <span className="w-2 h-8 bg-cyan-500 rounded-full animate-pulse"></span>
               PulseGrid Telemedicine AI
             </h3>
             <div className="flex-1 bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl min-h-0">
               
               {/* Chat Log */}
               <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                 {chatMessages.map((msg, index) => (
                   <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                       msg.role === 'user'
                         ? 'bg-cyan-600 text-white rounded-tr-none'
                         : 'bg-slate-950 border border-white/5 text-slate-200 rounded-tl-none whitespace-pre-line'
                     }`}>
                       {msg.content}
                     </div>
                   </div>
                 ))}
                 {isChatLoading && (
                   <div className="flex justify-start">
                     <div className="bg-slate-950 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 text-cyan-400">
                       <div className="flex gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0s' }} />
                         <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                         <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                       </div>
                       Formulating advice...
                     </div>
                   </div>
                 )}
                 <div ref={chatEndRef} />
               </div>

               {/* Input Form */}
               <form onSubmit={handleSendSymptom} className="border-t border-white/5 p-4 bg-slate-950 flex gap-2">
                 <input
                   type="text"
                   placeholder="Type symptom (e.g. chest pain, fever)..."
                   value={inputSymptom}
                   onChange={(e) => setInputSymptom(e.target.value)}
                   className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                 />
                 <button
                   disabled={isChatLoading}
                   type="submit"
                   className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                 >
                   Send
                 </button>
               </form>
             </div>
          </div>

          {/* PulseGrid Nutritionist AI Card */}
          

        </div>
      </div>

      {/* FLOATING AI HEALTH COMPANION & NAVIGATOR */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Expandable Chat Capsule */}
        {isGlobalChatOpen && (
          <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[480px] bg-slate-950/95 border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col mb-4 animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-lg">
                  
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">PulseGrid Companion</h4>
                  <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mt-0.5">Clinical AI & Smart Navigator</p>
                </div>
              </div>
              <button 
                onClick={() => setIsGlobalChatOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center border border-white/5 active:scale-95 transition-all text-xs font-bold"
              >
                
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {globalMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-none ml-auto'
                      : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none mr-auto whitespace-pre-line'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Countdown / Redirection Card */}
              {countdownActive && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="text-xl"></span>
                    <div>
                      <p className="text-xs font-black text-white">Redirecting In Progress</p>
                      <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Navigating in {countdownVal} seconds...</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setCountdownActive(false);
                      setGlobalMessages(prev => [
                        ...prev,
                        { role: 'assistant', content: ' **Navigation Aborted.** How else can I assist you today?' }
                      ]);
                    }}
                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {globalChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 text-cyan-400">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                    Processing intent...
                  </div>
                </div>
              )}
              <div ref={globalChatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendGlobalMessage} className="p-4 bg-slate-900/40 border-t border-white/5 flex gap-2">
              <input
                type="text"
                placeholder="Type 'go to records', 'emergency', or ask clinical questions..."
                value={globalInput}
                onChange={(e) => setGlobalInput(e.target.value)}
                disabled={countdownActive}
                className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={globalChatLoading || countdownActive || !globalInput.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-95"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Pulsing Toggle Button */}
        <button
          onClick={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl relative transition-all active:scale-90 border ${
            isGlobalChatOpen 
              ? 'bg-rose-950 border-rose-500/30 text-rose-400 hover:bg-rose-900' 
              : 'bg-gradient-to-tr from-cyan-600 to-cyan-800 border-cyan-400/30 text-white hover:scale-105'
          }`}
          title="Open AI Companion & Smart Navigation"
        >
          {!isGlobalChatOpen && (
            <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping"></span>
          )}
          <span className="text-2xl">{isGlobalChatOpen ? '' : ''}</span>
        </button>
      </div>
    </div>
  );
};

export default PatientDashboard;
