// ============================================================
// PULSEGRID — HOSPITAL CONFIGURATION & SETTINGS MODULE
// ============================================================
import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

// Interfaces
interface Department {
  id: string;
  name: string;
  headNurse: string;
  bedsCount: number;
  doctorsCount: number;
  status: 'Active' | 'Suspended';
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minBuffer: number;
  category: 'Equipments' | 'Gases' | 'Disposables' | 'Consumables';
}

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'DEP-01', name: 'Emergency & Trauma Care', headNurse: 'Carol Hathaway', bedsCount: 15, doctorsCount: 8, status: 'Active' },
  { id: 'DEP-02', name: 'General Medicine', headNurse: 'Abby Lockhart', bedsCount: 60, doctorsCount: 12, status: 'Active' },
  { id: 'DEP-03', name: 'Neurology', headNurse: 'Carla Espinosa', bedsCount: 12, doctorsCount: 5, status: 'Active' },
  { id: 'DEP-04', name: 'Cardiology', headNurse: 'Margaret Houlihan', bedsCount: 20, doctorsCount: 6, status: 'Active' },
  { id: 'DEP-05', name: 'Pediatrics', headNurse: 'Judy Ken Sebben', bedsCount: 15, doctorsCount: 4, status: 'Active' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'INV-101', name: 'Standby Ventilators', quantity: 8, unit: 'Units', minBuffer: 3, category: 'Equipments' },
  { id: 'INV-102', name: 'Liquid Oxygen Reserve', quantity: 15400, unit: 'Liters', minBuffer: 5000, category: 'Gases' },
  { id: 'INV-103', name: 'Defibrillators', quantity: 20, unit: 'Units', minBuffer: 5, category: 'Equipments' },
  { id: 'INV-104', name: 'PPE Protective Kits', quantity: 1200, unit: 'Kits', minBuffer: 300, category: 'Disposables' },
  { id: 'INV-105', name: 'Emergency Blood Bags (O-)', quantity: 38, unit: 'Bags', minBuffer: 50, category: 'Consumables' },
  { id: 'INV-106', name: 'Surgical Gloves (Box)', quantity: 450, unit: 'Boxes', minBuffer: 100, category: 'Disposables' },
];

const HospitalSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'details' | 'departments' | 'inventory'>('details');

  // 1. Hospital General Details States
  const [hospName, setHospName] = useState('Princeton Plainsboro Teaching Hospital');
  const [hospLicense, setHospLicense] = useState('CG-HOSP-PP-9901');
  const [hospHotline, setHospHotline] = useState('+1 (555) 019-9000');
  const [hospEmergency, setHospEmergency] = useState('+1 (555) 019-9111');
  const [hospAddress, setHospAddress] = useState('100 Plainsboro Rd, Plainsboro Township, NJ 08536');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // 2. Department Management States (Stateful from LocalStorage)
  const [departments, setDepartments] = useState<Department[]>(() => {
    const local = localStorage.getItem('cg_departments');
    if (local) return JSON.parse(local);
    localStorage.setItem('cg_departments', JSON.stringify(INITIAL_DEPARTMENTS));
    return INITIAL_DEPARTMENTS;
  });
  const [newDepName, setNewDepName] = useState('');
  const [newDepNurse, setNewDepNurse] = useState('');
  const [newDepBeds, setNewDepBeds] = useState(10);
  const [newDepDoctors, setNewDepDoctors] = useState(2);

  // 3. Inventory States (Stateful from LocalStorage)
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const local = localStorage.getItem('cg_inventory');
    if (local) return JSON.parse(local);
    localStorage.setItem('cg_inventory', JSON.stringify(INITIAL_INVENTORY));
    return INITIAL_INVENTORY;
  });
  const [reorderItemName, setReorderItemName] = useState<string | null>(null);
  const [reorderQty, setReorderQty] = useState(10);

  // New Inventory Item Form States
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(100);
  const [newItemUnit, setNewItemUnit] = useState('Units');
  const [newItemBuffer, setNewItemBuffer] = useState(20);
  const [newItemCategory, setNewItemCategory] = useState<'Equipments' | 'Gases' | 'Disposables' | 'Consumables'>('Disposables');

  // Listen to Global AI Companion updates
  useEffect(() => {
    const handleUpdate = () => {
      const local = localStorage.getItem('cg_departments');
      if (local) {
        const nextDeps = JSON.parse(local);
        if (JSON.stringify(nextDeps) !== JSON.stringify(departments)) {
          setDepartments(nextDeps);
        }
      }
    };
    window.addEventListener('pulsegrid-departments-update', handleUpdate);
    return () => window.removeEventListener('pulsegrid-departments-update', handleUpdate);
  }, [departments]);

  useEffect(() => {
    const handleUpdate = () => {
      const local = localStorage.getItem('cg_inventory');
      if (local) {
        const nextInv = JSON.parse(local);
        if (JSON.stringify(nextInv) !== JSON.stringify(inventory)) {
          setInventory(nextInv);
        }
      }
    };
    window.addEventListener('pulsegrid-inventory-update', handleUpdate);
    return () => window.removeEventListener('pulsegrid-inventory-update', handleUpdate);
  }, [inventory]);

  // Synchronize department changes to localStorage & broadcast
  useEffect(() => {
    const localStr = localStorage.getItem('cg_departments') || '';
    const currentStr = JSON.stringify(departments);
    if (localStr !== currentStr) {
      localStorage.setItem('cg_departments', currentStr);
      window.dispatchEvent(new CustomEvent('pulsegrid-departments-update'));
    }
  }, [departments]);

  // Synchronize inventory changes to localStorage & broadcast
  useEffect(() => {
    const localStr = localStorage.getItem('cg_inventory') || '';
    const currentStr = JSON.stringify(inventory);
    if (localStr !== currentStr) {
      localStorage.setItem('cg_inventory', currentStr);
      window.dispatchEvent(new CustomEvent('pulsegrid-inventory-update'));
    }
  }, [inventory]);

  // Save General Configuration Handler
  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 4000);
  };

  // Add Department Handler
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepName.trim() || !newDepNurse.trim()) return;

    const newDep: Department = {
      id: `DEP-0${departments.length + 1}`,
      name: newDepName,
      headNurse: newDepNurse,
      bedsCount: newDepBeds,
      doctorsCount: newDepDoctors,
      status: 'Active'
    };

    setDepartments(prev => [...prev, newDep]);
    setNewDepName('');
    setNewDepNurse('');
    setNewDepBeds(10);
    setNewDepDoctors(2);
  };

  // Toggle Department Status
  const handleToggleDepStatus = (depId: string) => {
    setDepartments(prev => prev.map(d => {
      if (d.id === depId) {
        return {
          ...d,
          status: d.status === 'Active' ? 'Suspended' : 'Active'
        };
      }
      return d;
    }));
  };

  // Inventory Adjust Quantity Handler
  const handleQuantityAdjust = (itemId: string, amount: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextQty = Math.max(0, item.quantity + amount);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  // Trigger Reorder Dialog
  const handleTriggerReorder = (itemName: string) => {
    setReorderItemName(itemName);
    setReorderQty(50);
  };

  // Confirm Purchase Reorder
  const handleSaveReorder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderItemName) return;

    setInventory(prev => prev.map(item => {
      if (item.name === reorderItemName) {
        return { ...item, quantity: item.quantity + reorderQty };
      }
      return item;
    }));

    setReorderItemName(null);
  };

  // Add New Inventory Asset Handler
  const handleAddInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemUnit.trim()) return;

    const newItem: InventoryItem = {
      id: `INV-${100 + inventory.length + 1}`,
      name: newItemName.trim(),
      quantity: newItemQty,
      unit: newItemUnit.trim(),
      minBuffer: newItemBuffer,
      category: newItemCategory
    };

    setInventory(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemQty(100);
    setNewItemUnit('Units');
    setNewItemBuffer(20);
  };

  // Remove Inventory Asset Handler
  const handleRemoveInventoryItem = (itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
           Hospital Control Panel
        </h1>
        <p className="text-slate-400 font-medium mt-1">
          Configure hospital metadata, register active clinical departments, and manage emergency inventory buffers.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="border-b border-white/5">
        <nav className="flex gap-8">
          <button 
            onClick={() => setActiveTab('details')}
            className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'details' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
             Hospital Contact & Info
          </button>
          <button 
            onClick={() => setActiveTab('departments')}
            className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'departments' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
             Department Management
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`pb-4 text-base font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'inventory' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
             Resource Inventory buffers
          </button>
        </nav>
      </div>

      {/* Tab Area Content */}
      <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* TAB 1: HOSPITAL DETAILS & CONTACT INFO */}
        {activeTab === 'details' && (
          <div className="p-8 space-y-8 max-w-4xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
              General Registration & Hotline Configuration
            </h3>

            {showSaveSuccess && (
              <Alert 
                variant="success" 
                message=" Hospital configurations updated successfully! Changes saved permanently in registry."
                className="animate-fade-in"
              />
            )}

            <form onSubmit={handleSaveGeneralConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Hospital Registration Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                    value={hospName}
                    onChange={(e) => setHospName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Regional License Registry ID</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none cursor-not-allowed font-bold"
                    value={hospLicense}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Primary Consultation Hotline</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                    value={hospHotline}
                    onChange={(e) => setHospHotline(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ambulance SOS Emergency line</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                    value={hospEmergency}
                    onChange={(e) => setHospEmergency(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Physical Location Address</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all resize-none font-semibold"
                  value={hospAddress}
                  onChange={(e) => setHospAddress(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary">
                  Save General Settings
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: DEPARTMENT MANAGEMENT */}
        {activeTab === 'departments' && (
          <div className="p-8 space-y-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
              Department Management & Registration
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Add Department Form */}
              <div className="lg:col-span-1 bg-slate-950 p-6 rounded-[2rem] border border-white/5 h-fit">
                <h4 className="text-lg font-bold text-white mb-6">Register New Department</h4>
                <form onSubmit={handleAddDepartment} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Department Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ophthalmology"
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                      value={newDepName}
                      onChange={(e) => setNewDepName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Head Nursing Officer</label>
                    <input
                      type="text"
                      placeholder="e.g. Nurse Carol Hathaway"
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                      value={newDepNurse}
                      onChange={(e) => setNewDepNurse(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Beds Allocated</label>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                        value={newDepBeds}
                        onChange={(e) => setNewDepBeds(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Doctors Count</label>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                        value={newDepDoctors}
                        onChange={(e) => setNewDepDoctors(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="primary" fullWidth>
                    + Register Department
                  </Button>
                </form>
              </div>

              {/* Department Directory List */}
              <div className="lg:col-span-2 space-y-4">
                {departments.map(dep => (
                  <div 
                    key={dep.id} 
                    className={`bg-slate-950 border p-5 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      dep.status === 'Active' ? 'border-white/5 hover:border-cyan-500/20' : 'border-rose-500/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-xl border border-cyan-500/20">
                        
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-base font-bold text-white">{dep.name}</h4>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            dep.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>{dep.status}</span>
                        </div>
                        <p className="text-slate-500 text-xs font-semibold mt-1">
                           Head Nurse: <span className="text-slate-300">{dep.headNurse}</span> •  beds: <span className="text-slate-300">{dep.bedsCount}</span> •  staff: <span className="text-slate-300">{dep.doctorsCount}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleDepStatus(dep.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        dep.status === 'Active' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {dep.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: INVENTORY CONFIGURATION */}
        {activeTab === 'inventory' && (
          <div className="p-8 space-y-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
              Emergency Medical Supplies & Equipment Inventory
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Add Inventory Asset Form */}
              <div className="lg:col-span-1 bg-slate-950 p-6 rounded-[2rem] border border-white/5 h-fit">
                <h4 className="text-lg font-bold text-white mb-6">Register New Supply/Asset</h4>
                <form onSubmit={handleAddInventoryItem} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Asset / Supply Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Adrenaline Vials"
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Asset Category</label>
                    <select
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                      value={newItemCategory}
                      onChange={(e: any) => setNewItemCategory(e.target.value)}
                    >
                      <option value="Equipments"> Equipments</option>
                      <option value="Gases"> Gases</option>
                      <option value="Disposables"> Disposables</option>
                      <option value="Consumables"> Consumables</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Initial Stock</label>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(Math.max(0, parseInt(e.target.value) || 0))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Unit Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Vials, Kits"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                        value={newItemUnit}
                        onChange={(e) => setNewItemUnit(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Min Safety Buffer</label>
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                      value={newItemBuffer}
                      onChange={(e) => setNewItemBuffer(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">System will trigger "Low Stock" warning if inventory drops under this limit.</span>
                  </div>

                  <Button type="submit" variant="primary" fullWidth>
                    + Add New Inventory Asset
                  </Button>
                </form>
              </div>

              {/* Inventory Table */}
              <div className="lg:col-span-2 overflow-x-auto bg-slate-950 rounded-[2rem] border border-white/5">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="border-b border-white/5 bg-slate-950">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Asset Name</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Current Stock</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Buffer Alert</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {inventory.map(item => {
                      const isLow = item.quantity <= item.minBuffer;
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">
                                {item.category === 'Equipments' ? '' :
                                 item.category === 'Gases' ? '' :
                                 item.category === 'Disposables' ? '' : ''}
                              </span>
                              <div>
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">ID: {item.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-900 border border-white/5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {item.quantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isLow 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isLow ? ' Low Stock' : ' Sufficient'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1 justify-end items-center">
                              <button
                                onClick={() => handleQuantityAdjust(item.id, -1)}
                                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-white/5 active:scale-90 transition-all font-black text-sm"
                                title="Reduce stock by 1"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleQuantityAdjust(item.id, 1)}
                                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-white/5 active:scale-90 transition-all font-black text-sm"
                                title="Increase stock by 1"
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleTriggerReorder(item.name)}
                                className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg active:scale-95 transition-all ml-1.5"
                              >
                                Reorder
                              </button>
                              <button
                                onClick={() => handleRemoveInventoryItem(item.id)}
                                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 flex items-center justify-center border border-white/5 active:scale-90 transition-all ml-1"
                                title="Delete Asset"
                              >
                                
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Quick Reorder Modal Form */}
              {reorderItemName && (
                <div className="bg-slate-950 border border-cyan-500/30 p-8 rounded-[2.5rem] animate-in slide-in-from-bottom-5 mt-4 col-span-full">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold text-white">
                      Place Purchase Reorder: <span className="text-cyan-400">{reorderItemName}</span>
                    </h4>
                    <button onClick={() => setReorderItemName(null)} className="text-slate-500 hover:text-white font-black">Close </button>
                  </div>
                  <form onSubmit={handleSaveReorder} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Reorder Quantity</label>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                        value={reorderQty}
                        onChange={(e) => setReorderQty(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-3">Estimated ETA: **Within 24 Hours** via emergency medical supply chain corridors.</p>
                    </div>
                    <div>
                      <Button type="submit" variant="primary" fullWidth>
                        Confirm Purchase Reorder
                      </Button>
                    </div>
                  </form>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default HospitalSettings;
