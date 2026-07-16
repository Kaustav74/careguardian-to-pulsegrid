// ============================================================
// PULSEGRID — INTERACTIVE NURSE CARE COMMAND CENTER
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DashboardWidget from '../components/ui/DashboardWidget';

interface WardBed {
  id: string;
  wardName: string;
  bedNumber: string;
  status: 'OCCUPIED' | 'VACANT';
  patientId?: string | null;
  patientName?: string | null;
  heartRate: number;
  bloodPressure: string;
  spo2: number;
  temperature: number;
  lastUpdated: string;
}

interface CareItem {
  id: string;
  patientName: string;
  careType: string;
  title: string;
  dosage: string;
  scheduledTime: string;
  status: 'PENDING' | 'COMPLETED';
}

interface ClinicalAlert {
  id: string;
  patientName: string;
  instruction: string;
  doctorName: string;
  priority: 'CRITICAL' | 'HIGH' | 'INFO';
  status: 'PENDING' | 'ACKNOWLEDGED';
  createdAt: string;
}

interface HandoverReport {
  id: string;
  outgoingNurseName: string;
  incomingNurseName: string;
  shiftType: string;
  handoverReport: string;
  criticalIncidents: string;
  createdAt: string;
}

const NurseDashboard: React.FC = () => {
  const { userProfile, token } = useAuthStore();

  // Tab State
  const [activeTab, setActiveTab] = useState<'monitor' | 'checklist' | 'alerts' | 'handover'>('monitor');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Core Telemetry States
  const [beds, setBeds] = useState<WardBed[]>([]);
  const [careItems, setCareItems] = useState<CareItem[]>([]);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [handovers, setHandovers] = useState<HandoverReport[]>([]);

  // Action / Form States
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
    heartRate: '',
    bloodPressure: '',
    spo2: '',
    temperature: '',
  });

  const [shiftingBedId, setShiftingBedId] = useState<string | null>(null);
  const [targetBedId, setTargetBedId] = useState<string>('');

  const [handoverForm, setHandoverForm] = useState({
    incomingNurseName: '',
    shiftType: 'Morning',
    handoverReport: '',
    criticalIncidents: '',
  });

  const [handoverSuccess, setHandoverSuccess] = useState(false);

  // Fetch Dashboard Telemetry Data
  const fetchTelemetry = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Wards
      const wardsRes = await fetch('http://localhost:4000/api/nurse/wards', { headers });
      const wardsData = wardsRes.ok ? await wardsRes.json() : [];

      // Checklist
      const careRes = await fetch('http://localhost:4000/api/nurse/care-checklist', { headers });
      const careData = careRes.ok ? await careRes.json() : [];

      // Clinical Alerts
      const alertsRes = await fetch('http://localhost:4000/api/nurse/clinical-alerts', { headers });
      const alertsData = alertsRes.ok ? await alertsRes.json() : [];

      // Handovers History
      const handoversRes = await fetch('http://localhost:4000/api/nurse/handovers', { headers });
      const handoversData = handoversRes.ok ? await handoversRes.json() : [];

      setBeds(wardsData);
      setCareItems(careData);
      setAlerts(alertsData);
      setHandovers(handoversData);
    } catch (error) {
      console.error('Failed to sync nurse dashboard metrics:', error);
      setErrorMsg('Telemetry synchronization offline. Please retry or contact network administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTelemetry();
    }
  }, [token]);

  // Vitals Handler
  const openVitalsEditor = (bed: WardBed) => {
    setEditingBedId(bed.id);
    setVitalsForm({
      heartRate: bed.heartRate.toString(),
      bloodPressure: bed.bloodPressure,
      spo2: bed.spo2.toString(),
      temperature: bed.temperature.toString(),
    });
  };

  const handleUpdateVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBedId) return;

    try {
      const response = await fetch('http://localhost:4000/api/nurse/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bedId: editingBedId,
          ...vitalsForm,
        }),
      });

      if (response.ok) {
        const updatedBed = await response.json();
        setBeds((prev) => prev.map((b) => (b.id === updatedBed.id ? updatedBed : b)));
        setEditingBedId(null);
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to update patient vitals');
      }
    } catch (err) {
      alert('Network error updating vitals');
    }
  };

  // Bed Shifting Handler
  const handleShiftBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftingBedId || !targetBedId) return;

    try {
      const response = await fetch('http://localhost:4000/api/nurse/beds/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceBedId: shiftingBedId,
          targetBedId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBeds(data.beds);
        setShiftingBedId(null);
        setTargetBedId('');
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to move patient');
      }
    } catch (err) {
      alert('Network error shifting beds');
    }
  };

  // Care Items Completion
  const handleCompleteCareItem = async (itemId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/nurse/care-checklist/${itemId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setCareItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      }
    } catch (err) {
      alert('Network error completing item');
    }
  };

  // Alert Acknowledgement
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/nurse/clinical-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedAlert = await response.json();
        setAlerts((prev) => prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)));
      }
    } catch (err) {
      alert('Network error acknowledging alert');
    }
  };

  // Automated Handover Report Compiler
  const handleAutoCompileReport = () => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED');
    const vacantBeds = beds.filter((b) => b.status === 'VACANT');
    const pendingMedications = careItems.filter((i) => i.status === 'PENDING').length;
    const completedMedications = careItems.filter((i) => i.status === 'COMPLETED').length;
    const activeDoctorAlerts = alerts.filter((a) => a.status === 'PENDING').length;

    let patientTelemetryStr = '';
    occupiedBeds.forEach((b) => {
      const spo2Alert = b.spo2 < 95 ? ' SpO2 LOW' : 'Normal';
      const hrAlert = b.heartRate > 100 || b.heartRate < 60 ? ' HR ABNORMAL' : 'Normal';
      patientTelemetryStr += `- Bed ${b.bedNumber} [${b.wardName}]: ${b.patientName} (HR: ${b.heartRate} bpm, BP: ${b.bloodPressure}, SpO2: ${b.spo2}%, Temp: ${b.temperature}°F) [HR Status: ${hrAlert}, SpO2 Status: ${spo2Alert}]\n`;
    });

    const reportBody = `### NURSING SHIFT WARD TELEMETRY SUMMARY
- **Ward Bed Capacity**: ${occupiedBeds.length} / ${totalBeds} Occupied (${vacantBeds.length} vacant slots)
- **Active Clinical Doctor Alerts**: ${activeDoctorAlerts} Pending Action
- **Medications Checked**: ${completedMedications} Administered, ${pendingMedications} Pending

### PATIENT PHYSIOLOGICAL STATUS OVERVIEW
${occupiedBeds.length > 0 ? patientTelemetryStr : 'No active patient ward admissions in this sector.'}

### RECOMMENDATIONS FOR INCOMING TEAM
- Monitor all clinical alarms promptly.
- Complete pending medications administration on time.
- Standard protocol vital recordings scheduled for midnight.`;

    setHandoverForm((prev) => ({
      ...prev,
      handoverReport: reportBody,
    }));
  };

  // Handover Submit
  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverForm.incomingNurseName || !handoverForm.handoverReport) {
      alert('Please fill out Incoming Nurse Name and Handover Report details.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/nurse/handovers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          outgoingNurseName: userProfile?.displayName || 'Carol Hathaway',
          ...handoverForm,
        }),
      });

      if (response.ok) {
        const newReport = await response.json();
        setHandovers((prev) => [newReport, ...prev].slice(0, 10));
        setHandoverSuccess(true);
        setHandoverForm({
          incomingNurseName: '',
          shiftType: 'Morning',
          handoverReport: '',
          criticalIncidents: '',
        });
        setTimeout(() => setHandoverSuccess(false), 5000);
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to submit shift handover');
      }
    } catch (err) {
      alert('Network error submitting shift handover');
    }
  };

  // Statistics calculation for KPI cards
  const occupiedBedsCount = beds.filter((b) => b.status === 'OCCUPIED').length;
  const vacantBedsCount = beds.filter((b) => b.status === 'VACANT').length;
  const activeAlertsCount = alerts.filter((a) => a.status === 'PENDING').length;
  const completedMedsCount = careItems.filter((i) => i.status === 'COMPLETED').length;
  const totalMedsCount = careItems.length;

  if (isLoading && beds.length === 0) {
    return (
      <div className="p-12 text-slate-400 font-bold italic text-center animate-pulse">
         Synchronizing Ward Telemetry & Active Patient Vitals...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2.5">
            <span></span> Nurse Command Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            On-Duty Nurse: <span className="text-cyan-400 font-bold">{userProfile?.displayName || 'Carol Hathaway'}</span> • Roster Sector: Intensive Care & General Ward
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchTelemetry}
            className="bg-slate-900 border border-white/5 text-slate-300 hover:bg-slate-800 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2"
          >
             Sync Telemetry
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold">
           {errorMsg}
        </div>
      )}

      {/* Primary KPI Deck */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardWidget
          title="Occupied Ward Beds"
          value={occupiedBedsCount.toString()}
          icon=""
          iconColor="text-cyan-400"
        />
        <DashboardWidget
          title="Vacant Beds"
          value={vacantBedsCount.toString()}
          icon=""
          iconColor="text-emerald-400"
        />
        <DashboardWidget
          title="Active Doctor Alerts"
          value={activeAlertsCount.toString()}
          icon=""
          iconColor={activeAlertsCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}
        />
        <DashboardWidget
          title="Meds Administered"
          value={`${completedMedsCount}/${totalMedsCount}`}
          icon=""
          iconColor="text-purple-400"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900/50 border border-white/5 rounded-2xl scrollbar-hide">
        {[
          { id: 'monitor', label: 'Patient Monitor Desk', icon: '' },
          { id: 'checklist', label: 'Daily Care Checklist', icon: '' },
          { id: 'alerts', label: 'Clinical Alert Panel', icon: '' },
          { id: 'handover', label: 'Shift Handover Console', icon: '' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner'
                : 'text-slate-400 hover:bg-white/5 border border-transparent'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Tab 1: Patient Monitor Desk */}
        {activeTab === 'monitor' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Ward Layout & Patient Monitoring
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time view of ICU / General Ward occupied states, vital telemetry, and patient bed movements.
                </p>
              </div>
            </div>

            {/* Bed Actions / Modal Area in Page */}
            {editingBedId && (
              <div className="bg-slate-900 border border-cyan-500/30 p-6 rounded-3xl space-y-4 animate-fade-in shadow-xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h4 className="text-base font-black text-white">
                     Vital Signs Entry • Bed {beds.find((b) => b.id === editingBedId)?.bedNumber} ({beds.find((b) => b.id === editingBedId)?.patientName})
                  </h4>
                  <button onClick={() => setEditingBedId(null)} className="text-slate-400 hover:text-white">
                    Cancel
                  </button>
                </div>
                <form onSubmit={handleUpdateVitals} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={vitalsForm.heartRate}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Blood Pressure</label>
                    <input
                      type="text"
                      value={vitalsForm.bloodPressure}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
                      placeholder="e.g. 120/80"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">SpO2 (%)</label>
                    <input
                      type="number"
                      value={vitalsForm.spo2}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalsForm.temperature}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-2 pt-2">
                    <Button type="button" onClick={() => setEditingBedId(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white">
                      Save Vital Telemetry
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {shiftingBedId && (
              <div className="bg-slate-900 border border-purple-500/30 p-6 rounded-3xl space-y-4 animate-fade-in shadow-xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h4 className="text-base font-black text-white">
                     Shifting Patient • Bed {beds.find((b) => b.id === shiftingBedId)?.bedNumber} ({beds.find((b) => b.id === shiftingBedId)?.patientName})
                  </h4>
                  <button onClick={() => setShiftingBedId(null)} className="text-slate-400 hover:text-white">
                    Cancel
                  </button>
                </div>
                <form onSubmit={handleShiftBed} className="flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Select Vacant Bed Destination</label>
                    <select
                      value={targetBedId}
                      onChange={(e) => setTargetBedId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Vacant Bed --</option>
                      {beds
                        .filter((b) => b.status === 'VACANT')
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            Bed {b.bedNumber} - {b.wardName} (Vacant)
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => setShiftingBedId(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white" disabled={!targetBedId}>
                      Execute Shift Movement
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Bed Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beds.map((bed) => {
                const isOccupied = bed.status === 'OCCUPIED';
                const isPulseAbnormal = isOccupied && (bed.heartRate > 100 || bed.heartRate < 60);
                const isSpO2Abnormal = isOccupied && bed.spo2 < 95;
                const isTempAbnormal = isOccupied && (bed.temperature > 100.4 || bed.temperature < 97.0);

                return (
                  <div
                    key={bed.id}
                    className={`bg-slate-950/40 border rounded-[2rem] p-6 hover:scale-[1.01] transition-all duration-300 shadow-md flex flex-col justify-between ${
                      isOccupied
                        ? isPulseAbnormal || isSpO2Abnormal
                          ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50'
                          : 'border-white/5 hover:border-cyan-500/30'
                        : 'border-dashed border-white/10 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Bed Status Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant={isOccupied ? 'success' : 'neutral'}>
                            {isOccupied ? 'OCCUPIED' : 'VACANT'}
                          </Badge>
                          <h4 className="text-lg font-black text-white mt-2">
                            Bed {bed.bedNumber}
                          </h4>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                            {bed.wardName}
                          </p>
                        </div>
                        <span className="text-3xl">{isOccupied ? '' : ''}</span>
                      </div>

                      {/* Bed Details */}
                      {isOccupied ? (
                        <div className="space-y-3">
                          <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Admitted Patient</span>
                            <p className="text-base font-black text-white mt-0.5">{bed.patientName}</p>
                          </div>

                          {/* Physiological Telemetry Panel */}
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className={`p-2.5 rounded-xl border ${
                              isPulseAbnormal
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                                : 'bg-slate-900/40 border-white/5 text-slate-300'
                            }`}>
                              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">HR</span>
                              <span className="text-sm font-black">{bed.heartRate}</span> <span className="text-[9px]">bpm</span>
                            </div>
                            <div className="p-2.5 rounded-xl border bg-slate-900/40 border-white/5 text-slate-300">
                              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">BP</span>
                              <span className="text-xs font-black leading-6">{bed.bloodPressure}</span>
                            </div>
                            <div className={`p-2.5 rounded-xl border ${
                              isSpO2Abnormal
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                                : 'bg-slate-900/40 border-white/5 text-slate-300'
                            }`}>
                              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">SpO2</span>
                              <span className="text-sm font-black">{bed.spo2}</span> <span className="text-[9px]">%</span>
                            </div>
                            <div className={`p-2.5 rounded-xl border ${
                              isTempAbnormal
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-slate-900/40 border-white/5 text-slate-300'
                            }`}>
                              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Temp</span>
                              <span className="text-sm font-black">{bed.temperature}</span> <span className="text-[9px]">°F</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900/20 border border-dashed border-white/5 rounded-2xl p-6 text-center text-slate-500 italic text-xs">
                          Bed vacant. Ready for incoming patient intake or ward movements.
                        </div>
                      )}
                    </div>

                    {/* Operational Commands */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                      {isOccupied ? (
                        <>
                          <button
                            onClick={() => openVitalsEditor(bed)}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider text-cyan-400 transition-all"
                          >
                             Enter Vitals
                          </button>
                          <button
                            onClick={() => setShiftingBedId(bed.id)}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider text-purple-400 transition-all"
                          >
                             Shift Bed
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center text-[10px] text-emerald-400/70 font-black uppercase tracking-widest bg-emerald-500/5 py-2 rounded-xl border border-emerald-500/10">
                           Open Allocation Slot
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Daily Care Checklist */}
        {activeTab === 'checklist' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-white">Daily Medication & Care Timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sequential tracker for medication administrations (IV/Injections/Pills) and scheduled clinical checkups.
              </p>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 shadow-xl space-y-4">
              {careItems.length > 0 ? (
                <div className="space-y-3">
                  {careItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-950 border rounded-2xl transition-all ${
                        item.status === 'COMPLETED'
                          ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70'
                          : 'border-white/5 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.careType === 'IV'
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-cyan-500/10 text-cyan-400'
                        }`}>
                          {item.status === 'COMPLETED' ? '' : item.careType === 'IV' ? '' : ''}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-bold text-sm">{item.title}</h4>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                              ({item.careType})
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">
                            Patient: <span className="text-white">{item.patientName}</span> • Dosage: <span className="text-cyan-400">{item.dosage}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 md:mt-0 w-full md:w-auto justify-between md:justify-end border-t border-white/5 md:border-t-0 pt-2 md:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Scheduled</span>
                          <span className="text-xs text-slate-300 font-bold">{item.scheduledTime}</span>
                        </div>
                        {item.status === 'PENDING' ? (
                          <Button
                            onClick={() => handleCompleteCareItem(item.id)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg active:scale-95"
                          >
                            Mark Completed
                          </Button>
                        ) : (
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            Administered
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 italic text-sm">
                  No care checklist items registered for this sector shift.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Clinical Alert Panel */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-white">Clinical Escalations & Physician Alerts</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Incoming directive feed compiled directly from active doctor prescriptions and emergency ward triggers.
              </p>
            </div>

            <div className="space-y-4">
              {alerts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {alerts.map((alertItem) => {
                    const isCritical = alertItem.priority === 'CRITICAL';
                    const isHigh = alertItem.priority === 'HIGH';
                    const isPending = alertItem.status === 'PENDING';

                    return (
                      <div
                        key={alertItem.id}
                        className={`border p-5 rounded-[2rem] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                          !isPending
                            ? 'bg-slate-900/30 border-white/5 opacity-60'
                            : isCritical
                            ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50'
                            : isHigh
                            ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                            : 'bg-slate-950/40 border-white/5 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-widest rounded-lg ${
                                isCritical
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                                  : isHigh
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                              }`}
                            >
                              {alertItem.priority} DIRECTIVE
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              Patient: {alertItem.patientName}
                            </span>
                          </div>
                          <p className="text-sm font-black text-white leading-relaxed">{alertItem.instruction}</p>
                          <p className="text-xs text-slate-400 font-bold">
                            Issued by: <span className="text-cyan-400">{alertItem.doctorName}</span> • {new Date(alertItem.createdAt).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="flex-shrink-0 w-full md:w-auto flex justify-end">
                          {isPending ? (
                            <Button
                              onClick={() => handleAcknowledgeAlert(alertItem.id)}
                              className={`text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl ${
                                isCritical
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                  : 'bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-200'
                              }`}
                            >
                              Acknowledge Directives
                            </Button>
                          ) : (
                            <Badge variant="success">ACKNOWLEDGED</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 text-center text-slate-500 italic text-sm">
                  Clinical directive registry clear. No pending warnings found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Shift Handover Console */}
        {activeTab === 'handover' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Submission Form Column */}
              <div className="lg:col-span-3 space-y-6">
                <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">Record Shift Handover</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submit ward reports, pending care reminders, and incident summaries for the next incoming nursing shift.
                    </p>
                  </div>

                  {handoverSuccess && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold animate-fade-in">
                       Handover recorded successfully. Past history log synched.
                    </div>
                  )}

                  <form onSubmit={handleSubmitHandover} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Incoming Nurse Name</label>
                        <input
                          type="text"
                          value={handoverForm.incomingNurseName}
                          onChange={(e) => setHandoverForm({ ...handoverForm, incomingNurseName: e.target.value })}
                          placeholder="e.g. Abby Lockhart"
                          className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Shift Sector Type</label>
                        <select
                          value={handoverForm.shiftType}
                          onChange={(e) => setHandoverForm({ ...handoverForm, shiftType: e.target.value })}
                          className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                        >
                          <option value="Morning">Morning Shift</option>
                          <option value="Evening">Evening Shift</option>
                          <option value="Night">Night Shift</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Handover Summary Report</label>
                        <button
                          type="button"
                          onClick={handleAutoCompileReport}
                          className="text-[9px] font-black text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 px-2.5 py-1 rounded-lg border border-cyan-500/10 transition-all uppercase tracking-widest"
                        >
                           Auto-Compile Ward Telemetry
                        </button>
                      </div>
                      <textarea
                        value={handoverForm.handoverReport}
                        onChange={(e) => setHandoverForm({ ...handoverForm, handoverReport: e.target.value })}
                        rows={8}
                        placeholder="Select Auto-Compile or enter detailed patient handover states..."
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Critical Incidents / Special Alerts (Optional)</label>
                      <textarea
                        value={handoverForm.criticalIncidents}
                        onChange={(e) => setHandoverForm({ ...handoverForm, criticalIncidents: e.target.value })}
                        rows={2}
                        placeholder="e.g. Critical alarm trigger at 14:00 (Resolved) or leave empty if None."
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-2xl w-full md:w-auto shadow-lg shadow-cyan-600/10">
                        Submit Shift Handover Log
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>

              {/* History Timeline Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">Shift Logs Archive</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Chronological list of recent shift handovers submitted in this sector.</p>
                    </div>

                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                      {handovers.length > 0 ? (
                        handovers.map((item) => (
                          <div key={item.id} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-black text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-lg mr-2 uppercase">
                                  {item.shiftType}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold italic">
                                ID: {item.id.slice(-6).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-white/5">
                              <p className="text-white font-bold">
                                Outgoing: <span className="text-cyan-400">{item.outgoingNurseName}</span>
                              </p>
                              <p className="text-white font-bold">
                                Incoming: <span className="text-emerald-400">{item.incomingNurseName}</span>
                              </p>
                              {item.criticalIncidents && item.criticalIncidents !== 'None' && (
                                <p className="text-rose-400 font-semibold text-[10px] mt-1">
                                   Incident: {item.criticalIncidents}
                                </p>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap font-mono p-2 border border-white/5 rounded-xl bg-slate-950/20">
                              {item.handoverReport}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500 italic text-xs">
                          No previous shift handover records available.
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseDashboard;
