// ============================================================
// PULSEGRID — SMART INVENTORY TRACKER PAGE
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  stock: number;
  minStock: number;
  price: number;
  isControlled: boolean;
  genericAlternatives: string;
}

interface Batch {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
}

interface SupplierOrder {
  id: string;
  supplierName: string;
  medicineName: string;
  quantity: number;
  status: 'ORDERED' | 'DELIVERED';
  createdAt: string;
}

const PharmacyInventoryPage: React.FC = () => {
  const { token } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);

  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({
    medicineId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: ''
  });

  const [supplierForm, setSupplierForm] = useState({
    supplierName: '',
    medicineName: '',
    quantity: ''
  });

  const fetchInventoryData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Inventory & Batches
      const invRes = await fetch('http://localhost:4000/api/pharmacist/inventory', { headers });
      const invData = invRes.ok ? await invRes.json() : { medicines: [], batches: [] };

      // Wholesalers Supplier Orders
      const supRes = await fetch('http://localhost:4000/api/pharmacist/suppliers', { headers });
      const supData = supRes.ok ? await supRes.json() : [];

      setMedicines(invData.medicines || []);
      setBatches(invData.batches || []);
      setSupplierOrders(supData);
    } catch (error) {
      console.error('Failed to sync inventory telemetry:', error);
      setErrorMsg('Inventory Network offline. Please retry or contact technical desk.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventoryData();
    }
  }, [token]);

  const handleCreateSupplierOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.supplierName || !supplierForm.medicineName || !supplierForm.quantity) return;

    try {
      const response = await fetch('http://localhost:4000/api/pharmacist/suppliers/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supplierForm)
      });

      if (response.ok) {
        setSupplierForm({ supplierName: '', medicineName: '', quantity: '' });
        await fetchInventoryData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to place wholesaler order');
      }
    } catch (err) {
      alert('Network error placing wholesaler order');
    }
  };

  const handleReceiveOrder = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/pharmacist/suppliers/order/${orderId}/receive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchInventoryData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to receive order');
      }
    } catch (err) {
      alert('Network error receiving order');
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchForm.medicineId || !newBatchForm.batchNumber || !newBatchForm.expiryDate || !newBatchForm.quantity) return;

    try {
      const response = await fetch('http://localhost:4000/api/pharmacist/inventory/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBatchForm)
      });

      if (response.ok) {
        setNewBatchForm({ medicineId: '', batchNumber: '', expiryDate: '', quantity: '' });
        setShowAddBatchModal(false);
        await fetchInventoryData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to add batch');
      }
    } catch (err) {
      alert('Network error adding batch');
    }
  };

  if (isLoading && medicines.length === 0) {
    return (
      <div className="p-12 text-slate-400 font-bold italic text-center animate-pulse">
         Accessing Pharmacy Inventory & Wholesalers...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2.5">
            <span></span> Smart Inventory Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Track batch-level expiration thresholds, manage stock indices, and coordinate wholesaler supplier orders.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddBatchModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl"
          >
             Log New Batch
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold animate-fade-in">
           {errorMsg}
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-3xl space-y-4 animate-fade-in shadow-xl max-w-xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h4 className="text-base font-black text-white">Log Medicine Batch</h4>
            <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-white">Cancel</button>
          </div>
          <form onSubmit={handleAddBatch} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Select Medicine</label>
              <select
                value={newBatchForm.medicineId}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, medicineId: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none"
                required
              >
                <option value="">-- Choose Medicine --</option>
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Batch Code</label>
                <input
                  type="text"
                  placeholder="e.g. B-PAR-203"
                  value={newBatchForm.batchNumber}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, batchNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Expiry Date</label>
                <input
                  type="date"
                  value={newBatchForm.expiryDate}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, expiryDate: e.target.value })}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Quantity (Units)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={newBatchForm.quantity}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, quantity: e.target.value })}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button type="button" onClick={() => setShowAddBatchModal(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Save Batch Log</Button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stock Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 overflow-x-auto">
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">Stock Ledger</h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-bold uppercase">
                  <th className="pb-3 pr-2">Medicine Profile</th>
                  <th className="pb-3 pr-2">Generic Class</th>
                  <th className="pb-3 pr-2">Total Stock</th>
                  <th className="pb-3 pr-2">Unit Price</th>
                  <th className="pb-3 pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {medicines.map(m => {
                  const isLow = m.stock <= m.minStock;
                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-bold text-white">
                        <p className="flex items-center gap-1.5">
                          {m.name}
                          {m.isControlled && (
                            <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-[7px] uppercase tracking-wider px-1 rounded">
                              Controlled
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] text-slate-500 font-normal">ID: {m.id}</span>
                      </td>
                      <td className="py-3.5 text-slate-400 font-medium">{m.genericName}</td>
                      <td className="py-3.5 font-black text-white">{m.stock} units</td>
                      <td className="py-3.5 font-mono">₹{m.price.toFixed(2)}</td>
                      <td className="py-3.5">
                        {m.stock === 0 ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Adequate</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Supplier Orders Panel */}
          <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6">
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">Pending Wholesaler Supply Requests</h4>
            <div className="space-y-3">
              {supplierOrders.map(order => (
                <div key={order.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono">ID: {order.id}</span>
                    <div className="text-xs font-bold text-white">{order.medicineName} (x{order.quantity})</div>
                    <div className="text-[10px] text-slate-400">Supplier: {order.supplierName}</div>
                  </div>

                  <div>
                    {order.status === 'ORDERED' ? (
                      <Button
                        onClick={() => handleReceiveOrder(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg"
                      >
                        Receive Order
                      </Button>
                    ) : (
                      <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                        Delivered & Stocked
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {supplierOrders.length === 0 && (
                <div className="text-center py-6 text-slate-500 italic text-xs">
                  No active supply request orders placed.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar panels: Batches & Supplier Orders form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Wholesaler Order Form */}
          <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Place Wholesaler Order</h4>
            <form onSubmit={handleCreateSupplierOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Distributor / Wholesaler</label>
                <input
                  type="text"
                  placeholder="e.g. AstraMed Distributors"
                  value={supplierForm.supplierName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Medicine Name</label>
                <input
                  type="text"
                  placeholder="e.g. Atorvastatin 10mg"
                  value={supplierForm.medicineName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, medicineName: e.target.value })}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Quantity (Units)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={supplierForm.quantity}
                  onChange={(e) => setSupplierForm({ ...supplierForm, quantity: e.target.value })}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest py-3 px-6 rounded-xl w-full">
                Submit Wholesaler request
              </Button>
            </form>
          </Card>

          {/* Active Batches and Expiries */}
          <Card className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">Active Batches & Expiries</h4>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                {batches.map(batch => {
                  const med = medicines.find(m => m.id === batch.medicineId);
                  const isExpired = new Date(batch.expiryDate) < new Date();
                  const isExpiringSoon = new Date(batch.expiryDate) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months

                  return (
                    <div key={batch.id} className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded">
                          {batch.batchNumber}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          isExpired
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/20'
                            : isExpiringSoon
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-950 text-slate-400'
                        }`}>
                          {isExpired ? 'EXPIRED' : isExpiringSoon ? 'NEAR EXPIRY' : 'STABLE'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white">
                        {med ? med.name : 'Unknown Drug'}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Qty: <span className="text-white font-bold">{batch.quantity}</span></span>
                        <span>Exp: <span className="font-mono">{new Date(batch.expiryDate).toLocaleDateString()}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PharmacyInventoryPage;
