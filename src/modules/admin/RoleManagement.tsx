// ============================================================
// PULSEGRID — ROLE-BASED ACCESS CONTROL & SECURITY POLICIES
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

interface RolePermissions {
  telemedicine: boolean;
  sos: boolean;
  records: boolean;
  prescribe: boolean;
  pharmacy: boolean;
  audit: boolean;
}

interface SystemConfig {
  [roleId: string]: RolePermissions;
}

interface SecurityPolicies {
  mfaRequired: boolean;
  passwordRotationDays: number;
  sessionTimeoutMinutes: number;
  ipRestrictionEnabled: boolean;
  auditRetentionMonths: number;
}

export const RoleManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [rbacConfig, setRbacConfig] = useState<SystemConfig | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('doctor');
  const [policies, setPolicies] = useState<SecurityPolicies | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');
  
  // Custom role creation modal state
  const [isCustomRoleModalOpen, setIsCustomRoleModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    description: '',
    templateRoleId: 'doctor'
  });

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Fetch persistent role permissions and security policies from backend
  const fetchRbacAndPolicies = async () => {
    if (!token) return;
    try {
      const [rolesRes, policiesRes] = await Promise.all([
        fetch('http://localhost:4000/api/admin/roles', { headers: getHeaders() }),
        fetch('http://localhost:4000/api/admin/security-policies', { headers: getHeaders() })
      ]);

      if (rolesRes.ok && policiesRes.ok) {
        const rolesData = await rolesRes.json();
        const policiesData = await policiesRes.json();
        setRbacConfig(rolesData);
        setPolicies(policiesData);
      }
    } catch (err) {
      console.error('Failed to query RBAC and security policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRbacAndPolicies();
  }, [token]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // 2. Commit role permission override in real-time
  const handleTogglePermission = async (permKey: keyof RolePermissions) => {
    if (!rbacConfig || !rbacConfig[selectedRoleId]) return;

    const currentVal = rbacConfig[selectedRoleId][permKey];
    const nextPermissions = {
      [permKey]: !currentVal
    };

    // Optimistically update frontend state
    setRbacConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [selectedRoleId]: {
          ...prev[selectedRoleId],
          [permKey]: !currentVal
        }
      };
    });

    try {
      const response = await fetch('http://localhost:4000/api/admin/roles/override', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          roleId: selectedRoleId,
          permissions: nextPermissions
        })
      });

      if (response.ok) {
        triggerToast(` Updated permission override for role: ${selectedRoleId.toUpperCase()}`);
      } else {
        triggerToast(' Failed to update permission override.');
        // Re-fetch to undo optimistic update
        fetchRbacAndPolicies();
      }
    } catch (err) {
      console.error(err);
      triggerToast(' Network connection error.');
      fetchRbacAndPolicies();
    }
  };

  // 3. Commit global security compliance policy updates
  const handleUpdatePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policies) return;

    try {
      const response = await fetch('http://localhost:4000/api/admin/security-policies', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(policies)
      });

      if (response.ok) {
        triggerToast(' Global security compliance policies updated in database.');
      } else {
        triggerToast(' Failed to update security policies.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Create custom role template
  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.name) return;

    // Simulate custom role addition to configuration state
    if (rbacConfig) {
      const cleanKey = newRoleForm.name.toLowerCase().replace(/\s+/g, '');
      const templatePerms = rbacConfig[newRoleForm.templateRoleId] || {
        telemedicine: false,
        sos: false,
        records: false,
        prescribe: false,
        pharmacy: false,
        audit: false
      };

      setRbacConfig(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [cleanKey]: { ...templatePerms }
        };
      });

      triggerToast(` Created custom role tier: ${newRoleForm.name}`);
      setSelectedRoleId(cleanKey);
      setIsCustomRoleModalOpen(false);
      setNewRoleForm({ name: '', description: '', templateRoleId: 'doctor' });
    }
  };

  const rolesDisplayNames: { [key: string]: string } = {
    superAdmin: 'Super Admin',
    hospitalAdmin: 'Hospital Admin',
    doctor: 'Doctor',
    patient: 'Patient',
    ambulanceDriver: 'Ambulance Driver',
    emergencyOperator: 'Emergency Operator',
    ruralVolunteer: 'Rural Volunteer'
  };

  const permissionLabels = [
    { key: 'telemedicine' as keyof RolePermissions, label: 'Telemedicine Workspace', desc: 'Allows launching clinical WebRTC audio/video consultations.', icon: '' },
    { key: 'sos' as keyof RolePermissions, label: 'Emergency SOS Command', desc: 'Allows receiving real-time SOS alerts and dispatching ambulances.', icon: '' },
    { key: 'records' as keyof RolePermissions, label: 'Patient Medical Charts', desc: 'Grants access to read/write medical history databases.', icon: '' },
    { key: 'prescribe' as keyof RolePermissions, label: 'Rx E-Prescribe Engine', desc: 'Enables writing prescriptions and downloading clinical PDFs.', icon: '' },
    { key: 'pharmacy' as keyof RolePermissions, label: 'Pharmacy Dispensary Access', desc: 'Allows dispatching medication orders directly to pharmacy terminals.', icon: '' },
    { key: 'audit' as keyof RolePermissions, label: 'Security & Privileged Auditing', desc: 'Enables consulting the global platform security action ledger.', icon: '' }
  ];

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
            <span className="text-3xl"></span> RBAC Permission Authority
          </h1>
          <p className="text-slate-400 mt-1 font-semibold text-xs">
            Fine-grained Role-Based Access Control (RBAC). Configure granular override flags or enforce system-wide compliance policies.
          </p>
        </div>
        <button
          onClick={() => setIsCustomRoleModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex-shrink-0"
        >
           Create Custom Role Tier
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-slate-400 font-bold italic">
           Syncing security policies and RBAC controls from SQLite DB...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* LEFT COLUMN: Role Directory */}
          <div className="lg:col-span-1 bg-slate-950/40 border border-white/5 p-5 rounded-[2rem] flex flex-col space-y-4 shadow-md">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">System Role Directory</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Select a role to inspect or override its permissions.</p>
            </div>
            
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {rbacConfig && Object.keys(rbacConfig).map((roleKey) => (
                <button
                  key={roleKey}
                  onClick={() => setSelectedRoleId(roleKey)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center ${
                    selectedRoleId === roleKey
                      ? 'bg-cyan-950/50 border-cyan-500/20 text-cyan-400 shadow-md font-bold'
                      : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-white/10 hover:bg-slate-900/60 font-semibold'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">
                    {rolesDisplayNames[roleKey] || roleKey.toUpperCase()}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-slate-400 rounded-lg border border-white/5 font-mono uppercase">
                    {Object.values(rbacConfig[roleKey]).filter(Boolean).length} Active
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* MIDDLE COLUMN: Granular Permission Switches */}
          <div className="lg:col-span-2 bg-slate-950/40 border border-white/5 p-5 rounded-[2rem] flex flex-col space-y-5 shadow-md justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span></span> Permissions Overrides: <span className="text-cyan-400 font-black">{rolesDisplayNames[selectedRoleId] || selectedRoleId.toUpperCase()}</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Overrides committed in this panel take effect immediately across all active sessions.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rbacConfig && rbacConfig[selectedRoleId] && permissionLabels.map((perm) => {
                  const isEnabled = rbacConfig[selectedRoleId][perm.key];
                  return (
                    <div
                      key={perm.key}
                      onClick={() => handleTogglePermission(perm.key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none ${
                        isEnabled
                          ? 'bg-cyan-950/30 border-cyan-500/25 hover:border-cyan-500/40'
                          : 'bg-slate-900/30 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{perm.icon}</span>
                          <h4 className="text-xs font-black text-white">{perm.label}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{perm.desc}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${isEnabled ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {isEnabled ? 'Authorized ' : 'Blocked '}
                        </span>
                        
                        {/* Switch visual toggler */}
                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-all ${isEnabled ? 'bg-cyan-500' : 'bg-slate-800'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all transform ${isEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl text-[10px] text-slate-400 leading-relaxed font-semibold">
               <span className="text-cyan-400 font-bold uppercase">Compliance Alert</span>: This dashboard manages HIPAA-compliant role capabilities. Modifying overrides registers a trace index in the system database for privileged audit reviews.
            </div>
          </div>

          {/* FULL WIDTH BOTTOM: Global Security Policies */}
          <div className="lg:col-span-3 bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] shadow-md">
            <div className="mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span></span> Global Security & Platform Compliance Policies
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Enforce system-wide encryption, login rules, and database retention schemas.</p>
            </div>

            {policies && (
              <form onSubmit={handleUpdatePolicies} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
                
                {/* MFA & IP whitelist */}
                <div className="space-y-4 bg-slate-900/40 border border-white/5 p-5 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-white">Multi-Factor Auth (MFA)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Require Google Auth verification.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={policies.mfaRequired}
                      onChange={e => setPolicies({...policies, mfaRequired: e.target.checked})}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>

                  <hr className="border-white/5" />

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-white">IP Whitelist Restriction</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Allow connections from registered VPNs only.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={policies.ipRestrictionEnabled}
                      onChange={e => setPolicies({...policies, ipRestrictionEnabled: e.target.checked})}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Expiration limits */}
                <div className="space-y-4 bg-slate-900/40 border border-white/5 p-5 rounded-2xl">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Password Rotation Period</label>
                    <select
                      value={policies.passwordRotationDays}
                      onChange={e => setPolicies({...policies, passwordRotationDays: parseInt(e.target.value) || 90})}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                    >
                      <option value="30">Every 30 Days</option>
                      <option value="90">Every 90 Days</option>
                      <option value="180">Every 180 Days</option>
                      <option value="999">Never Expire</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Session Idle Timeout</label>
                    <select
                      value={policies.sessionTimeoutMinutes}
                      onChange={e => setPolicies({...policies, sessionTimeoutMinutes: parseInt(e.target.value) || 30})}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">60 Minutes</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>
                </div>

                {/* DB retention & save */}
                <div className="space-y-4 bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Audit Trails DB Retention</label>
                    <select
                      value={policies.auditRetentionMonths}
                      onChange={e => setPolicies({...policies, auditRetentionMonths: parseInt(e.target.value) || 12})}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                    >
                      <option value="6">6 Months Retention</option>
                      <option value="12">12 Months (Standard HIPAA)</option>
                      <option value="24">24 Months Extended</option>
                      <option value="999">Permanent Ledger</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                  >
                     Save Global Policies
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>
      )}

      {/* CUSTOM ROLE CREATION MODAL */}
      {isCustomRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] max-w-sm w-full p-6 space-y-6 shadow-2xl animate-fade-in text-xs font-semibold">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-white">Create Custom Role Tier</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Initialize a custom permission tier template.</p>
              </div>
              <button onClick={() => setIsCustomRoleModalOpen(false)} className="text-slate-500 hover:text-white text-base font-bold">×</button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Custom Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attending Trainee"
                  value={newRoleForm.name}
                  onChange={e => setNewRoleForm({...newRoleForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Description & Scope</label>
                <input
                  type="text"
                  placeholder="Attending clinics scope template..."
                  value={newRoleForm.description}
                  onChange={e => setNewRoleForm({...newRoleForm, description: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Inherit Baseline Template From</label>
                <select
                  value={newRoleForm.templateRoleId}
                  onChange={e => setNewRoleForm({...newRoleForm, templateRoleId: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 font-bold"
                >
                  <option value="doctor">Attending Doctor Profile</option>
                  <option value="hospitalAdmin">Hospital Admin Profile</option>
                  <option value="patient">Patient Portal baseline</option>
                  <option value="ambulanceDriver">Ambulance Driver profile</option>
                </select>
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCustomRoleModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                >
                  Create Tier 
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
