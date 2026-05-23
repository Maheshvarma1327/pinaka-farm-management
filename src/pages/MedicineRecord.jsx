import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useMedicineStore } from '../store/useMedicineStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import Modal from '../components/ui/Modal';
import { FormField, FormGrid, FormSection } from '../components/ui/FormLayout';
import { Pill, Plus, Package, AlertTriangle, Syringe, CheckCircle } from 'lucide-react';

export default function MedicineRecord() {
  const { medicines, loading, fetchMedicines, registerMedicine } = useMedicineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'Vaccine', batchNumber: '', supplier: '',
    purchaseDate: '', expiryDate: '', totalQuantity: '', unit: 'ml', notes: ''
  });

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  const kpis = useMemo(() => ({
    total: medicines.length,
    available: medicines.filter(m => m.status === 'Available').length,
    lowStock: medicines.filter(m => m.status === 'Low Stock').length,
    expired: medicines.filter(m => {
      if (!m.expiryDate) return false;
      return new Date(m.expiryDate) < new Date();
    }).length,
  }), [medicines]);

  // Auto-compute status based on stock and expiry
  const enrichedMedicines = useMemo(() => medicines.map(m => {
    let status = m.status;
    if (m.expiryDate && new Date(m.expiryDate) < new Date()) status = 'Expired';
    else if (m.remainingStock === 0) status = 'Out Of Stock';
    else if (m.remainingStock < m.totalQuantity * 0.2) status = 'Low Stock';
    else status = 'Available';
    return { ...m, status };
  }), [medicines]);

  const columns = useMemo(() => [
    {
      header: "Medicine / Vaccine", accessor: "name", sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-textPrimary text-[11px]">{val}</span>
          <span className="text-[10px] text-primary font-bold">{row.medicineId}</span>
        </div>
      )
    },
    { header: "Type", accessor: "type", render: (val) => <StatusBadge status={val} /> },
    { header: "Batch #", accessor: "batchNumber", render: (val) => <span className="font-mono text-[11px] text-textSecondary">{val}</span> },
    { header: "Supplier", accessor: "supplier", render: (val) => <span className="text-[11px] text-textSecondary">{val || '—'}</span> },
    {
      header: "Expiry Date", accessor: "expiryDate", sortable: true,
      render: (val) => {
        if (!val) return <span className="text-textSecondary/40">N/A</span>;
        const daysLeft = Math.floor((new Date(val) - new Date()) / (1000 * 60 * 60 * 24));
        const color = daysLeft < 0 ? 'danger' : daysLeft < 30 ? 'warning' : 'success';
        return <span className={`text-[11px] font-bold text-${color}`}>{new Date(val).toLocaleDateString()} {daysLeft < 30 && daysLeft > 0 ? `(${daysLeft}d)` : daysLeft < 0 ? '(EXPIRED)' : ''}</span>;
      }
    },
    {
      header: "Stock", accessor: "remainingStock", sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-black text-textPrimary">{val} {row.unit}</span>
          <span className="text-[10px] text-textSecondary">Used: {row.usedQuantity} / {row.totalQuantity}</span>
        </div>
      )
    },
    { header: "Status", accessor: "status", render: (val) => <StatusBadge status={val} /> },
  ], []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await registerMedicine({ ...formData, operator: 'System' });
      setIsAddModalOpen(false);
      setFormData({ name: '', type: 'Vaccine', batchNumber: '', supplier: '', purchaseDate: '', expiryDate: '', totalQuantity: '', unit: 'ml', notes: '' });
    } catch (err) { alert(err.message); }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-textPrimary uppercase tracking-widest flex items-center gap-2">
              <Pill className="w-6 h-6 text-primary" /> Medicine & Vaccine Register
            </h2>
            <p className="text-xs text-textSecondary mt-1">Inventory management, batch tracking, and expiry monitoring for all farm medicines and vaccines.</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2 text-xs py-2 px-4 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Medicine / Vaccine
          </button>
        </div>

        {loading && medicines.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Items', val: kpis.total, color: 'primary', Icon: Package },
              { label: 'Available', val: kpis.available, color: 'success', Icon: CheckCircle },
              { label: 'Low Stock', val: kpis.lowStock, color: 'warning', Icon: AlertTriangle },
              { label: 'Expired', val: kpis.expired, color: 'danger', Icon: Syringe },
            ].map(({ label, val, color, Icon }) => (
              <div key={label} className="op-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">{label}</p>
                  <p className={`text-2xl font-black text-${color}`}>{val}</p>
                </div>
                <div className={`w-10 h-10 rounded bg-${color}/10 flex items-center justify-center border border-${color}/20`}>
                  <Icon className={`w-5 h-5 text-${color}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="op-card border border-borderDark rounded-xl overflow-hidden">
          {loading && medicines.length === 0 ? <TableSkeleton rows={5} cols={7} /> : (
            <DataTable columns={columns} data={enrichedMedicines} searchPlaceholder="Search by name, batch, supplier..." />
          )}
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Medicine / Vaccine" icon={<Pill className="w-5 h-5 text-primary" />}>
        <form onSubmit={handleAdd} className="flex flex-col gap-5 p-1">
          <FormSection title="Item Details">
            <FormGrid cols={2}>
              <FormField label="Medicine / Vaccine Name" required id="name">
                <input id="name" type="text" required className="input-field" placeholder="e.g. Penicillin G" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </FormField>
              <FormField label="Type" required id="medType">
                <select id="medType" className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {['Vaccine', 'Antibiotic', 'Dewormer', 'Vitamin', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
            </FormGrid>
            <FormGrid cols={2}>
              <FormField label="Batch Number" required id="batchNumber">
                <input id="batchNumber" type="text" required className="input-field font-mono" placeholder="BN-2025-A1" value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() })} />
              </FormField>
              <FormField label="Supplier" id="supplier">
                <input id="supplier" type="text" className="input-field" placeholder="Supplier name" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
              </FormField>
            </FormGrid>
          </FormSection>
          <FormSection title="Stock & Dates">
            <FormGrid cols={2}>
              <FormField label="Purchase Date" required id="purchaseDate">
                <input id="purchaseDate" type="date" required className="input-field" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
              </FormField>
              <FormField label="Expiry Date" required id="expiryDate">
                <input id="expiryDate" type="date" required className="input-field" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormGrid cols={2}>
              <FormField label="Total Quantity" required id="totalQuantity">
                <input id="totalQuantity" type="number" min="0" required className="input-field" placeholder="500" value={formData.totalQuantity} onChange={e => setFormData({ ...formData, totalQuantity: e.target.value })} />
              </FormField>
              <FormField label="Unit" required id="unit">
                <select id="unit" className="input-field" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                  {['ml', 'doses', 'tablets', 'kg', 'g'].map(u => <option key={u}>{u}</option>)}
                </select>
              </FormField>
            </FormGrid>
          </FormSection>
          <div className="flex justify-end gap-3 pt-4 border-t border-borderDark">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors">Cancel</button>
            <button type="submit" className="btn-primary py-2 px-6">Add to Inventory</button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
