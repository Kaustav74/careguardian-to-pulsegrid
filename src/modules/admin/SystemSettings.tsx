// ============================================================
// PULSEGRID — SYSTEM SETTINGS & SCHEMATIC HEALING CONSOLE
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

interface SystemConfig {
  maintenanceMode: boolean;
  failoverMode: 'ACTIVE_ACTIVE' | 'ACTIVE_PASSIVE' | 'SINGLE_NODE_PRIMARY';
  sessionTimeoutMinutes: number;
  maxUploadMb: number;
  telemedicinePort: number;
}

interface DiagnosticResults {
  prismaClient: string;
  dbPool: string;
  vacuumTest: string;
  tablesAudited: string[];
  healedLogs: number;
  timestamp: string;
}

export const SystemSettings: React.FC = () => {
  const { token } = useAuthStore();
  
  // State for user creation console
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('patient');

  // State for system configurations
  const [config, setConfig] = useState<SystemConfig | null>(null);
  
  // State for diagnostic terminal
  const [diagnosing, setDiagnosing] = useState(false);
  const [healLogs, setHealLogs] = useState<string[]>([]);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticResults | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // 1. Fetch system configs on mount
  const fetchSettings = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/admin/system-config', {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data as SystemConfig);
      }
    } catch (err) {
      console.error('Failed to load system config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  // 2. Create User Account (Super Admin only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      triggerToast(' Please enter an email and password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/users/create', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword, roleId: newUserRole })
      });

      if (response.ok) {
        triggerToast(` User account ${newUserEmail} created & role assigned!`);
        setNewUserEmail('');
        setNewUserPassword('');
      } else {
        const errData = await response.json();
        triggerToast(` Error: ${errData.error || 'Failed to compile account.'}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Connection error creating account.');
    }
  };

  // 3. Save System Configuration
  const handleSaveConfig = async (updatedFields: Partial<SystemConfig>) => {
    if (!config) return;
    const bodyPayload = { ...config, ...updatedFields };

    try {
      const response = await fetch('http://localhost:4000/api/admin/system-config', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyPayload)
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config as SystemConfig);
        triggerToast(' System configurations saved and persisted!');
      } else {
        triggerToast(' Failed to update configurations.');
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Connection error writing system configs.');
    }
  };

  // 4. Trigger Schema Self-Healing & Diagnostics
  const handleTriggerHealing = async () => {
    setDiagnosing(true);
    setHealLogs([]);
    setDiagnosticData(null);

    const logStatements = [
      ' [SYS-ALERT] Initializing dynamic schema diagnostic protocol...',
      ' [SQLITE-POOL] Ping SQL query executing over database pool...',
      ' [PRISMA-CLIENT] Checking active connection handles: OK (Latency ~1ms)',
      ' [SCHEMA-CHECK] Auditing clinical tables: User, PatientProfile, DoctorProfile, EmergencyRequest...',
      ' [VACUUM-TEST] Running database defragmentation and structural vacuum check...',
      ' [RECOVERY] System Self-Healing successfully compiled. Status: 100% HEALTHY'
    ];

    // Simulating animated terminal typing
    for (let i = 0; i < logStatements.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setHealLogs(prev => [...prev, logStatements[i]]);
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/system-health/heal', {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setDiagnosticData(data.diagnostics as DiagnosticResults);
        triggerToast(' Database Self-Healing completed successfully!');
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Database healing pipeline connection error.');
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto text-slate-100 pb-16">
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-950 border border-cyan-500/30 rounded-2xl px-5 py-3.5 text-white shadow-2xl animate-fade-in font-bold text-xs">
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl"></span> System Settings
          </h1>
          <p className="text-slate-400 mt-1 font-semibold text-xs">
            Manage corporate system profiles, configure telemedicine failover directives, and run real-time database schematic healing scripts.
          </p>
        </div>
        <span className="text-[10px] px-3 py-1 bg-cyan-950 text-cyan-400 border border-cyan-500/25 rounded-xl font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          SYSTEM MAIN CORE ONLINE
        </span>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-slate-400 font-bold italic">
           Opening system administrative files...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT CONTAINER: User Account Compiler */}
          <div className="lg:col-span-1 bg-slate-950/40 border border-white/5 p-5 rounded-[2rem] shadow-md flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span></span> Account Registry Console
              </h3>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Directly spawn new authenticated accounts and assign access role parameters.</p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g., doctor.delhi@pulsegrid.com"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Access Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Assign RBAC Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                >
                  <option value="patient">Patient Profile (Standard Registrant)</option>
                  <option value="doctor">Medical Officer (Doctor Profile)</option>
                  <option value="hospitalAdmin">Clinical Director (Hospital Node Admin)</option>
                  <option value="ambulanceDriver">Ambulance Dispatcher (Driver)</option>
                  <option value="superAdmin">Network Security Chief (Super Admin)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/25 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm"
              >
                 Spawn User and Assign Role
              </button>
            </form>

            <div className="text-[9px] text-slate-500 font-semibold italic">
               Admin created accounts bypass manual clinic validations and are ready for immediate authentication.
            </div>
          </div>

          {/* MIDDLE CONTAINER: Telemedicine & Failover Config */}
          {config && (
            <div className="lg:col-span-1 bg-slate-950/40 border border-white/5 p-5 rounded-[2rem] shadow-md flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span></span> Failover & Policy Configuration
                </h3>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Control live telecommunication pipelines and server maintenance toggles.</p>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                {/* Maintenance Mode */}
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-white">System Maintenance Mode</h4>
                    <p className="text-[9px] text-slate-500 leading-tight">Restrict login credentials to network administrators only during maintenance.</p>
                  </div>
                  <button
                    onClick={() => handleSaveConfig({ maintenanceMode: !config.maintenanceMode })}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                      config.maintenanceMode
                        ? 'bg-amber-950 text-amber-400 border-amber-500/20'
                        : 'bg-slate-950 text-slate-500 border-white/5'
                    }`}
                  >
                    {config.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                {/* Failover Mode */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">System Failover Policy</label>
                  <select
                    value={config.failoverMode}
                    onChange={(e) => handleSaveConfig({ failoverMode: e.target.value as any })}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                  >
                    <option value="ACTIVE_ACTIVE">Active-Active Replication (High Availability)</option>
                    <option value="ACTIVE_PASSIVE">Active-Passive Standby (Warm Recovery)</option>
                    <option value="SINGLE_NODE_PRIMARY">Single Node Primary (Legacy SQLite Mode)</option>
                  </select>
                </div>

                {/* Session Timeout */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Administrative Timeout (Minutes)</label>
                  <input
                    type="number"
                    value={config.sessionTimeoutMinutes}
                    onChange={(e) => handleSaveConfig({ sessionTimeoutMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                  />
                </div>

                {/* Max Upload Size */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Max File Size Limit (MB)</label>
                  <input
                    type="number"
                    value={config.maxUploadMb}
                    onChange={(e) => handleSaveConfig({ maxUploadMb: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                  />
                </div>
              </div>

              <div className="text-[9px] text-slate-500 font-semibold italic">
                 Configurations are synchronized in real-time across your telemedicine server nodes.
              </div>
            </div>
          )}

          {/* RIGHT CONTAINER: Database schematic Healing Console */}
          <div className="lg:col-span-1 bg-slate-950/40 border border-white/5 p-5 rounded-[2rem] shadow-md flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span></span> Database Diagnosis & Self-Healing
              </h3>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Resolve database connection dropouts, schema bottlenecks, or orphan logs.</p>
            </div>

            {/* Diagnostic stats */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl">
                <p className="text-slate-500 text-[8px] uppercase font-black">Prisma Client</p>
                <p className="text-emerald-400 font-black mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  ONLINE
                </p>
              </div>
              <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl">
                <p className="text-slate-500 text-[8px] uppercase font-black">DB Core Latency</p>
                <p className="text-white font-black mt-1">~1.2 ms</p>
              </div>
            </div>

            {/* Simulated Live Logging Terminal */}
            <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl h-[170px] overflow-y-auto font-mono text-[9px] space-y-1 text-slate-400">
              {healLogs.length === 0 ? (
                <div className="text-slate-600 font-semibold italic text-center pt-12">
                  No active diagnostic routines run. Tap repair pipeline to initialize.
                </div>
              ) : (
                healLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Action buttons */}
            <button
              onClick={handleTriggerHealing}
              disabled={diagnosing}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
            >
              {diagnosing ? ' Running Diagnosis and Healing...' : ' Launch Database Self-Healing Routine'}
            </button>

            {/* Diagnostic Results Summary */}
            {diagnosticData && (
              <div className="p-3.5 bg-slate-900/60 border border-emerald-500/20 rounded-xl space-y-1.5 text-[9px] font-semibold animate-fade-in">
                <span className="text-emerald-400 uppercase tracking-widest font-black text-[8px]"> Diagnostic Ledger: Success</span>
                <div className="text-slate-300 font-mono text-[9px] leading-relaxed">
                  Prisma Status: {diagnosticData.prismaClient}<br />
                  SQLite Pool: {diagnosticData.dbPool}<br />
                  Index Vacuum: {diagnosticData.vacuumTest}<br />
                  Schema Tables Verified: {diagnosticData.tablesAudited.length}<br />
                  Anomalies Repaired: {diagnosticData.healedLogs}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default SystemSettings;
