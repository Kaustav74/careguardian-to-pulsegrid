// ============================================================
// PULSEGRID — COMPLIANCE & CYBER SECURITY AUDIT LEDGER
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

interface AuditLogDetail {
  id: string;
  email: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  timestamp: string;
}

interface SuspiciousAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'ANOMALY';
  event: string;
  location: string;
  ipAddress: string;
  time: string;
}

export const AuditLogManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [logs, setLogs] = useState<AuditLogDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Live suspicious login alerts calculated dynamically from database
  const [suspiciousAlerts, setSuspiciousAlerts] = useState<SuspiciousAlert[]>([]);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Fetch detailed system audit logs from SQLite
  const fetchAuditLogs = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/admin/audit-logs', {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data as AuditLogDetail[]);
      }
    } catch (err) {
      console.error('Failed to query system audit ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch live suspicious logins from dynamic analyzer
  const fetchSuspiciousLogins = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/admin/suspicious-logins', {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSuspiciousAlerts(data as SuspiciousAlert[]);
      }
    } catch (err) {
      console.error('Failed to fetch login anomalies:', err);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchAuditLogs(), fetchSuspiciousLogins()]);
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Toggle expanding JSON details block
  const handleToggleRow = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  // 3. Enforce real IP blockade inside system firewall (Write to SQLite AuditLog)
  const handleBlockIP = async (ipAddress: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/ip-blockade', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ipAddress })
      });

      if (response.ok) {
        triggerToast(` IP block established! Registered firewall exception for ${ipAddress}.`);
        // Refresh dynamically to show newly logged block in audit ledger
        await loadAllData();
      } else {
        triggerToast(' Failed to establish IP block.');
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Connection error establishing IP block.');
    }
  };

  // 4. Operational HIPAA Compliance CSV Export Engine
  const handleExportCSV = () => {
    if (logs.length === 0) {
      triggerToast(' Audit log ledger is currently empty.');
      return;
    }

    // Build CSV content
    const headers = ['Audit ID', 'User Principal', 'Role Tier', 'Action Event', 'Resource Class', 'Target Record', 'Operation Metadata', 'Timestamp'];
    const rows = logs.map(l => [
      l.id,
      l.email,
      l.role,
      l.action,
      l.resourceType,
      l.resourceId,
      JSON.stringify(l.details || {}).replace(/"/g, '""'),
      new Date(l.timestamp).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create Blob and trigger file download in browser
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PulseGrid_HIPAA_Compliance_Audit_Trail_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast(' HIPAA audit trail exported & downloaded successfully!');
  };

  // Filter logs by search query and category selector
  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resourceType.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedActionFilter === 'All') return matchesSearch;
    if (selectedActionFilter === 'AUTH') return matchesSearch && (l.action.includes('USER') || l.action.includes('LOGIN') || l.action.includes('VPN'));
    if (selectedActionFilter === 'CLINICAL') return matchesSearch && (l.action.includes('PRESCRIPTION') || l.action.includes('TRANSFER') || l.action.includes('SIG'));
    if (selectedActionFilter === 'SYSTEM') return matchesSearch && (l.action.includes('POLICY') || l.action.includes('REBALANCING') || l.action.includes('HOSPITAL'));
    
    return matchesSearch;
  });

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto text-slate-100 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-950 border border-cyan-500/30 rounded-2xl px-5 py-3.5 text-white shadow-2xl animate-fade-in font-bold text-xs">
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl"></span> Security & HIPAA Audit Ledger
          </h1>
          <p className="text-slate-400 mt-1 font-semibold text-xs">
            Review security-hardened activity indexes, track suspicious concurrent sessions, and export HIPAA compliance trails.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex-shrink-0 flex items-center gap-2"
        >
           Export HIPAA Audit Trail (CSV)
        </button>
      </div>

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Suspicious Logins Threat Tracker */}
        <div className="lg:col-span-1 bg-slate-950/40 border border-white/5 p-5 rounded-[2rem] flex flex-col space-y-4 shadow-md h-fit">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Live Intrusion Threat Map
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Real-time concurrent authentication anomalies.</p>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-500/20 rounded-lg font-black uppercase tracking-widest animate-pulse">
              SHIELD ON
            </span>
          </div>

          <div className="space-y-3">
            {suspiciousAlerts.length === 0 ? (
              <div className="text-slate-500 italic text-[10px] p-4 text-center">No anomalies calculated.</div>
            ) : (
              suspiciousAlerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className={`px-2 py-0.5 rounded-md ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-500/20 animate-pulse' :
                      alert.severity === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-500/20' :
                      'bg-slate-950 text-slate-400 border border-white/5'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-slate-500">{alert.time}</span>
                  </div>
                  <h4 className="text-xs font-black text-white leading-tight">{alert.event}</h4>
                  <div className="text-[10px] text-slate-400 font-mono font-semibold">
                    <div> Location: <span className="text-slate-200">{alert.location}</span></div>
                    <div> Terminal IP: <span className="text-slate-200">{alert.ipAddress}</span></div>
                  </div>
                  <button
                    onClick={() => handleBlockIP(alert.ipAddress)}
                    className="w-full mt-2 py-1.5 bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-white/5 hover:border-rose-500/20"
                  >
                     Block IP Session
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (Detailed Audit Ledger Table) */}
        <div className="lg:col-span-2 bg-slate-950/40 border border-white/5 p-6 rounded-[2rem] shadow-md space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span></span> Platform Audit Ledger
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Filter indices by category or search target email signatures.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 md:w-44 bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-semibold"
              />
              <select
                value={selectedActionFilter}
                onChange={e => setSelectedActionFilter(e.target.value)}
                className="bg-slate-900 border border-white/5 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 font-bold"
              >
                <option value="All">All Tiers</option>
                <option value="AUTH">Authentication</option>
                <option value="SYSTEM">System Policy</option>
                <option value="CLINICAL">Clinical Rx</option>
              </select>
            </div>
          </div>

          <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-900/20">
            {isLoading ? (
              <div className="text-center p-12 text-slate-400 font-bold italic">
                 Fetching HIPAA activity indexes from DB...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center p-12 text-slate-500 font-bold italic">
                No matching operations found.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-1">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <div key={log.id} className="transition-all hover:bg-slate-900/10">
                      
                      {/* Interactive Header Row */}
                      <div
                        onClick={() => handleToggleRow(log.id)}
                        className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer text-xs font-semibold select-none"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-black">{log.email}</span>
                            <span className="px-1.5 py-0.5 bg-slate-950 text-cyan-400 border border-cyan-500/10 rounded-md text-[9px] font-black uppercase tracking-wider">
                              {log.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-slate-300 font-mono tracking-widest">{log.action}</span>
                            <span>•</span>
                            <span>Target: <span className="font-mono text-slate-300">{log.resourceType}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-slate-500 hover:text-white transition-all transform rotate-90">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>

                      {/* Expandable JSON details box */}
                      {isExpanded && (
                        <div className="px-4 pb-4 animate-fade-in">
                          <div className="bg-slate-950 p-4 border border-white/5 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                              <span>Raw DB Log Identifier: {log.id}</span>
                              <span className="text-cyan-400 font-bold">Details Meta Matrix</span>
                            </div>
                            <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed overflow-x-auto max-w-full p-2 bg-slate-900/60 rounded-lg">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl text-[10px] text-slate-400 leading-relaxed font-semibold">
             <span className="text-cyan-400 font-bold uppercase">HIPAA Accountability Standard</span>: Platform audit tracking is automated by SQLite triggers and cannot be bypassed or modified by administrator keys. All indices are securely hashed.
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuditLogManagement;
