// ============================================================
// PULSEGRID — REAL-TIME USER REGISTRATION & AUDIT CONSOLE
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getRecentAuditLogs } from '../../services/auditService';
import Button from '../../components/ui/Button';

interface PendingUser {
  id: string;
  name: string;
  role: string;
  email: string;
  applied: string;
  license: string;
}

interface RealAuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  time: string;
}

export const UserManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<RealAuditLog[]>([]);
  const [totalUserCount, setTotalUserCount] = useState(5);
  const [activeTab, setActiveTab] = useState<'pending' | 'audit'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Fetch real pending registrations from Prisma DB
  const fetchPendingUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/admin/pending-users', {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((user: any) => {
          let fullName = user.email;
          if (user.doctorProfile) fullName = user.doctorProfile.fullName;
          else if (user.hospitalAdminProfile) fullName = user.hospitalAdminProfile.fullName;
          else if (user.patientProfile) fullName = user.patientProfile.fullName;
          else if (user.ambulanceDriverProfile) fullName = user.ambulanceDriverProfile.fullName;
          else if (user.ruralVolunteerProfile) fullName = user.ruralVolunteerProfile.fullName;

          let lic = 'N/A';
          if (user.doctorProfile) lic = user.doctorProfile.medicalLicenseNumber || 'N/A';
          else if (user.hospitalAdminProfile) lic = user.hospitalAdminProfile.hospitalRegNumber || 'N/A';
          else if (user.ambulanceDriverProfile) lic = user.ambulanceDriverProfile.licenseNumber || 'N/A';

          return {
            id: user.id,
            name: fullName,
            email: user.email,
            role: user.roleId === 'doctor' ? 'Doctor' :
                  user.roleId === 'hospitalAdmin' ? 'Hospital Admin' :
                  user.roleId === 'patient' ? 'Patient' :
                  user.roleId === 'ambulanceDriver' ? 'Ambulance Driver' : 'Rural Volunteer',
            applied: new Date().toLocaleDateString(),
            license: lic
          };
        });
        setUsers(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
    }
  };

  // 2. Fetch real database Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const logs = await getRecentAuditLogs(40);
      const mapped = logs.map((log: any) => ({
        id: log.id,
        user: log.user,
        action: log.action,
        resource: log.resource,
        time: log.time
      }));
      setAuditLogs(mapped);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  // 3. Sync stats total user count
  const fetchTotalStats = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/admin/users', {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTotalUserCount(data.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchPendingUsers(), fetchAuditLogs(), fetchTotalStats()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle real-time database Approval
  const handleApprove = async (id: string, name: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/approve-user', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: id })
      });
      if (response.ok) {
        setToast(` ${name} registration has been approved in database.`);
        setTimeout(() => setToast(''), 3500);
        loadData();
      }
    } catch (err) {
      console.error('Failed to approve user:', err);
    }
  };

  // Handle real-time database Rejection
  const handleReject = async (id: string, name: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/reject-user', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: id, reason: 'Registration request rejected by Super Admin.' })
      });
      if (response.ok) {
        setToast(` ${name} registration has been rejected.`);
        setTimeout(() => setToast(''), 3500);
        loadData();
      }
    } catch (err) {
      console.error('Failed to reject user:', err);
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto text-slate-100">
      {/* Dynamic Toast popup */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-950 border border-emerald-500/30 rounded-2xl px-5 py-3.5 text-white shadow-2xl animate-fade-in font-bold text-xs">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <span className="text-3xl"></span> User Management Command
        </h1>
        <p className="text-slate-400 mt-1 font-semibold text-xs">
          Direct database connection. Validate medical credentials, authorize registration queues, and review system logs.
        </p>
      </div>

      {/* Real Statistics widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending Approvals', value: users.length, color: 'text-amber-400' },
          { label: 'Total Registered DB Users', value: totalUserCount, color: 'text-white' },
          { label: 'Active Hospital Nodes', value: 1, color: 'text-white' },
          { label: 'System Compliance Flagged', value: 0, color: 'text-rose-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 shadow-lg font-semibold">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-1 block font-black uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-white/5 mb-6">
        <nav className="flex gap-6">
          {[
            { key: 'pending', label: `Pending Approvals (${users.length})` },
            { key: 'audit', label: 'Live Audit Log Ledger' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`pb-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === t.key 
                  ? 'border-cyan-400 text-cyan-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-slate-400 font-bold italic">
           Querying SQLite database registries...
        </div>
      ) : activeTab === 'pending' ? (
        /* PENDING REGISTRATIONS LEDGER */
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-md">
              <span className="text-4xl"></span>
              <h3 className="text-white font-black text-sm">All Registrations Clear</h3>
              <p className="text-slate-500 text-xs font-semibold max-w-xs leading-relaxed">
                Database registry holds zero pending applications. All incoming healthcare accounts are authorized.
              </p>
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-cyan-500/20 transition-all shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {user.name[0]?.toUpperCase()}
                  </div>
                  <div className="space-y-1 font-semibold">
                    <p className="text-white font-black text-sm">{user.name}</p>
                    <p className="text-slate-400 text-xs font-mono">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px]">
                      <span className="bg-slate-950 text-cyan-400 border border-cyan-500/10 px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">{user.role}</span>
                      <span className="text-slate-500">License: <span className="text-slate-300 font-mono font-bold">{user.license}</span></span>
                      <span className="text-slate-500">Applied: <span className="text-slate-300">{user.applied}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 flex-shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleReject(user.id, user.name)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(user.id, user.name)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md"
                  >
                    Approve 
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* LIVE AUDIT LOG TABLE */
        <div className="bg-slate-950/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-md">
          <table className="w-full text-left text-xs font-semibold">
            <thead className="bg-slate-900/80 border-b border-white/5">
              <tr className="text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-4">Security User Principal</th>
                <th className="px-5 py-4">Action Event</th>
                <th className="px-5 py-4">Resource Target</th>
                <th className="px-5 py-4 text-right pr-6">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                    Audit log registry currently empty in SQLite DB.
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="px-5 py-4 text-slate-300 font-bold font-mono">{log.user}</td>
                    <td className="px-5 py-4">
                      <span className="text-[9px] font-black tracking-widest text-cyan-400 bg-cyan-950/50 border border-cyan-500/20 px-2.5 py-1 rounded-lg uppercase">{log.action}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium font-mono">{log.resource}</td>
                    <td className="px-5 py-4 text-slate-500 text-right pr-6">{log.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
