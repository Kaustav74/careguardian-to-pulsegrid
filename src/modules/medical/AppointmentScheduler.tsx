import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import { fetchTelemedicineAppointments, updateTelemedicineStatus, fetchDoctors, scheduleTelemedicineAppointment } from '../../services/telemedicineService';
import type { TelemedicineAppointment } from '../../types';

const AppointmentScheduler: React.FC = () => {
  const { userProfile, token } = useAuthStore();
  const navigate = useNavigate();
  const isDoctor = userProfile?.roleId === 'doctor';
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [appointments, setAppointments] = useState<TelemedicineAppointment[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Booking Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apptsData, docsData] = await Promise.all([
        fetchTelemedicineAppointments(token!),
        !isDoctor ? fetchDoctors(token!) : Promise.resolve([])
      ]);
      setAppointments(apptsData);
      setDoctors(docsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCall = async (id: string) => {
    try {
      await updateTelemedicineStatus(token!, id, 'ACTIVE');
      navigate(`/doctor/telemedicine/${id}`);
    } catch (error) {
      console.error('Failed to start call', error);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !token || !userProfile) return;

    setIsBooking(true);
    try {
      const scheduledTime = new Date(today.getFullYear(), today.getMonth(), selectedDate);
      const [hours, minutes] = bookingTime.split(':');
      scheduledTime.setHours(parseInt(hours), parseInt(minutes));

      await scheduleTelemedicineAppointment(
        token,
        userProfile.id,
        selectedDoctorId,
        scheduledTime,
        bookingNotes
      );
      
      setIsBookingModalOpen(false);
      loadData(); // Refresh list
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to book appointment.');
    } finally {
      setIsBooking(false);
    }
  };

  const daysInMonth = Array.from({ length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() }, (_, i) => i + 1);

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-white">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Appointments & Schedule</h1>
          <p className="text-slate-400 mt-1 font-medium">
            {isDoctor ? 'Manage your clinical queue and daily shifts.' : 'Book a virtual consultation with our specialists.'}
          </p>
        </div>
        {!isDoctor && (
          <button 
            onClick={() => setIsBookingModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
          >
            + New Appointment
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
        
        {/* Calendar Column */}
        <div className="lg:col-span-1 bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col shadow-inner">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-white">May 2026</h2>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            <div className="aspect-square"></div><div className="aspect-square"></div><div className="aspect-square"></div>
            <div className="aspect-square"></div><div className="aspect-square"></div>
            {daysInMonth.map((day) => {
              const hasAppt = appointments.some(a => new Date(a.scheduledTime).getDate() === day);
              const isSelected = selectedDate === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-sm font-bold transition-all relative ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-400/20' 
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {day}
                  {hasAppt && !isSelected && (
                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Schedule List Column */}
        <div className="lg:col-span-3 bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col overflow-hidden shadow-inner">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
            <h2 className="text-2xl font-black text-white">
              Schedule: <span className="text-indigo-400">May {selectedDate}</span>
            </h2>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {appointments.filter(a => new Date(a.scheduledTime).getDate() === selectedDate).length} Bookings
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold">Synchronizing...</p>
              </div>
            ) : appointments.filter(a => new Date(a.scheduledTime).getDate() === selectedDate).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                <span className="text-6xl mb-4"></span>
                <p className="text-xl font-bold">No sessions scheduled.</p>
                <p className="text-sm mt-2">Enjoy your free time or book a new one.</p>
              </div>
            ) : (
              appointments
                .filter(a => new Date(a.scheduledTime).getDate() === selectedDate)
                .map((appt) => {
                  const time = new Date(appt.scheduledTime);
                  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                  return (
                    <div key={appt.id} className="bg-black/40 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-indigo-500/30 transition-all hover:bg-black/60 shadow-lg">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex flex-col items-center justify-center border border-indigo-500/20">
                          <span className="text-xs font-black text-indigo-400">{timeStr.split(' ')[0]}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{timeStr.split(' ')[1]}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {isDoctor ? (appt.patient?.patientProfile?.fullName || 'Patient') : (`Dr. ${appt.doctor?.doctorProfile?.fullName || 'Specialist'}`)}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Telemedicine Room</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border ${
                          appt.status === 'ACTIVE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse' :
                          appt.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {appt.status}
                        </span>
                        
                        {(isDoctor && (appt.status === 'SCHEDULED' || appt.status === 'ACTIVE')) && (
                          <button 
                            onClick={() => handleStartCall(appt.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95"
                          >
                            Start Session
                          </button>
                        )}
                        {(!isDoctor && appt.status === 'ACTIVE') && (
                          <button 
                            onClick={() => navigate(`/patient/telemedicine/${appt.id}`)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95"
                          >
                            Join Room
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black mb-2">Book Appointment</h2>
            <p className="text-slate-400 mb-8 font-medium">Select a specialist and preferred time slot.</p>
            
            <form onSubmit={handleBooking} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Select Specialist</label>
                <select 
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>Dr. {doc.doctorProfile?.fullName || 'Unknown'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Date</label>
                  <div className="bg-black border border-white/10 rounded-2xl p-4 text-slate-400 font-bold">
                    May {selectedDate}, 2026
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Time Slot</label>
                  <input 
                    type="time" 
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Notes (Optional)</label>
                <textarea 
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Describe your symptoms..."
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white h-24 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isBooking}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all"
                >
                  {isBooking ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentScheduler;
