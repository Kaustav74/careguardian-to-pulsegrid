// ============================================================
// PULSEGRID — PATIENT DIRECTORY & EHR INTEGRATION
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { fetchPatientDocuments, uploadMedicalDocument } from '../../services/documentService';
import type { MedicalDocument } from '../../types';

// High-Fidelity Mock Patient Database
interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string;
  status: 'Stable' | 'Critical' | 'Under Observation';
  avatar: string;
  records: Array<{
    id: string;
    date: string;
    type: string;
    doctor: string;
    diagnosis: string;
    status: string;
  }>;
  vitals: Array<{
    label: string;
    value: string;
    unit: string;
    status: string;
  }>;
}

const MOCK_PATIENTS: PatientInfo[] = [
  {
    id: 'CG-PAT-9821',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: 'Penicillin, Peanuts',
    status: 'Stable',
    avatar: '',
    records: [
      { id: 'REC-001', date: '2023-10-15', type: 'Consultation', doctor: 'Dr. Meredith Grey', diagnosis: 'Acute Bronchitis', status: 'Closed' },
      { id: 'REC-002', date: '2023-11-02', type: 'Lab Test', doctor: 'Dr. Gregory House', diagnosis: 'Complete Blood Count', status: 'Results Ready' },
      { id: 'REC-003', date: '2024-01-20', type: 'Prescription', doctor: 'Dr. Derek Shepherd', diagnosis: 'Hypertension Management', status: 'Active' },
    ],
    vitals: [
      { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'normal' },
      { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'normal' },
      { label: 'Temperature', value: '98.6', unit: '°F', status: 'normal' },
      { label: 'SpO2', value: '99', unit: '%', status: 'normal' },
    ]
  },
  {
    id: 'CG-PAT-3321',
    name: 'Sarah Jenkins',
    age: 29,
    gender: 'Female',
    bloodGroup: 'A-',
    allergies: 'Sulfa drugs, Shellfish',
    status: 'Under Observation',
    avatar: '',
    records: [
      { id: 'REC-104', date: '2024-02-10', type: 'Emergency', doctor: 'Dr. Alex Karev', diagnosis: 'Acute Appendicitis', status: 'Closed' },
      { id: 'REC-105', date: '2024-02-11', type: 'Surgery', doctor: 'Dr. Meredith Grey', diagnosis: 'Appendectomy Post-Op', status: 'Closed' },
    ],
    vitals: [
      { label: 'Blood Pressure', value: '115/75', unit: 'mmHg', status: 'normal' },
      { label: 'Heart Rate', value: '80', unit: 'bpm', status: 'normal' },
      { label: 'Temperature', value: '99.1', unit: '°F', status: 'warning' },
      { label: 'SpO2', value: '98', unit: '%', status: 'normal' },
    ]
  },
  {
    id: 'CG-PAT-4490',
    name: 'Robert Chen',
    age: 62,
    gender: 'Male',
    bloodGroup: 'B+',
    allergies: 'Gluten',
    status: 'Critical',
    avatar: '',
    records: [
      { id: 'REC-208', date: '2024-03-01', type: 'Consultation', doctor: 'Dr. Gregory House', diagnosis: 'Type 2 Diabetes Mellitus', status: 'Active' },
      { id: 'REC-209', date: '2024-03-15', type: 'Cardiac Care', doctor: 'Dr. Cristina Yang', diagnosis: 'Mild Angina', status: 'Active' },
    ],
    vitals: [
      { label: 'Blood Pressure', value: '142/90', unit: 'mmHg', status: 'critical' },
      { label: 'Heart Rate', value: '88', unit: 'bpm', status: 'warning' },
      { label: 'Temperature', value: '98.4', unit: '°F', status: 'normal' },
      { label: 'SpO2', value: '95', unit: '%', status: 'warning' },
    ]
  },
  {
    id: 'CG-PAT-1085',
    name: 'Emily Taylor',
    age: 34,
    gender: 'Female',
    bloodGroup: 'AB+',
    allergies: 'None',
    status: 'Stable',
    avatar: '',
    records: [
      { id: 'REC-301', date: '2024-04-05', type: 'Lab Test', doctor: 'Dr. Gregory House', diagnosis: 'Thyroid Function Panel', status: 'Results Ready' },
    ],
    vitals: [
      { label: 'Blood Pressure', value: '110/70', unit: 'mmHg', status: 'normal' },
      { label: 'Heart Rate', value: '68', unit: 'bpm', status: 'normal' },
      { label: 'Temperature', value: '98.2', unit: '°F', status: 'normal' },
      { label: 'SpO2', value: '99', unit: '%', status: 'normal' },
    ]
  }
];

const PatientRecords: React.FC = () => {
  const { userProfile, token } = useAuthStore();
  const isDoctor = userProfile?.roleId === 'doctor' || userProfile?.roleId === 'hospitalAdmin';
  
  // Stateful Patients loaded from Database API
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  // Navigation states
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Stable' | 'Critical' | 'Under Observation'>('All');

  // Load patients dynamically
  useEffect(() => {
    const fetchPatients = async () => {
      if (!token) return;
      try {
        const response = await fetch('http://localhost:4000/api/admin/patients', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPatients(data as PatientInfo[]);
          
          // Role Scoping: If user is a patient, automatically lock them to their own record
          if (userProfile?.roleId === 'patient' && data.length > 0) {
            setSelectedPatient(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load patient records directory:', err);
      } finally {
        setIsLoadingPatients(false);
      }
    };
    fetchPatients();
  }, [token, userProfile]);

  // EHR Portal states
  const [activeTab, setActiveTab] = useState<'timeline' | 'vitals' | 'documents'>('timeline');
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('lab_report');
  const [notes, setNotes] = useState('');

  // Fetch documents for the selected patient
  useEffect(() => {
    if (selectedPatient && activeTab === 'documents' && token) {
      loadDocuments();
    }
  }, [selectedPatient, activeTab, token]);

  const loadDocuments = async () => {
    if (!token) return;
    setIsLoadingDocs(true);
    try {
      const docs = await fetchPatientDocuments(token);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !file) return;
    
    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadMedicalDocument(token, file, fileType, notes);
      setFile(null);
      setNotes('');
      await loadDocuments(); // refresh list
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Filter patient directory list
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  if (isLoadingPatients) {
    return (
      <div className="p-12 text-slate-400 font-bold italic text-center animate-pulse">
         Retrieving Secure Electronic Health Records...
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-7xl mx-auto">
      
      {/* CASE 1: NO PATIENT SELECTED (PATIENT DIRECTORY LIST) */}
      {!selectedPatient ? (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Patient Directory</h1>
            <p className="text-slate-400 font-medium mt-1">
              Browse hospital patient profiles, admissions status, and secure Electronic Health Records.
            </p>
          </div>

          {/* Filters and search panel */}
          <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-white/5 p-4 rounded-3xl items-center justify-between shadow-xl">
            <div className="relative w-full md:max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold"></span>
              <input
                type="text"
                placeholder="Search patients by name or ID..."
                className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              {(['All', 'Stable', 'Critical', 'Under Observation'] as const).map(filt => (
                <button
                  key={filt}
                  onClick={() => setStatusFilter(filt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    statusFilter === filt 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                      : 'bg-slate-950 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {filt}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPatients.map(pat => (
              <div 
                key={pat.id}
                onClick={() => { setSelectedPatient(pat); setActiveTab('timeline'); }}
                className="bg-slate-900 border border-white/5 hover:border-cyan-500/30 p-6 rounded-[2rem] shadow-xl hover:shadow-2xl cursor-pointer transition-all flex flex-col md:flex-row gap-6 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-4xl border border-white/5 flex-shrink-0">
                  {pat.avatar}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-all">{pat.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      pat.status === 'Stable' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      pat.status === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {pat.status}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    ID: <span className="text-slate-400">{pat.id}</span> • Age: <span className="text-slate-400">{pat.age}</span> • Gender: <span className="text-slate-400">{pat.gender}</span>
                  </p>

                  <div className="flex gap-2 flex-wrap pt-1">
                    <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-1 rounded border border-red-500/20">
                       Blood: {pat.bloodGroup}
                    </span>
                    <span className="text-[10px] bg-slate-950 text-slate-400 font-bold px-2 py-1 rounded border border-white/5 truncate max-w-[200px]" title={pat.allergies}>
                       Allergies: {pat.allergies}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <span className="text-slate-500 group-hover:text-cyan-400 font-bold text-xl transition-all"></span>
                </div>
              </div>
            ))}

            {filteredPatients.length === 0 && (
              <div className="col-span-full p-16 border border-dashed border-white/5 rounded-[2.5rem] text-center opacity-30">
                <p className="text-5xl mb-3"></p>
                <p className="font-bold text-white">No patients matched your criteria.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        
        /* CASE 2: PATIENT EHR HEALTH PORTAL SPECIFIC VIEW */
        <div className="space-y-6">
          
          {/* Back link & Header Actions */}
          <div className="flex items-center justify-between">
            {userProfile?.roleId !== 'patient' ? (
              <button 
                onClick={() => setSelectedPatient(null)}
                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider transition-colors"
              >
                ← Back to Patient Directory
              </button>
            ) : (
              <div /> // Spacer for patient view
            )}
            
            {isDoctor && (
              <Button variant="primary">
                + New Medical Entry
              </Button>
            )}
          </div>

          {/* Patient Profile Snapshot Card */}
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-6 items-center md:items-start shadow-2xl">
            <div className="w-24 h-24 rounded-3xl bg-slate-950 border border-white/5 flex items-center justify-center text-5xl flex-shrink-0">
              {selectedPatient.avatar}
            </div>
            
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full text-left">
              <div>
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1.5">Patient Name</p>
                <p className="text-white text-lg font-bold">{selectedPatient.name}</p>
                <p className="text-slate-400 text-xs mt-1 font-semibold">{selectedPatient.age} years old • {selectedPatient.gender}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1.5">Record Identifier</p>
                <p className="text-cyan-400 font-black tracking-wider text-base">{selectedPatient.id}</p>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block mt-2 ${
                  selectedPatient.status === 'Stable' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  selectedPatient.status === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {selectedPatient.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1.5">Blood Group</p>
                <span className="text-red-400 font-bold bg-red-400/10 inline-block px-3 py-1 rounded-lg border border-red-500/20 text-sm">
                  {selectedPatient.bloodGroup}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1.5">Allergies & Contraindications</p>
                <p className="text-slate-300 font-bold text-sm leading-relaxed">{selectedPatient.allergies}</p>
              </div>
            </div>
          </div>

          {/* EHR Tabs */}
          <div className="border-b border-white/5">
            <nav className="flex gap-8">
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
                  activeTab === 'timeline' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                 Medical Timeline
              </button>
              <button 
                onClick={() => setActiveTab('vitals')}
                className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
                  activeTab === 'vitals' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                 Recent Health Vitals
              </button>
              <button 
                onClick={() => setActiveTab('documents')}
                className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
                  activeTab === 'documents' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                 Lab Reports & Documents
              </button>
            </nav>
          </div>

          {/* EHR Tab Contents Panel */}
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            
            {/* TAB 1: MEDICAL TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-950 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Consultation Date</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Record ID</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Attending Specialist</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Diagnosis & Treatment Note</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedPatient.records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="px-6 py-4 text-slate-300 font-semibold">{record.date}</td>
                        <td className="px-6 py-4 text-cyan-400 font-bold">{record.id}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-950 px-2.5 py-1 rounded-lg text-xs border border-white/5 font-bold text-slate-300">
                            {record.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{record.doctor}</td>
                        <td className="px-6 py-4 text-white font-bold">{record.diagnosis}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            record.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            record.status === 'Results Ready' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            'bg-slate-950 text-slate-500 border border-white/5'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: HEALTH VITALS */}
            {activeTab === 'vitals' && (
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {selectedPatient.vitals.map((vital, idx) => (
                  <div key={idx} className="bg-slate-950 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between h-36 hover:border-cyan-500/20 transition-all shadow-inner">
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{vital.label}</p>
                    <div className="flex items-baseline gap-2 mt-auto">
                      <span className={`text-4xl font-black ${
                        vital.status === 'critical' ? 'text-rose-400' :
                        vital.status === 'warning' ? 'text-amber-400' :
                        'text-white'
                      }`}>{vital.value}</span>
                      <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{vital.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: LAB REPORTS & DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="p-8 space-y-8 animate-in fade-in-25">
                
                {/* Upload Form */}
                <div className="bg-slate-950 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4">Upload Lab Report or Patient Document</h3>
                  {uploadError && <Alert variant="error" message={uploadError} className="mb-4" />}
                  <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Select Local File</label>
                      <input
                        type="file"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Document Category</label>
                      <select 
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all" 
                        value={fileType} 
                        onChange={(e) => setFileType(e.target.value)}
                      >
                        <option value="lab_report">Lab Report</option>
                        <option value="prescription">Prescription</option>
                        <option value="radiology">Radiology Scan</option>
                        <option value="medical_record">Past Medical Record</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Button type="submit" variant="primary" fullWidth isLoading={isUploading} disabled={!file}>
                        Upload Document
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Uploaded Documents */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-6">Patient Health Documents Index</h3>
                  {isLoadingDocs ? (
                    <p className="text-slate-400 font-semibold">Retrieving documents index...</p>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/5 rounded-[2rem] opacity-35">
                      <span className="text-5xl block mb-3"></span>
                      <p className="font-bold text-white">No custom documents uploaded yet for this patient.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {documents.map(doc => (
                        <div key={doc.id} className="bg-slate-950 p-5 rounded-[2rem] border border-white/5 flex flex-col justify-between hover:border-cyan-500/20 transition-all">
                          <div>
                            <div className="flex items-start justify-between mb-4">
                              <div className="bg-cyan-500/10 text-cyan-400 w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-cyan-500/20">
                                
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-white font-bold truncate text-base" title={doc.fileName}>{doc.fileName}</h4>
                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider mt-1">{doc.fileType.replace('_', ' ')}</p>
                          </div>
                          <a 
                            href={`http://localhost:4000${doc.fileUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="mt-6 block text-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                          >
                            View / Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default PatientRecords;
