// ============================================================
// PULSEGRID — REAL-TIME STAFF MANAGEMENT MODULE
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';

// Datasets interfaces
interface DoctorAvailability {
  id: string;
  name: string;
  specialty: string;
  department: string;
  status: string;
  phone: string;
  roomAllocation?: string;
  assignedPatient?: string;
}

interface ShiftAssignment {
  id: string;
  staffName: string;
  role: 'Doctor' | 'Nurse';
  shiftType: string;
  day: string;
}

interface LeaveRequest {
  id: string;
  staffName: string;
  role: 'Doctor' | 'Nurse';
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
}

const StaffManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'availability' | 'roster' | 'leaves'>('availability');
  const { token } = useAuthStore();

  // Real-time synchronization states
  const [doctors, setDoctors] = useState<DoctorAvailability[]>([]);
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<any>(null);

  // Fetch initial persistent data from backend REST API
  const fetchInitialData = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
        setShifts(data.shifts);
        setLeaves(data.leaves);
      }
    } catch (err) {
      console.error("Error fetching initial staff data:", err);
    }
  };

  // Initialize Real-time Connection
  useEffect(() => {
    socketRef.current = io('http://localhost:4000');

    // Request active staff state from the backend
    socketRef.current.emit('get-staff-data');

    // Listen for state synchronization updates
    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    socketRef.current.on('staff-data-updated', (data: { doctors: DoctorAvailability[]; shifts: ShiftAssignment[]; leaves: LeaveRequest[] }) => {
      if (data) {
        setDoctors(data.doctors);
        setShifts(data.shifts);
        setLeaves(data.leaves);
      }
    });

    // Initial fetch from persistent database
    fetchInitialData();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // Forms / Modal States
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [allocationPatient, setAllocationPatient] = useState('');
  const [allocationRoom, setAllocationRoom] = useState('');
  const [allocationStatus, setAllocationStatus] = useState<'Available' | 'On Consultation' | 'In Surgery' | 'On Leave'>('Available');

  // New Roster Assignment Form States
  const [newRosterName, setNewRosterName] = useState('');
  const [newRosterRole, setNewRosterRole] = useState<'Doctor' | 'Nurse'>('Doctor');
  const [newRosterShift, setNewRosterShift] = useState<'Morning (08:00 - 16:00)' | 'Evening (16:00 - 00:00)' | 'Night (00:00 - 08:00)'>('Morning (08:00 - 16:00)');
  const [newRosterDay, setNewRosterDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');

  // New Leave Form States
  const [leaveName, setLeaveName] = useState('');
  const [leaveRole, setLeaveRole] = useState<'Doctor' | 'Nurse'>('Doctor');
  const [leaveType, setLeaveType] = useState<'Sick Leave' | 'Casual Leave' | 'Annual Leave'>('Sick Leave');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // --------------------------------------------------------
  // Handlers for Availability mapping (REST API driven)
  // --------------------------------------------------------
  const handleOpenAllocationModal = (doc: DoctorAvailability) => {
    setSelectedDocId(doc.id);
    setAllocationPatient(doc.assignedPatient || '');
    setAllocationRoom(doc.roomAllocation || '');
    setAllocationStatus(doc.status as any);
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;

    try {
      const response = await fetch(`http://localhost:4000/api/staff/doctor/${selectedDocId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: allocationStatus,
          assignedPatient: allocationPatient,
          roomAllocation: allocationRoom
        })
      });

      if (response.ok) {
        setSelectedDocId(null);
      }
    } catch (err) {
      console.error("Error saving allocation:", err);
    }
  };

  // --------------------------------------------------------
  // Handlers for Shift Rostering (REST API driven)
  // --------------------------------------------------------
  const handleAddRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRosterName.trim()) return;

    try {
      const response = await fetch('http://localhost:4000/api/staff/shift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          staffName: newRosterName,
          role: newRosterRole,
          shiftType: newRosterShift,
          day: newRosterDay
        })
      });

      if (response.ok) {
        setNewRosterName('');
      }
    } catch (err) {
      console.error("Error adding roster:", err);
    }
  };

  const handleRemoveRoster = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/api/staff/shift/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Error removing roster:", err);
    }
  };

  // --------------------------------------------------------
  // Handlers for Leave Management (REST API driven)
  // --------------------------------------------------------
  const handleApproveLeave = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/api/staff/leave/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'APPROVED' })
      });
    } catch (err) {
      console.error("Error approving leave:", err);
    }
  };

  const handleDeclineLeave = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/api/staff/leave/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'DECLINED' })
      });
    } catch (err) {
      console.error("Error declining leave:", err);
    }
  };

  const handleAddLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveName.trim() || !leaveStart || !leaveEnd || !leaveReason.trim()) return;

    try {
      const response = await fetch('http://localhost:4000/api/staff/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          staffName: leaveName,
          role: leaveRole,
          leaveType: leaveType,
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason
        })
      });

      if (response.ok) {
        setLeaveName('');
        setLeaveReason('');
        setLeaveStart('');
        setLeaveEnd('');
      }
    } catch (err) {
      console.error("Error adding leave request:", err);
    }
  };

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-7xl mx-auto">
      
      {/* Upper Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Staff Management</h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
            }`}>
              {isConnected ? '● Connected Live' : '○ Reconnecting...'}
            </span>
          </div>
          <p className="text-slate-400 font-medium mt-1">Doctor availability mapping, shift rosters, and leave approvals synced in real time.</p>
        </div>
      </div>

      {/* Roster / Allocations Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-2">Active Doctors Available</p>
          <h3 className="text-3xl font-black text-emerald-400">{doctors.filter(d => d.status === 'Available').length} / {doctors.length}</h3>
        </div>
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-2">Staff Currently In Surgery</p>
          <h3 className="text-3xl font-black text-rose-400">{doctors.filter(d => d.status === 'In Surgery').length}</h3>
        </div>
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-2">Pending Leave Requests</p>
          <h3 className="text-3xl font-black text-amber-400">{leaves.filter(l => l.status === 'PENDING').length}</h3>
        </div>
        <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-2">Active Roster Shifts</p>
          <h3 className="text-3xl font-black text-indigo-400">{shifts.length} Assigned</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5">
        <nav className="flex gap-8">
          <button 
            onClick={() => { setActiveTab('availability'); setSelectedDocId(null); }}
            className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'availability' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
             Doctor Availability Mapping
          </button>
          <button 
            onClick={() => { setActiveTab('roster'); setSelectedDocId(null); }}
            className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'roster' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
             Shift Roster Planning
          </button>
          <button 
            onClick={() => { setActiveTab('leaves'); setSelectedDocId(null); }}
            className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'leaves' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
             Leave Approval Desk
          </button>
        </nav>
      </div>

      {/* Tab Area Content */}
      <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* TAB 1: DOCTOR AVAILABILITY MAPPING */}
        {activeTab === 'availability' && (
          <div className="p-8 space-y-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
              Doctor Allocation & Availability
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              {doctors.map(doc => (
                <div key={doc.id} className="bg-slate-950 border border-white/5 p-6 rounded-[2rem] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 group hover:border-cyan-500/30 transition-all shadow-xl">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-3xl border border-cyan-500/20 shadow-inner">
                      
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{doc.name}</h4>
                        <span className="text-xs bg-slate-900 border border-white/5 px-2.5 py-1 rounded-lg text-slate-400 font-bold uppercase tracking-wider">
                          {doc.specialty}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm font-semibold mt-1">
                         Department: {doc.department} •  Contact: {doc.phone}
                      </p>
                      {doc.assignedPatient && (
                        <p className="text-cyan-400/80 text-xs font-black uppercase tracking-wider mt-2">
                           Assigned: {doc.assignedPatient} ({doc.roomAllocation})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                      doc.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      doc.status === 'In Surgery' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' :
                      doc.status === 'On Consultation' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {doc.status}
                    </span>

                    <button 
                      onClick={() => handleOpenAllocationModal(doc)}
                      className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-white/5 active:scale-95"
                    >
                      Update Allocation
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* In-tab allocation editor modal form */}
            {selectedDocId && (
              <div className="bg-slate-950 border border-cyan-500/30 p-8 rounded-[2.5rem] mt-8 animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-white">
                    Update Doctor Allocation: <span className="text-cyan-400">{doctors.find(d => d.id === selectedDocId)?.name}</span>
                  </h4>
                  <button onClick={() => setSelectedDocId(null)} className="text-slate-500 hover:text-white font-black">Close </button>
                </div>
                <form onSubmit={handleSaveAllocation} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Availability Status</label>
                    <select
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                      value={allocationStatus}
                      onChange={(e: any) => setAllocationStatus(e.target.value)}
                    >
                      <option value="Available">Available</option>
                      <option value="On Consultation">On Consultation</option>
                      <option value="In Surgery">In Surgery</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Assigned Patient (Optional)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                      placeholder="e.g. John Doe"
                      disabled={allocationStatus === 'Available' || allocationStatus === 'On Leave'}
                      value={allocationPatient}
                      onChange={(e) => setAllocationPatient(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Room / OT Allocation (Optional)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                      placeholder="e.g. Room-102 or OT-1"
                      disabled={allocationStatus === 'Available' || allocationStatus === 'On Leave'}
                      value={allocationRoom}
                      onChange={(e) => setAllocationRoom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Button type="submit" variant="primary" fullWidth>
                      Confirm Allocation
                    </Button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: SHIFT ROSTER PLANNING */}
        {activeTab === 'roster' && (
          <div className="p-8 space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                Roster Shift Assignments & Scheduling
              </h3>
            </div>

            {/* Shift Form and Active roster view grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Assign Roster Form */}
              <div className="lg:col-span-1 bg-slate-950 p-6 rounded-[2rem] border border-white/5 h-fit">
                <h4 className="text-lg font-bold text-white mb-6">Schedule Shift Assignment</h4>
                <form onSubmit={handleAddRoster} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Staff Member Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Nurse Carol Hathaway"
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                      value={newRosterName}
                      onChange={(e) => setNewRosterName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Staff Role Type</label>
                    <select
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      value={newRosterRole}
                      onChange={(e: any) => setNewRosterRole(e.target.value)}
                    >
                      <option value="Doctor">Doctor</option>
                      <option value="Nurse">Nurse</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Select Shift Timing</label>
                    <select
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      value={newRosterShift}
                      onChange={(e: any) => setNewRosterShift(e.target.value)}
                    >
                      <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                      <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                      <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Shift Day</label>
                    <select
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      value={newRosterDay}
                      onChange={(e: any) => setNewRosterDay(e.target.value)}
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                  <Button type="submit" variant="primary" fullWidth>
                    + Add to Shift Roster
                  </Button>
                </form>
              </div>

              {/* Roster Timeline List */}
              <div className="lg:col-span-2 space-y-4">
                {shifts.length === 0 ? (
                  <div className="p-12 border border-dashed border-white/5 rounded-3xl text-center opacity-30">
                    <p className="text-4xl mb-2"></p>
                    <p className="font-bold">No active roster assignments.</p>
                  </div>
                ) : (
                  shifts.map(sh => (
                    <div key={sh.id} className="bg-slate-950 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl border border-indigo-500/20">
                          {sh.role === 'Doctor' ? '' : ''}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">{sh.staffName}</h4>
                          <p className="text-slate-500 text-xs font-semibold mt-0.5">
                            ⏰ {sh.shiftType} • <span className="text-indigo-400 font-bold uppercase">{sh.day}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveRoster(sh.id)}
                        className="px-4 py-2 text-slate-500 hover:text-rose-500 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: LEAVE APPROVAL DESK */}
        {activeTab === 'leaves' && (
          <div className="p-8 space-y-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
              Leave Management & Approval Desk
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Apply / Request Leave Form */}
              <div className="lg:col-span-1 bg-slate-950 p-6 rounded-[2rem] border border-white/5 h-fit">
                <h4 className="text-lg font-bold text-white mb-6">File New Leave Request</h4>
                <form onSubmit={handleAddLeaveRequest} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Staff Member Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Nurse Carol Hathaway"
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                      value={leaveName}
                      onChange={(e) => setLeaveName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Role Type</label>
                    <select
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                      value={leaveRole}
                      onChange={(e: any) => setLeaveRole(e.target.value)}
                    >
                      <option value="Doctor">Doctor</option>
                      <option value="Nurse">Nurse</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Leave Category</label>
                    <select
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                      value={leaveType}
                      onChange={(e: any) => setLeaveType(e.target.value)}
                    >
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Annual Leave">Annual Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                        value={leaveStart}
                        onChange={(e) => setLeaveStart(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">End Date</label>
                      <input
                        type="date"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Leave Reason</label>
                    <textarea
                      rows={3}
                      placeholder="Specify medical or personal reasons..."
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all resize-none"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" fullWidth>
                    Submit Leave Request
                  </Button>
                </form>
              </div>

              {/* Right Column: Interactive Leave Queue Table */}
              <div className="lg:col-span-2 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-950 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Staff Member</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Leave Details</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Reason / Note</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaves.map(lv => (
                      <tr key={lv.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{lv.role === 'Doctor' ? '' : ''}</span>
                            <div>
                              <p className="font-bold text-white">{lv.staffName}</p>
                              <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5">{lv.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-900 border border-white/5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300">
                            {lv.leaveType}
                          </span>
                          <p className="text-[10px] text-slate-500 font-semibold mt-2">
                            {lv.startDate} to {lv.endDate}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate" title={lv.reason}>
                          {lv.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            lv.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            lv.status === 'DECLINED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {lv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {lv.status === 'PENDING' ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApproveLeave(lv.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors active:scale-95"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDeclineLeave(lv.id)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors active:scale-95"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">Archived</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default StaffManagement;
