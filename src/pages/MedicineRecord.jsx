import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useMedicineStore } from '../store/useMedicineStore';
import { useTreatmentStore } from '../store/useTreatmentStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import Modal from '../components/ui/Modal';
import DatePicker from '../components/ui/DatePicker';
import { FormField, FormGrid, FormSection } from '../components/ui/FormLayout';
import { Pill, Plus, Package, AlertTriangle, Syringe, CheckCircle, Edit, Archive, Trash2, History, Info } from 'lucide-react';

export default function MedicineRecord() {
  const { medicines, loading, fetchMedicines, registerMedicine, updateMedicine, archiveMedicine, deleteExpiredMedicine } = useMedicineStore();
  const { treatments, fetchTreatments } = useTreatmentStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedMedHistoryItem, setSelectedMedHistoryItem] = useState(null);
  
  const [showArchived, setShowArchived] = useState(false);

  const [formData, setFormData] = useState({
    name: '', type: 'Vaccine', batchNumber: '', supplier: '', manufacturer: '',
    purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '', 
    totalQuantity: '', unit: 'ml', minimumStockThreshold: '', purchaseCost: '', storageLocation: '', notes: ''
  });

  useEffect(() => { 
    fetchMedicines(); 
    fetchTreatments();
  }, [fetchMedicines, fetchTreatments]);

  // Filter medicines by archive status
  const displayedMedicines = useMemo(() => {
    return medicines.filter(m => showArchived ? m.isArchived : !m.isArchived);
  }, [medicines, showArchived]);

  const kpis = useMemo(() => {
    const active = medicines.filter(m => !m.isArchived);
    return {
      total: active.length,
      available: active.filter(m => m.status === 'Available').length,
      lowStock: active.filter(m => m.status === 'Low Stock').length,
      expired: active.filter(m => m.status === 'Expired').length,
    };
  }, [medicines]);

  // Query usage history for selected medicine
  const selectedMedUsageHistory = useMemo(() => {
    if (!selectedMedHistoryItem) return [];
    return treatments.filter(t => 
      t.medicineId === selectedMedHistoryItem._id || 
      t.medicineId === selectedMedHistoryItem.medicineId || 
      t.medicineName?.toLowerCase() === selectedMedHistoryItem.name?.toLowerCase()
    );
  }, [treatments, selectedMedHistoryItem]);

  const columns = useMemo(() => [
    {
      header: "Medicine / Vaccine", accessor: "name", sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-textPrimary text-[11.5px]">{val}</span>
            {row.isArchived && <span className="px-1 py-0.5 text-[8px] bg-textMuted/10 text-textSecondary uppercase tracking-widest font-black rounded border border-borderDark">Archived</span>}
          </div>
          <span className="text-[10px] text-primary font-bold font-mono">{row.medicineId}</span>
        </div>
      )
    },
    { header: "Type", accessor: "type", render: (val) => <StatusBadge status={val} /> },
    { header: "Batch #", accessor: "batchNumber", render: (val) => <span className="font-mono text-[11px] text-textSecondary font-bold">{val}</span> },
    { header: "Manufacturer", accessor: "manufacturer", render: (val) => <span className="text-[11px] text-textSecondary">{val || '—'}</span> },
    { header: "Location", accessor: "storageLocation", render: (val) => <span className="text-[11px] text-textMuted font-mono text-[10px]">{val || '—'}</span> },
    {
      header: "Expiry Date", accessor: "expiryDate", sortable: true,
      render: (val) => {
        if (!val) return <span className="text-textSecondary/40">—</span>;
        const daysLeft = Math.floor((new Date(val) - new Date()) / (1000 * 60 * 60 * 24));
        const color = daysLeft < 0 ? 'danger' : daysLeft < 30 ? 'warning' : 'success';
        return (
          <span className={`text-[11px] font-bold text-${color}`}>
            {new Date(val).toLocaleDateString()} 
            {daysLeft < 30 && daysLeft > 0 ? ` (${daysLeft}d)` : daysLeft < 0 ? ' (EXPIRED)' : ''}
          </span>
        );
      }
    },
    {
      header: "Stock (Rem/Total)", accessor: "remainingStock", sortable: true,
      render: (val, row) => {
        const isLow = row.status === 'Low Stock';
        return (
          <div className="flex flex-col">
            <span className={`font-black ${isLow ? 'text-warning' : 'text-textPrimary'}`}>{val} / {row.totalQuantity} <span className="text-[10px] font-normal text-textSecondary">{row.unit}</span></span>
            <span className="text-[9px] text-textMuted">Threshold: {row.minimumStockThreshold} {row.unit}</span>
          </div>
        );
      }
    },
    {
      header: "Unit Cost", accessor: "purchaseCost",
      render: (val) => <span className="text-[11px] font-bold text-success">₹{Number(val || 0).toLocaleString()}</span>
    },
    { header: "Status", accessor: "status", render: (val) => <StatusBadge status={val} /> },
    {
      header: "Actions", accessor: "_id",
      render: (val, row) => (
        <div className="flex items-center gap-1.5 no-print">
          <button 
            onClick={() => handleOpenEditModal(row)} 
            className="p-1.5 hover:bg-cardHover rounded text-textSecondary hover:text-primary transition-colors"
            title="Edit Inventory Item"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => {
              setSelectedMedHistoryItem(row);
              setIsHistoryModalOpen(true);
            }} 
            className="p-1.5 hover:bg-cardHover rounded text-textSecondary hover:text-blueAccent transition-colors"
            title="View Stock Usage History"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => handleArchive(row._id)} 
            className={`p-1.5 hover:bg-cardHover rounded transition-colors ${row.isArchived ? 'text-primary hover:text-textSecondary' : 'text-textSecondary hover:text-warning'}`}
            title={row.isArchived ? "Restore to Active" : "Archive Inventory Item"}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          {row.status === 'Expired' && (
            <button 
              onClick={() => handleDeleteExpired(row._id)} 
              className="p-1.5 hover:bg-cardHover rounded text-textSecondary hover:text-danger transition-colors"
              title="Delete Expired Stock Batch"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ], [treatments]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await registerMedicine({ ...formData, operator: 'System' });
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateMedicine(selectedMed._id, formData);
      setIsEditModalOpen(false);
      setSelectedMed(null);
      resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleArchive = async (id) => {
    if (confirm("Are you sure you want to change the archive state of this item?")) {
      try {
        await archiveMedicine(id);
      } catch (err) { alert(err.message); }
    }
  };

  const handleDeleteExpired = async (id) => {
    if (confirm("Are you sure you want to permanently delete this EXPIRED stock batch? This action is irreversible.")) {
      try {
        await deleteExpiredMedicine(id);
      } catch (err) { alert(err.message); }
    }
  };

  const handleOpenEditModal = (item) => {
    setSelectedMed(item);
    setFormData({
      name: item.name,
      type: item.type,
      batchNumber: item.batchNumber,
      supplier: item.supplier || '',
      manufacturer: item.manufacturer || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      totalQuantity: item.totalQuantity,
      unit: item.unit,
      minimumStockThreshold: item.minimumStockThreshold || '',
      purchaseCost: item.purchaseCost || '',
      storageLocation: item.storageLocation || '',
      notes: item.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', type: 'Vaccine', batchNumber: '', supplier: '', manufacturer: '',
      purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '', 
      totalQuantity: '', unit: 'ml', minimumStockThreshold: '', purchaseCost: '', storageLocation: '', notes: ''
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-textPrimary uppercase tracking-widest flex items-center gap-2">
              <Pill className="w-6 h-6 text-primary" /> Medicine & Vaccine Inventory
            </h2>
            <p className="text-xs text-textSecondary mt-1">
              Enterprise stock management, locations, expiry safeguards, and veterinary pharmacy control.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowArchived(!showArchived)} 
              className={`px-3 py-2 border rounded text-xs font-bold transition-all uppercase tracking-wider ${showArchived ? 'bg-warning/10 border-warning text-warning' : 'bg-sidebar border-borderDark text-textSecondary hover:bg-cardBg'}`}
            >
              {showArchived ? 'Show Active Stock' : 'Show Archived Stock'}
            </button>
            <button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="btn-primary flex items-center gap-2 text-xs py-2 px-4 whitespace-nowrap">
              <Plus className="w-4 h-4" /> Add New Inventory
            </button>
          </div>
        </div>

        {loading && medicines.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Stock Batches', val: kpis.total, color: 'primary', Icon: Package },
              { label: 'Available / High Stock', val: kpis.available, color: 'success', Icon: CheckCircle },
              { label: 'Low Stock Safeguards', val: kpis.lowStock, color: 'warning', Icon: AlertTriangle },
              { label: 'Expired Batches', val: kpis.expired, color: 'danger', Icon: Syringe },
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
          {loading && medicines.length === 0 ? <TableSkeleton rows={5} cols={9} /> : (
            <DataTable columns={columns} data={displayedMedicines} searchPlaceholder="Search inventory by name, batch, supplier, location..." />
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Stock to Medicine Inventory" icon={<Pill className="w-5 h-5 text-primary" />}>
        <form onSubmit={handleAdd} className="flex flex-col gap-5 p-1">
          <FormSection title="Medical Specifications">
            <FormGrid cols={2}>
              <FormField label="Medicine / Vaccine Name" required id="name">
                <input id="name" type="text" required className="input-field" placeholder="e.g. Penicillin G" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </FormField>
              <FormField label="Item Type" required id="medType">
                <select id="medType" className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {['Vaccine', 'Antibiotic', 'Dewormer', 'Vitamin', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
            </FormGrid>
            <FormGrid cols={3}>
              <FormField label="Batch Number" required id="batchNumber">
                <input id="batchNumber" type="text" required className="input-field font-mono" placeholder="BN-2025-A1" value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() })} />
              </FormField>
              <FormField label="Manufacturer" id="manufacturer">
                <input id="manufacturer" type="text" className="input-field" placeholder="e.g. Pfizer Vet" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />
              </FormField>
              <FormField label="Supplier / Dist." id="supplier">
                <input id="supplier" type="text" className="input-field" placeholder="Supplier name" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
              </FormField>
            </FormGrid>
          </FormSection>
          
          <FormSection title="Inventory Control & Logistics">
            <FormGrid cols={3}>
              <FormField label="Purchase Date" required id="purchaseDate">
                <DatePicker value={formData.purchaseDate} onChange={date => setFormData({ ...formData, purchaseDate: date })} required className="input-field" />
              </FormField>
              <FormField label="Expiry Safeguard Date" required id="expiryDate">
                <DatePicker value={formData.expiryDate} onChange={date => setFormData({ ...formData, expiryDate: date })} required className="input-field" placeholder="Select Expiry" />
              </FormField>
              <FormField label="Storage Location" id="storageLocation">
                <input id="storageLocation" type="text" className="input-field font-mono text-[11px]" placeholder="e.g. Fridge Unit B" value={formData.storageLocation} onChange={e => setFormData({ ...formData, storageLocation: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormGrid cols={4}>
              <FormField label="Total Stock Quantity" required id="totalQuantity">
                <input id="totalQuantity" type="number" min="0" required className="input-field" placeholder="500" value={formData.totalQuantity} onChange={e => setFormData({ ...formData, totalQuantity: e.target.value })} />
              </FormField>
              <FormField label="Measurement Unit" required id="unit">
                <select id="unit" className="input-field" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                  {['ml', 'doses', 'tablets', 'kg', 'g'].map(u => <option key={u}>{u}</option>)}
                </select>
              </FormField>
              <FormField label="Min Stock Alert Level" required id="minimumStockThreshold">
                <input id="minimumStockThreshold" type="number" min="0" required className="input-field" placeholder="e.g. 50" value={formData.minimumStockThreshold} onChange={e => setFormData({ ...formData, minimumStockThreshold: e.target.value })} />
              </FormField>
              <FormField label="Purchase Cost (₹)" required id="purchaseCost">
                <input id="purchaseCost" type="number" min="0" required className="input-field" placeholder="Cost in INR" value={formData.purchaseCost} onChange={e => setFormData({ ...formData, purchaseCost: e.target.value })} />
              </FormField>
            </FormGrid>
          </FormSection>
          <div className="flex justify-end gap-3 pt-4 border-t border-borderDark">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors">Cancel</button>
            <button type="submit" className="btn-primary py-2 px-6">Add Stock Item</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Inventory Item Specs" icon={<Pill className="w-5 h-5 text-primary" />}>
        <form onSubmit={handleEdit} className="flex flex-col gap-5 p-1">
          <FormSection title="Medical Specifications">
            <FormGrid cols={2}>
              <FormField label="Medicine / Vaccine Name" required id="edit_name">
                <input id="edit_name" type="text" required className="input-field" placeholder="e.g. Penicillin G" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </FormField>
              <FormField label="Item Type" required id="edit_medType">
                <select id="edit_medType" className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {['Vaccine', 'Antibiotic', 'Dewormer', 'Vitamin', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
            </FormGrid>
            <FormGrid cols={3}>
              <FormField label="Batch Number" required id="edit_batchNumber">
                <input id="edit_batchNumber" type="text" required className="input-field font-mono" placeholder="BN-2025-A1" value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() })} />
              </FormField>
              <FormField label="Manufacturer" id="edit_manufacturer">
                <input id="edit_manufacturer" type="text" className="input-field" placeholder="e.g. Pfizer Vet" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />
              </FormField>
              <FormField label="Supplier / Dist." id="edit_supplier">
                <input id="edit_supplier" type="text" className="input-field" placeholder="Supplier name" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
              </FormField>
            </FormGrid>
          </FormSection>
          
          <FormSection title="Inventory Control & Logistics">
            <FormGrid cols={3}>
              <FormField label="Purchase Date" required id="edit_purchaseDate">
                <DatePicker value={formData.purchaseDate} onChange={date => setFormData({ ...formData, purchaseDate: date })} required className="input-field" />
              </FormField>
              <FormField label="Expiry Safeguard Date" required id="edit_expiryDate">
                <DatePicker value={formData.expiryDate} onChange={date => setFormData({ ...formData, expiryDate: date })} required className="input-field" />
              </FormField>
              <FormField label="Storage Location" id="edit_storageLocation">
                <input id="edit_storageLocation" type="text" className="input-field font-mono text-[11px]" placeholder="e.g. Fridge Unit B" value={formData.storageLocation} onChange={e => setFormData({ ...formData, storageLocation: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormGrid cols={4}>
              <FormField label="Total Stock Quantity" required id="edit_totalQuantity">
                <input id="edit_totalQuantity" type="number" min="0" required className="input-field" placeholder="500" value={formData.totalQuantity} onChange={e => setFormData({ ...formData, totalQuantity: e.target.value })} />
              </FormField>
              <FormField label="Measurement Unit" required id="edit_unit">
                <select id="edit_unit" className="input-field" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                  {['ml', 'doses', 'tablets', 'kg', 'g'].map(u => <option key={u}>{u}</option>)}
                </select>
              </FormField>
              <FormField label="Min Stock Alert Level" required id="edit_minimumStockThreshold">
                <input id="edit_minimumStockThreshold" type="number" min="0" required className="input-field" placeholder="e.g. 50" value={formData.minimumStockThreshold} onChange={e => setFormData({ ...formData, minimumStockThreshold: e.target.value })} />
              </FormField>
              <FormField label="Purchase Cost (₹)" required id="edit_purchaseCost">
                <input id="edit_purchaseCost" type="number" min="0" required className="input-field" placeholder="Cost in INR" value={formData.purchaseCost} onChange={e => setFormData({ ...formData, purchaseCost: e.target.value })} />
              </FormField>
            </FormGrid>
          </FormSection>
          <div className="flex justify-end gap-3 pt-4 border-t border-borderDark">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors">Cancel</button>
            <button type="submit" className="btn-primary py-2 px-6">Modify Specs</button>
          </div>
        </form>
      </Modal>

      {/* HISTORY USAGE MODAL */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Administration Log: ${selectedMedHistoryItem?.name || ''}`} icon={<History className="w-5 h-5 text-primary" />}>
        <div className="flex flex-col gap-4 p-1 min-w-[300px] md:min-w-[650px]">
          <div className="flex items-center gap-3 bg-surface p-3 border border-borderDark rounded-lg text-xs">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-textPrimary">Stock Batch Details</span>
              <span className="text-textSecondary mt-0.5">
                Batch: <strong className="text-textPrimary font-mono">{selectedMedHistoryItem?.batchNumber}</strong> | Remaining: <strong className="text-textPrimary">{selectedMedHistoryItem?.remainingStock} / {selectedMedHistoryItem?.totalQuantity} {selectedMedHistoryItem?.unit}</strong>
              </span>
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto border border-borderDark rounded-lg">
            {selectedMedUsageHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-textSecondary">
                No clinical administrations have been logged using this inventory batch.
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-cardBg border-b border-borderDark text-textSecondary font-bold">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Animal ID</th>
                    <th className="p-2.5">Diagnosis</th>
                    <th className="p-2.5">Dose Quantity</th>
                    <th className="p-2.5">Route</th>
                    <th className="p-2.5">Administered By</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMedUsageHistory.map((item, idx) => (
                    <tr key={idx} className="border-b border-borderDark/40 hover:bg-cardBg/40 text-textSecondary">
                      <td className="p-2.5 font-bold text-textPrimary">{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-2.5 font-mono font-bold text-primary">{item.animalId}</td>
                      <td className="p-2.5 text-warning font-bold">{item.diagnosis}</td>
                      <td className="p-2.5 font-bold text-textPrimary">{item.doseQuantity} {item.doseUnit || selectedMedHistoryItem?.unit}</td>
                      <td className="p-2.5">{item.administrationRoute || '—'}</td>
                      <td className="p-2.5">{item.vetName || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex justify-end pt-2 border-t border-borderDark">
            <button type="button" onClick={() => setIsHistoryModalOpen(false)} className="btn-primary py-1.5 px-5 text-[10px]">Close History</button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
