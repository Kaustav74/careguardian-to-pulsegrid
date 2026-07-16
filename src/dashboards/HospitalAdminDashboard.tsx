// ============================================================
// PULSEGRID — HOSPITAL ADMIN DASHBOARD & REAL-TIME STATS
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import DashboardWidget from '../components/ui/DashboardWidget';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

interface ActivityLog {
  time: string;
  action: string;
  staff: string;
  category: 'Allocation' | 'Leave' | 'Roster' | 'Ambulance';
}

const DEPARTMENTS = [
  { name: 'Emergency & Trauma', utilization: 94, color: 'bg-rose-500', icon: '' },
  { name: 'General Medicine', utilization: 82, color: 'bg-cyan-500', icon: '' },
  { name: 'Neurology', utilization: 75, color: 'bg-purple-500', icon: '' },
  { name: 'Cardiology', utilization: 60, color: 'bg-amber-500', icon: '' },
  { name: 'Pediatrics', utilization: 45, color: 'bg-emerald-500', icon: '' },
];

const RECENT_ACTIVITIES: ActivityLog[] = [
  { time: '14:32', action: 'Allocated to patient Robert Chen in Room ICU-102', staff: 'Dr. Gregory House', category: 'Allocation' },
  { time: '12:15', action: 'Filed medical leave request for May 20 (Approved)', staff: 'Nurse Carol Hathaway', category: 'Leave' },
  { time: '09:00', action: 'Added to General Medicine Ward roster (Morning Shift)', staff: 'Nurse Abby Lockhart', category: 'Roster' },
  { time: '08:45', action: 'Dispatched unit to Sector 4 Highway trauma alert', staff: 'Ambulance Unit 3', category: 'Ambulance' },
];

const HospitalAdminDashboard: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  // Groq AI states for Department Utilization
  const [utilizationAI, setUtilizationAI] = useState<string | null>(null);
  const [isLoadingUtil, setIsLoadingUtil] = useState(false);
  const [errorUtil, setErrorUtil] = useState<string | null>(null);
  const [utilStep, setUtilStep] = useState('');

  // Groq AI states for Staff Activity
  const [staffAI, setStaffAI] = useState<string | null>(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [errorStaff, setErrorStaff] = useState<string | null>(null);
  const [staffStep, setStaffStep] = useState('');

  // Global Navigation AI Chat States
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [globalInput, setGlobalInput] = useState('');
  const [globalChatLoading, setGlobalChatLoading] = useState(false);
  const [globalMessages, setGlobalMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! I am your PulseGrid Admin Assistant. Ask me administrative questions, check operational stats, or describe what page you need to go to (e.g. 'go to staff rosters', 'open predictive analytics', 'view department settings'), and I will navigate you instantly!"
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

    if (textLower.includes('staff') || textLower.includes('roster') || textLower.includes('shift') || textLower.includes('leave') || textLower.includes('employee') || textLower.includes('nurse') || textLower.includes('doctor')) {
      targetPath = '/hospital/staff';
      targetLabel = 'Staff & Roster Planner ';
    } else if (textLower.includes('analytics') || textLower.includes('statistics') || textLower.includes('beds') || textLower.includes('predictive') || textLower.includes('forecast') || textLower.includes('combat')) {
      targetPath = '/hospital/analytics';
      targetLabel = 'Predictive Crisis Analytics ';
    } else if (textLower.includes('settings') || textLower.includes('department') || textLower.includes('inventory') || textLower.includes('supplies') || textLower.includes('buffer') || textLower.includes('config')) {
      targetPath = '/hospital/settings';
      targetLabel = 'Hospital Control Settings ';
    } else if (textLower.includes('patient') || textLower.includes('record') || textLower.includes('ehr') || textLower.includes('history') || textLower.includes('reports') || textLower.includes('prescription')) {
      targetPath = '/hospital/patients';
      targetLabel = 'Patient Directory Records ';
    } else if (textLower.includes('schedule') || textLower.includes('appointment') || textLower.includes('book') || textLower.includes('consultation')) {
      targetPath = '/hospital/schedule';
      targetLabel = 'Clinical Appointment Scheduler ';
    } else if (textLower.includes('emergency') || textLower.includes('sos') || textLower.includes('ambulance') || textLower.includes('dispatch') || textLower.includes('incident')) {
      targetPath = '/hospital/emergency';
      targetLabel = 'Emergency Operations Dispatch ';
    } else if (textLower.includes('dashboard') || textLower.includes('home') || textLower.includes('overview') || textLower.includes('kpi')) {
      targetPath = '/hospital/dashboard';
      targetLabel = 'Hospital Overview Dashboard ';
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
          type: 'analytics',
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

  // Call Groq AI for Utilization Diagnosis
  const handleRunUtilAI = async () => {
    setIsLoadingUtil(true);
    setErrorUtil(null);
    setUtilizationAI(null);

    const steps = [
      ' Querying active department bed counts...',
      ' Mapping trauma dispatch bottleneck variables...',
      ' Formulating clinical load-balancing plan via Groq...'
    ];

    let i = 0;
    setUtilStep(steps[0]);
    const interval = setInterval(() => {
      if (i < steps.length - 1) {
        i++;
        setUtilStep(steps[i]);
      }
    }, 1500);

    try {
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'analytics',
          messages: [
            { 
              role: 'user', 
              content: 'Provide a bottleneck diagnosis and load balancing recommendation for the following department utilization rates: Emergency: 94%, General Med: 82%, Neurology: 75%, Cardiology: 60%, Pediatrics: 45%.' 
            }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Groq evaluation failed.');

      setUtilizationAI(data.choices?.[0]?.message?.content || 'Empty audit received.');
    } catch (err: any) {
      setErrorUtil(err.message);
    } finally {
      clearInterval(interval);
      setIsLoadingUtil(false);
    }
  };

  // Call Groq AI for Staffing Fatigue Audit
  const handleRunStaffAI = async () => {
    setIsLoadingStaff(true);
    setErrorStaff(null);
    setStaffAI(null);

    const steps = [
      ' Fetching recent shift roster registry logs...',
      ' Calculating fatigue coefficients...',
      ' Compiling staff burnout mitigation strategy...'
    ];

    let i = 0;
    setStaffStep(steps[0]);
    const interval = setInterval(() => {
      if (i < steps.length - 1) {
        i++;
        setStaffStep(steps[i]);
      }
    }, 1500);

    try {
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'analytics',
          messages: [
            { 
              role: 'user', 
              content: 'Audit the recent staffing activity logs and shift allocations. Identify shift fatigue risks, verify roster scheduling stability, and generate actions.' 
            }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Groq audit failed.');

      setStaffAI(data.choices?.[0]?.message?.content || 'Empty audit received.');
    } catch (err: any) {
      setErrorStaff(err.message);
    } finally {
      clearInterval(interval);
      setIsLoadingStaff(false);
    }
  };

  // Render markdown parser helpers
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###') || line.startsWith('####')) {
        return <h4 key={i} className="text-sm font-black text-cyan-400 mt-4 mb-2 uppercase tracking-wider">{line.replace(/[#]/g, '').trim()}</h4>;
      }
      if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
        const content = line.replace(/^[\s*-]+/, '').trim();
        const boldParts = content.split('**');
        return (
          <li key={i} className="text-slate-300 text-xs font-semibold leading-relaxed ml-4 list-disc mt-1">
            {boldParts.map((part, index) => index % 2 === 1 ? <strong key={index} className="text-white font-extrabold">{part}</strong> : part)}
          </li>
        );
      }
      if (line.trim().startsWith('* [ ]') || line.trim().startsWith('- [ ]') || line.trim().startsWith('[ ]')) {
        const itemText = line.replace('* [ ]', '').replace('- [ ]', '').replace('[ ]', '').trim();
        return (
          <label key={i} className="flex items-start gap-2 bg-slate-900 border border-white/5 px-3 py-2 rounded-xl mt-1.5 cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-cyan-500 rounded border-white/10" />
            <span className="text-[11px] text-slate-300 font-semibold">{itemText}</span>
          </label>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-1"></div>;
      const boldParts = line.split('**');
      return (
        <p key={i} className="text-xs text-slate-400 leading-relaxed mt-1">
          {boldParts.map((part, index) => index % 2 === 1 ? <strong key={index} className="text-white font-black">{part}</strong> : part)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
           Hospital Admin Command
        </h2>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Key performance indexes, resource utilization charts, and active operational staff diagnostics.
        </p>
      </div>

      {/* Main KPI Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidget
          title="Admitted Patients"
          value="245"
          icon=""
          trend={{ value: 2, label: 'vs yesterday' }}
        />
        <DashboardWidget
          title="Available Beds"
          value="45"
          icon=""
        />
        <DashboardWidget
          title="Staff on Duty"
          value="128"
          icon=""
        />
        <DashboardWidget
          title="Pending ER"
          value="5"
          icon=""
          iconColor="text-rose-500 animate-pulse"
        />
      </div>

      {/* Analytics Charts & Live Auditor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL A: DEPARTMENT UTILIZATION SVG CHART */}
        <Card className="p-8 rounded-[2.5rem] bg-slate-900 border border-white/5 flex flex-col justify-between min-h-[500px]">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                 Department Utilization
              </h3>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                 Peak Bottleneck Threat
              </span>
            </div>

            {/* SVG Utilization Bar Chart */}
            <div className="space-y-4 pt-2">
              {DEPARTMENTS.map((dept, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span>{dept.icon}</span> {dept.name}
                    </span>
                    <span className={dept.utilization >= 80 ? 'text-rose-400 font-extrabold' : 'text-slate-400'}>
                      {dept.utilization}% Occupied
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/5 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        dept.utilization >= 90 ? 'bg-rose-500' :
                        dept.utilization >= 80 ? 'bg-amber-500' :
                        dept.utilization >= 60 ? 'bg-cyan-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${dept.utilization}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groq AI Utilization Audits panel */}
          <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            {errorUtil && <Alert variant="error" message={errorUtil} />}

            {isLoadingUtil && (
              <div className="bg-slate-950 border border-cyan-500/20 p-6 rounded-3xl flex flex-col items-center justify-center space-y-3 min-h-[160px]">
                <div className="w-7 h-7 border-3 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-[10px] text-cyan-400 font-black tracking-widest uppercase animate-pulse">{utilStep}</p>
              </div>
            )}

            {!isLoadingUtil && !utilizationAI && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-3xl border border-white/5">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Groq AI Workload Optimiser</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Let AI balance patient transfers and bed allocations.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleRunUtilAI}
                  className="!px-4 !py-2 text-[10px] uppercase font-black tracking-wider w-full sm:w-auto"
                >
                   Run AI Triage
                </Button>
              </div>
            )}

            {utilizationAI && (
              <div className="bg-slate-950 border border-cyan-500/30 p-5 rounded-3xl max-h-[220px] overflow-y-auto shadow-inner animate-in slide-in-from-bottom-5 text-left">
                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span> AI Bottleneck Audit Active
                  </span>
                  <button onClick={() => setUtilizationAI(null)} className="text-slate-600 hover:text-white text-xs font-bold">Clear </button>
                </div>
                <div className="space-y-3">
                  {renderMarkdown(utilizationAI)}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* PANEL B: RECENT STAFF ACTIVITY & AUDITOR */}
        <Card className="p-8 rounded-[2.5rem] bg-slate-900 border border-white/5 flex flex-col justify-between min-h-[500px]">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                 Recent Staff Activity
              </h3>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                 Connected Live
              </span>
            </div>

            {/* Real-time Activity Logs ledger */}
            <div className="space-y-3.5 pt-2">
              {RECENT_ACTIVITIES.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 hover:border-cyan-500/10 transition-colors">
                  <span className="text-lg">
                    {activity.category === 'Allocation' ? '' :
                     activity.category === 'Leave' ? '' :
                     activity.category === 'Roster' ? '⏰' : ''}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-white truncate">{activity.staff}</h4>
                      <span className="text-[9px] text-slate-500 font-bold">{activity.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-semibold">
                      {activity.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groq AI Staff Fatigue Audit Panel */}
          <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            {errorStaff && <Alert variant="error" message={errorStaff} />}

            {isLoadingStaff && (
              <div className="bg-slate-950 border border-cyan-500/20 p-6 rounded-3xl flex flex-col items-center justify-center space-y-3 min-h-[160px]">
                <div className="w-7 h-7 border-3 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-[10px] text-cyan-400 font-black tracking-widest uppercase animate-pulse">{staffStep}</p>
              </div>
            )}

            {!isLoadingStaff && !staffAI && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-3xl border border-white/5">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Groq AI Staffing Auditor</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Audit shift fatigue risks and check burnout threats.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleRunStaffAI}
                  className="!px-4 !py-2 text-[10px] uppercase font-black tracking-wider w-full sm:w-auto"
                >
                   Run AI Audit
                </Button>
              </div>
            )}

            {staffAI && (
              <div className="bg-slate-950 border border-cyan-500/30 p-5 rounded-3xl max-h-[220px] overflow-y-auto shadow-inner animate-in slide-in-from-bottom-5 text-left">
                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span> AI Staff Fatigue Audit Active
                  </span>
                  <button onClick={() => setStaffAI(null)} className="text-slate-600 hover:text-white text-xs font-bold">Clear </button>
                </div>
                <div className="space-y-3">
                  {renderMarkdown(staffAI)}
                </div>
              </div>
            )}
          </div>
        </Card>

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
                placeholder="Type 'go to rosters', 'analytics', or ask clinical questions..."
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

export default HospitalAdminDashboard;
