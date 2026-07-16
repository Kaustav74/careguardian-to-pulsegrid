// ============================================================
// PULSEGRID — SUPER ADMIN OPERATIONS COMMAND CENTER
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import DashboardWidget from '../components/ui/DashboardWidget';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  lastActive: string;
}

interface AuditLog {
  id: string;
  event: string;
  category: 'AUTH' | 'SYSTEM' | 'AI' | 'CLINICAL';
  timestamp: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const { token } = useAuthStore();

  // Telemetry Stats
  const [cpuLoad, setCpuLoad] = useState(42);
  const [memoryUsage, setMemoryUsage] = useState(58);
  const [networkTraffic, setNetworkTraffic] = useState<number[]>([40, 55, 48, 62, 70, 58, 65, 80, 75, 90]);

  // System Database Status
  const [activeSOSCount, setActiveSOSCount] = useState(0);
  const [totalRxCount, setTotalRxCount] = useState(0);

  // Real Database Users State
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Live Audit Ledger
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'LOG-102', event: 'Super Admin console synchronized with SQLite database.', category: 'SYSTEM', timestamp: 'Just Now' },
    { id: 'LOG-103', event: 'Prisma DB connection pooled successfully.', category: 'SYSTEM', timestamp: '2 min ago' },
    { id: 'LOG-104', event: 'Groq AI dispatch request processed for clinical desk.', category: 'AI', timestamp: '5 min ago' },
    { id: 'LOG-105', event: 'Leaflet Map engine synced with active Ambulance GPS.', category: 'SYSTEM', timestamp: '9 min ago' },
    { id: 'LOG-106', event: 'E-Prescription Rx-SIG issued with score 94.', category: 'CLINICAL', timestamp: '12 min ago' }
  ]);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Fetch real-world users directly from the SQLite backend database
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/admin/users', {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data as SystemUser[]);
      }
    } catch (err) {
      console.error('Failed to load real database users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync / Seed active system state on mount
  useEffect(() => {
    const syncState = () => {
      const localSOS = localStorage.getItem('cg_sos_alerts');
      if (localSOS) {
        setActiveSOSCount(JSON.parse(localSOS).length);
      }

      const localRx = localStorage.getItem('cg_prescriptions');
      if (localRx) {
        setTotalRxCount(JSON.parse(localRx).length);
      }
    };

    syncState();
    fetchUsers();

    window.addEventListener('pulsegrid-sos-update', syncState);
    window.addEventListener('pulsegrid-prescriptions-update', syncState);

    // 2. Simulate Real-time CPU & Memory updates
    const statInterval = setInterval(() => {
      setCpuLoad(prev => {
        const delta = Math.floor(Math.random() * 9) - 4; // -4% to +4%
        return Math.max(10, Math.min(95, prev + delta));
      });
      setMemoryUsage(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2% to +2%
        return Math.max(20, Math.min(90, prev + delta));
      });
    }, 3000);

    // 3. Simulate Real-time Network Traffic Graph shift
    const graphInterval = setInterval(() => {
      setNetworkTraffic(prev => {
        const nextVal = Math.max(15, Math.min(100, (prev[prev.length - 1] || 50) + (Math.floor(Math.random() * 25) - 12)));
        const nextArr = [...prev.slice(1), nextVal];

        // Append live audit logs corresponding to load changes
        if (nextVal > 80) {
          pushAuditLog('High server inquiry throughput detected.', 'SYSTEM');
        } else if (Math.random() > 0.7) {
          const events = [
            'API heartbeat verification completed successfully.',
            'Groq API operational healthcheck returned code 200.',
            'Ambulance telemetry ledger sync active.',
            'Database vacuum checklist cleared.'
          ];
          pushAuditLog(events[Math.floor(Math.random() * events.length)], 'SYSTEM');
        }

        return nextArr;
      });
    }, 4000);

    return () => {
      window.removeEventListener('pulsegrid-sos-update', syncState);
      window.removeEventListener('pulsegrid-prescriptions-update', syncState);
      clearInterval(statInterval);
      clearInterval(graphInterval);
    };
  }, [token]);

  // Push new audit log helper
  const pushAuditLog = (eventText: string, category: 'AUTH' | 'SYSTEM' | 'AI' | 'CLINICAL') => {
    setAuditLogs(prev => {
      const newLog: AuditLog = {
        id: `LOG-${Math.floor(200 + Math.random() * 800)}`,
        event: eventText,
        category,
        timestamp: 'Just Now'
      };
      return [newLog, ...prev.slice(0, 7)];
    });
  };

  // Toggle user account status (Real DB update)
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const response = await fetch('http://localhost:4000/api/admin/toggle-status', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, status: nextStatus })
      });
      
      if (response.ok) {
        pushAuditLog(`Suspension toggle executed for user ID ${userId.substring(0, 8)}`, 'AUTH');
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Approve pending roles (Real DB update)
  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/approve-user', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        pushAuditLog(`Authorized pending user registration for user ID ${userId.substring(0, 8)}`, 'AUTH');
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to approve user:', err);
    }
  };

  // Delete user from DB permanently (Real DB update)
  const handleDeleteUser = async (userId: string) => {
    if (confirm(`Are you sure you want to permanently delete this user from PulseGrid's SQLite database?`)) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });

        if (response.ok) {
          pushAuditLog(`Permanently purged user ID ${userId.substring(0, 8)} from database.`, 'AUTH');
          fetchUsers();
        }
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  // Recalculate dynamic SVG Chart coordinates
  const minVal = 0;
  const maxVal = 100;
  const range = maxVal - minVal;
  
  const coords = networkTraffic.map((val, idx) => {
    const x = (idx / (networkTraffic.length - 1)) * 440 + 20;
    const y = 140 - ((val - minVal) / range) * 110;
    return { x, y, val };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} 145 L ${coords[0].x} 145 Z`;

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
             Super Admin Operations Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            System Level: <span className="text-cyan-400 font-bold">ROOT-ACCESS</span> • SQLite Database Connection: Live
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 rounded-xl px-4 py-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          CORE TELEMETRY: OPERATIONAL
        </div>
      </div>

      {/* Dynamic Telemetry widget cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardWidget
          title="Server CPU Load"
          value={`${cpuLoad}%`}
          icon=""
          iconColor="text-cyan-400"
        />
        <DashboardWidget
          title="Active Memory Node"
          value={`${memoryUsage}%`}
          icon=""
          iconColor="text-purple-400"
        />
        <DashboardWidget
          title="Active Emergencies"
          value={activeSOSCount.toString()}
          icon=""
          iconColor="text-rose-500"
        />
        <DashboardWidget
          title="Clinical Rx Issued"
          value={totalRxCount.toString()}
          icon=""
          iconColor="text-emerald-400"
        />
      </div>

      {/* Primary Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Traffic Graph Panel */}
        <div className="lg:col-span-2 bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col space-y-4 shadow-md">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span></span> Server Requests & Traffic Core
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
              Live millisecond network inquiry throughput tracking.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-4 rounded-3xl relative">
            <div className="absolute top-4 left-4 flex gap-4 text-[9px] font-black uppercase tracking-wider text-slate-500">
              <div>Network Node: <span className="text-cyan-400">US-EAST-CARE</span></div>
              <div>Buffer: <span className="text-cyan-400">SYNCING LIVE</span></div>
            </div>

            <svg className="w-full h-44 overflow-visible mt-6" viewBox="0 0 480 150">
              <defs>
                <linearGradient id="adminAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[30, 60, 90, 120].map((y, idx) => (
                <line key={idx} x1="20" y1={y} x2="460" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              ))}

              {/* Area path */}
              <path d={areaPath} fill="url(#adminAreaGrad)" />

              {/* Line path */}
              <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />

              {/* Data points */}
              {coords.map((c, idx) => (
                <g key={idx} className="group">
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="3.5"
                    fill="#020617"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                </g>
              ))}

              <line x1="20" y1="145" x2="460" y2="145" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Core Service Connectors Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-3xl border border-white/5 text-xs font-semibold">
            <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] text-slate-500 block uppercase font-black">Prisma DB Connect</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>
            <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] text-slate-500 block uppercase font-black">Groq AI API Node</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] text-slate-500 block uppercase font-black">Leaflet GPS Server</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] text-slate-500 block uppercase font-black">Socket.io Signaller</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>
          </div>
        </div>

        {/* Live Audit Log Ledger Panel */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <Card className="flex-1 flex flex-col justify-between rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Live System Audit Logs</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Real-time system telemetry ledger.</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-cyan-950 text-cyan-400 rounded-lg font-black uppercase tracking-widest animate-pulse">
                  STREAMING
                </span>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                      <span className={`${
                        log.category === 'AI' ? 'text-purple-400' :
                        log.category === 'AUTH' ? 'text-amber-400' :
                        log.category === 'CLINICAL' ? 'text-emerald-400' : 'text-cyan-400'
                      }`}>
                        {log.category}
                      </span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {log.event}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* User Management Console */}
      <Card className="bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span></span> Global User Registry & RBAC Authority
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
              Direct connection to the SQLite database. Inspect active accounts, suspend credentials, or process registrations.
            </p>
          </div>
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search users by name, role, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-semibold"
            />
          </div>
        </div>

        <div className="border border-white/5 rounded-3xl overflow-hidden bg-slate-900/20">
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="bg-slate-900/80 border-b border-white/5 text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="p-3 pl-5">User Profile Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">RBAC Role</th>
                <th className="p-3">Last Active</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Syncing user registry from SQLite DB...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No matching users found in PulseGrid database.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="p-3 pl-5 font-black text-white">{user.name}</td>
                    <td className="p-3 text-slate-300 font-bold font-mono">{user.email}</td>
                    <td className="p-3 text-cyan-400 font-bold">{user.role}</td>
                    <td className="p-3 text-slate-400 font-medium">{user.lastActive}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        user.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                          : user.status === 'pending'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/20 animate-pulse'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3 pr-5 text-right space-x-2">
                      {user.status === 'pending' ? (
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                        >
                          Approve 
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            user.status === 'active'
                              ? 'bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {user.status === 'active' ? 'Suspend ' : 'Unsuspend '}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/5"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
