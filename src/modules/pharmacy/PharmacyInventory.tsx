import React, { useState } from 'react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  threshold: number;
  expiry: string;
  unit: string;
}

const MOCK_INVENTORY: StockItem[] = [
  { id: 'MED-001', name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 12, threshold: 50, expiry: '2025-08', unit: 'Strips' },
  { id: 'MED-002', name: 'Paracetamol 650mg', category: 'Analgesic', stock: 240, threshold: 100, expiry: '2026-03', unit: 'Tablets' },
  { id: 'MED-003', name: 'Metformin 500mg', category: 'Antidiabetic', stock: 8, threshold: 40, expiry: '2025-11', unit: 'Strips' },
  { id: 'MED-004', name: 'Atorvastatin 10mg', category: 'Cardiac', stock: 180, threshold: 60, expiry: '2026-06', unit: 'Tablets' },
  { id: 'MED-005', name: 'Insulin Glargine', category: 'Hormone', stock: 3, threshold: 15, expiry: '2025-09', unit: 'Vials' },
];

const MOCK_PRESCRIPTIONS = [
  { id: 'RX-8821', doctor: 'Dr. Meredith Grey', patient: 'John Doe', date: '2026-05-16', medicines: 'Amoxicillin 500mg × 10', status: 'Pending' },
  { id: 'RX-8819', doctor: 'Dr. Derek Shepherd', patient: 'Sarah Connor', date: '2026-05-15', medicines: 'Metformin 500mg × 30', status: 'Pending' },
  { id: 'RX-8815', doctor: 'Dr. Gregory House', patient: 'Bruce Wayne', date: '2026-05-14', medicines: 'Atorvastatin 10mg × 30', status: 'Dispensed' },
];

const PharmacyInventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('inventory');

  const getStockBadge = (item: StockItem) => {
    if (item.stock <= item.threshold * 0.3) return { label: 'Critical', cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
    if (item.stock <= item.threshold * 0.7) return { label: 'Low', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    return { label: 'Adequate', cls: 'bg-green-500/10 text-green-400 border-green-500/20' };
  };

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl"></span> Pharmacy Management
          </h1>
          <p className="text-gray-400 mt-1">Track inventory, verify prescriptions, and manage dispensing.</p>
        </div>
        <button className="bg-health-blue hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors">
          + Add Stock
        </button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Low Stock Items', value: MOCK_INVENTORY.filter(i => i.stock <= i.threshold).length, icon: '', color: 'border-orange-500/30 bg-orange-500/5' },
          { label: 'Pending Prescriptions', value: MOCK_PRESCRIPTIONS.filter(p => p.status === 'Pending').length, icon: '', color: 'border-blue-500/30 bg-blue-500/5' },
          { label: 'Expiring This Month', value: 2, icon: '⏰', color: 'border-red-500/30 bg-red-500/5' },
        ].map((card, i) => (
          <div key={i} className={`border rounded-2xl p-5 flex items-center gap-4 ${card.color}`}>
            <span className="text-3xl">{card.icon}</span>
            <div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-sm text-gray-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <nav className="flex gap-6">
          {(['inventory', 'prescriptions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab ? 'border-health-blue text-health-blue' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Table Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {activeTab === 'inventory' ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950/60 border-b border-gray-800">
              <tr>
                {['Medicine', 'Category', 'In Stock', 'Min. Threshold', 'Expiry', 'Status'].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {MOCK_INVENTORY.map(item => {
                const badge = getStockBadge(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.id}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-300">{item.category}</td>
                    <td className="px-5 py-4 text-white font-semibold">{item.stock} <span className="text-gray-500 font-normal text-xs">{item.unit}</span></td>
                    <td className="px-5 py-4 text-gray-400">{item.threshold}</td>
                    <td className="px-5 py-4 text-gray-300">{item.expiry}</td>
                    <td className="px-5 py-4">
                      <span className={`border px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950/60 border-b border-gray-800">
              <tr>
                {['Rx ID', 'Doctor', 'Patient', 'Medicines', 'Date', 'Action'].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {MOCK_PRESCRIPTIONS.map(rx => (
                <tr key={rx.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-4 text-health-blue font-medium">{rx.id}</td>
                  <td className="px-5 py-4 text-gray-300">{rx.doctor}</td>
                  <td className="px-5 py-4 text-white font-medium">{rx.patient}</td>
                  <td className="px-5 py-4 text-gray-300">{rx.medicines}</td>
                  <td className="px-5 py-4 text-gray-400">{rx.date}</td>
                  <td className="px-5 py-4">
                    {rx.status === 'Pending' ? (
                      <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">
                        Dispense
                      </button>
                    ) : (
                      <span className="text-green-400 text-xs font-semibold"> Dispensed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PharmacyInventory;
