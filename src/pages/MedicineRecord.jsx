import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useMedicineStore } from '../store/useMedicineStore';
import { useTreatmentStore } from '../store/useTreatmentStore';
import { useAnimalStore } from '../store/useAnimalStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import Modal from '../components/ui/Modal';
import DatePicker from '../components/ui/DatePicker';
import { FormField, FormGrid, FormSection } from '../components/ui/FormLayout';
import { Pill, Plus, Package, AlertTriangle, Syringe, CheckCircle, Edit, Archive, Trash2, History, Info, Activity, User } from 'lucide-react';

export default function MedicineRecord() {
  const { medicines, loading, fetchMedicines, registerMedicine, updateMedicine, archiveMedicine, deleteExpiredMedicine } = useMedicineStore();
  const { treatments, loading: treatmentsLoading, fetchTreatments, registerTreatment } = useTreatmentStore();
  const { animals, fetchAnimals } = useAnimalStore();
  
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'administrations'
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedGiveMed, setSelectedGiveMed] = useState(null);
  const [selectedMedHistoryItem, setSelectedMedHistoryItem] = useState(null);
  
  const [showArchived, setShowArchived] = useState(false);

  const [formData, setFormData] = useState({
    name: '', type: 'Vaccine', batchNumber: '', supplier: '', manufacturer: '',
    purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '', 
    totalQuantity: '', unit: 'ml', minimumStockThreshold: '', purchaseCost: '', storageLocation: '', notes: ''
  });

  const [giveFormData, setGiveFormData] = useState({
    animalId: '', animalType: '', lifecycleStage: '', currentPen: '', currentStatus: '',
    doseQuantity: '', administrationRoute: 'Intramuscular', diagnosis: '', symptoms: '',
    notes: '', administeredBy: 'Dr. Alistair', administrationDate: new Date().toISOString().split('T')[0],
    followUpDate: '', followUpStatus: 'Pending'
  });

  useEffect(() => { 
    fetchMedicines(); 
    fetchTreatments();
    fetchAnimals();
  }, [fetchMedicines, fetchTreatments, fetchAnimals]);

  // Filter medicines by archive status
  const displayedMedicines = useMemo(() => {
    return medicines.filter(m => showArchived ? m.isArchived : !m.isArchived);
  }, [medicines, showArchived]);

  // Filter treatments/administrations which utilize registered stock items
  const medicalAdministrations = useMemo(() => {
    return treatments.filter(t => t.medicineId || t.treatmentType === 'Vaccine' || t.treatmentType === 'Medicine');
  }, [treatments]);

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

  const handleAnimalSelect = (id) => {
    const matched = animals.find(a => a.animalNo === id || a._id === id);
    if (matched) {
      setGiveFormData(prev => ({
        ...prev,
        animalId: matched.animalNo,
        animalType: matched.lifecycleStage === 'Piglet' ? 'Piglet' : (matched.lifecycleStage === 'Grower' ? 'Grower' : (matched.sex === 'Female' ? 'Sow' : 'Boar')),
        lifecycleStage: matched.lifecycleStage,
        currentPen: matched.currentPen || 'Unassigned',
        currentStatus: matched.operationalStatus
      }));
    } else {
      setGiveFormData(prev => ({
        ...prev,
        animalId: id,
        animalType: '',
        lifecycleStage: '',
        currentPen: '',
        currentStatus: ''
      }));
    }
  };

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
      render: (val, row) => {
        const isExpired = row.status === 'Expired';
        return (
          <div className="flex items-center gap-1.5 no-print">
            <button 
              onClick={() => {
                if (isExpired) return;
                setSelectedGiveMed(row);
                setGiveFormData(prev => ({
                  ...prev,
                  doseQuantity: '',
                  doseUnit: row.unit,
                  animalId: '', animalType: '', lifecycleStage: '', currentPen: '', currentStatus: ''
                }));
                setIsGiveModalOpen(true);
              }}
              disabled={isExpired}
              className={`p-1.5 rounded transition-all ${isExpired ? 'opacity-30 cursor-not-allowed text-textMuted' : 'hover:bg-cardHover text-primary hover:scale-105'}`}
              title={isExpired ? "Expired Stock Batch (Disabled)" : "Give Medicine / Vaccine"}
            >
              <Syringe className="w-3.5 h-3.5" />
            </button>
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
            {isExpired && (
              <button 
                onClick={() => handleDeleteExpired(row._id)} 
                className="p-1.5 hover:bg-cardHover rounded text-textSecondary hover:text-danger transition-colors"
                title="Delete Expired Stock Batch"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ], [animals]);

  // Administration History columns
  const adminColumns = useMemo(() => [
    {
      header: "Admin ID", accessor: "treatmentId", sortable: true,
      render: (val, row) => <span className="font-extrabold text-primary font-mono text-[11px]">{val || row._id.slice(-6).toUpperCase()}</span>
    },
    {
      header: "Animal ID", accessor: "animalId", sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-textPrimary text-[11px]">{val}</span>
          <span className="text-[9px] text-textSecondary font-bold">{row.animalType}</span>
        </div>
      )
    },
    {
      header: "Medicine / Vaccine", accessor: "medicineName", sortable: true,
      render: (val, row) => {
        const batch = medicines.find(m => m._id === row.medicineId || m.medicineId === row.medicineId)?.batchNumber || '—';
        return (
          <div className="flex flex-col">
            <span className="font-extrabold text-[11px] text-textPrimary">{val || 'Treatment Item'}</span>
            <span className="text-[9px] text-textMuted font-mono">Batch: {batch}</span>
          </div>
        );
      }
    },
    {
      header: "Dose Quantity", accessor: "doseQuantity",
      render: (val, row) => <span className="font-bold text-textPrimary">{val} {row.doseUnit || 'ml'}</span>
    },
    { header: "Route", accessor: "administrationRoute", render: (val) => <span className="text-[11px] text-textSecondary">{val || 'Intramuscular'}</span> },
    { header: "Diagnosis / Symptoms", accessor: "diagnosis", render: (val, row) => <span className="text-[11px] text-warning font-bold">{val} <span className="text-[10px] font-normal text-textMuted">({row.symptoms || 'Routine'})</span></span> },
    { header: "Administered By", accessor: "vetName", render: (val) => <span className="text-[11px] text-textSecondary">{val || 'Vet'}</span> },
    {
      header: "Date", accessor: "startDate", sortable: true,
      render: (val) => <span className="text-[11px] font-bold text-textPrimary">{val ? new Date(val).toLocaleDateString() : 'N/A'}</span>
    },
    {
      header: "Follow-Up Status", accessor: "followUpStatus",
      render: (val, row) => {
        const isPast = row.followUpDate && new Date(row.followUpDate) < new Date();
        const displayVal = val || (isPast ? 'Missed' : 'Pending');
        return <StatusBadge status={displayVal} />;
      }
    }
  ], [medicines]);

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

  const handleGiveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGiveMed) return;

    // Safety checks
    if (selectedGiveMed.status === 'Expired' || (selectedGiveMed.expiryDate && new Date(selectedGiveMed.expiryDate) < new Date())) {
      alert("Error: Cannot administer because this batch has EXPIRED.");
      return;
    }

    const qty = Number(giveFormData.doseQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Error: Please enter a valid dosage quantity.");
      return;
    }

    if (qty > selectedGiveMed.remainingStock) {
      alert(`Error: Insufficient stock. Requested ${qty} ${selectedGiveMed.unit}, but only ${selectedGiveMed.remainingStock} ${selectedGiveMed.unit} is available.`);
      return;
    }

    if (!giveFormData.animalId) {
      alert("Error: Please select a valid patient animal from the registry.");
      return;
    }

    try {
      // Connect to useTreatmentStore to register treatment, deduct stock and audit log
      await registerTreatment({
        animalId: giveFormData.animalId,
        animalType: giveFormData.animalType || 'Grower',
        treatmentType: selectedGiveMed.type === 'Vaccine' ? 'Vaccine' : 'Medicine',
        symptoms: giveFormData.symptoms || 'Routine administration',
        diagnosis: giveFormData.diagnosis || 'Routine stock application',
        treatmentDetails: giveFormData.notes || `Administered ${selectedGiveMed.name} batch ${selectedGiveMed.batchNumber}`,
        vetName: giveFormData.administeredBy,
        startDate: giveFormData.administrationDate,
        followUpDate: giveFormData.followUpDate,
        recoveryStatus: giveFormData.followUpStatus === 'Recovering' ? 'Recovering' : 'Under Observation',
        medicineId: selectedGiveMed._id,
        doseQuantity: giveFormData.doseQuantity,
        doseUnit: selectedGiveMed.unit,
        frequency: 'Single application',
        duration: '1 day',
        administrationRoute: giveFormData.administrationRoute,
        notes: giveFormData.notes,
        followUpStatus: giveFormData.followUpStatus
      });

      // Reload lists
      await fetchMedicines();
      await fetchTreatments();
      setIsGiveModalOpen(false);
      alert(`Success: Administered ${qty} ${selectedGiveMed.unit} of ${selectedGiveMed.name} to animal ${giveFormData.animalId}. Stock has been deducted.`);
    } catch (err) {
      alert(err.message);
    }
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
        
        {/* Top Title Section */}
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

        {/* KPIs */}
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

        {/* Dynamic Dual-Tab Module Navigation */}
        <div className="flex border-b border-borderDark gap-2 no-print">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
          >
            Stock Inventory Catalog
          </button>
          <button 
            onClick={() => setActiveTab('administrations')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'administrations' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
          >
            Clinical Administration History
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'inventory' ? (
          <div className="op-card border border-borderDark rounded-xl overflow-hidden">
            {loading && medicines.length === 0 ? <TableSkeleton rows={5} cols={10} /> : (
              <DataTable columns={columns} data={displayedMedicines} searchPlaceholder="Search inventory by name, batch, supplier, location..." />
            )}
          </div>
        ) : (
          <div className="op-card border border-borderDark rounded-xl overflow-hidden">
            {treatmentsLoading ? <TableSkeleton rows={5} cols={9} /> : (
              <DataTable columns={adminColumns} data={medicalAdministrations} searchPlaceholder="Search dosage logs by Animal ID, Vet, Medicine batch, Diagnosis..." />
            )}
          </div>
        )}

      </div>

      {/* ADD INVENTORY MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Stock to Medicine Inventory" icon={<Pill className="w-5 h-5 text-primary" />}>
        <form onSubmit={handleAdd} className="flex flex-col gap-5 p-1">
          <FormSection title="Item Details">
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

      {/* EDIT INVENTORY MODAL */}
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

      {/* GIVE MEDICINE / VACCINE ADMINISTRATION MODAL */}
      <Modal isOpen={isGiveModalOpen} onClose={() => setIsGiveModalOpen(false)} title={`Medicine Administration Sheet: ${selectedGiveMed?.name || ''}`} icon={<Syringe className="w-5 h-5 text-primary" />}>
        <form onSubmit={handleGiveSubmit} className="flex flex-col gap-5 p-1 max-h-[75vh] overflow-y-auto pr-2">
          
          <FormSection title="Section 1 — Patient Animal Information">
            <FormGrid cols={2}>
              <FormField label="Select Patient Animal (ID)" required id="give_animalId">
                <select
                  id="give_animalId"
                  className="input-field font-mono"
                  value={giveFormData.animalId}
                  onChange={e => handleAnimalSelect(e.target.value)}
                  required
                >
                  <option value="">-- Choose Animal ID --</option>
                  {animals.map(a => (
                    <option key={a._id} value={a.animalNo}>
                      {a.animalNo} ({a.lifecycleStage} | Pen: {a.currentPen || 'Unassigned'})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormGrid cols={2}>
                <FormField label="Animal Type">
                  <input type="text" readOnly className="input-field opacity-60 font-bold" value={giveFormData.animalType || 'Auto'} />
                </FormField>
                <FormField label="Lifecycle Stage">
                  <input type="text" readOnly className="input-field opacity-60 font-bold font-mono" value={giveFormData.lifecycleStage || 'Auto'} />
                </FormField>
              </FormGrid>
            </FormGrid>
            <FormGrid cols={2}>
              <FormField label="Current Pen Location">
                <input type="text" readOnly className="input-field opacity-60 font-bold" value={giveFormData.currentPen || 'Auto'} />
              </FormField>
              <FormField label="Patient Current Status">
                <input type="text" readOnly className="input-field opacity-60 font-bold" value={giveFormData.currentStatus || 'Auto'} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Section 2 — Medicine / Vaccine Batch Info">
            <FormGrid cols={3}>
              <FormField label="Item Name">
                <input type="text" readOnly className="input-field opacity-60 font-bold text-textPrimary" value={selectedGiveMed?.name || ''} />
              </FormField>
              <FormField label="Inventory Batch Number">
                <input type="text" readOnly className="input-field opacity-60 font-mono font-bold text-textPrimary" value={selectedGiveMed?.batchNumber || ''} />
              </FormField>
              <FormField label="Location Storage Location">
                <input type="text" readOnly className="input-field opacity-60 font-bold" value={selectedGiveMed?.storageLocation || 'N/A'} />
              </FormField>
            </FormGrid>
            <FormGrid cols={3}>
              <FormField label="Available Remaining Stock">
                <input type="text" readOnly className="input-field opacity-60 font-bold text-success" value={`${selectedGiveMed?.remainingStock || 0} ${selectedGiveMed?.unit || ''}`} />
              </FormField>
              <FormField label="Expiration Safeguard Date">
                <input type="text" readOnly className={`input-field opacity-60 font-bold ${selectedGiveMed?.status === 'Expired' ? 'text-danger' : 'text-textPrimary'}`} value={selectedGiveMed?.expiryDate ? new Date(selectedGiveMed.expiryDate).toLocaleDateString() : 'N/A'} />
              </FormField>
              <FormField label="Measurement Dosage Unit">
                <input type="text" readOnly className="input-field opacity-60 font-bold" value={selectedGiveMed?.unit || ''} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Section 3 — Clinical Administration Specs">
            <FormGrid cols={3}>
              <FormField label={`Dose Quantity (${selectedGiveMed?.unit || ''})`} required id="give_doseQuantity">
                <input
                  id="give_doseQuantity"
                  type="number"
                  min="0.1"
                  step="any"
                  className="input-field font-bold text-textPrimary"
                  placeholder="e.g. 5"
                  value={giveFormData.doseQuantity}
                  onChange={e => setGiveFormData({ ...giveFormData, doseQuantity: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Route of Administration" required id="give_route">
                <select 
                  id="give_route" 
                  className="input-field" 
                  value={giveFormData.administrationRoute} 
                  onChange={e => setGiveFormData({ ...giveFormData, administrationRoute: e.target.value })}
                >
                  {['Intramuscular', 'Intravenous', 'Oral', 'Injection', 'Topical'].map(r => <option key={r}>{r}</option>)}
                </select>
              </FormField>
              <FormField label="Follow-Up Condition Status" required id="give_status">
                <select 
                  id="give_status" 
                  className="input-field font-bold" 
                  value={giveFormData.followUpStatus} 
                  onChange={e => setGiveFormData({ ...giveFormData, followUpStatus: e.target.value })}
                >
                  {['Pending', 'Completed', 'Missed', 'Recovering'].map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
            </FormGrid>

            <FormGrid cols={3}>
              <FormField label="Purpose / Clinical Diagnosis" required id="give_diagnosis">
                <input 
                  id="give_diagnosis" 
                  type="text" 
                  required 
                  className="input-field" 
                  placeholder="e.g. Fever, MMA prevention" 
                  value={giveFormData.diagnosis} 
                  onChange={e => setGiveFormData({ ...giveFormData, diagnosis: e.target.value })}
                />
              </FormField>
              <FormField label="Attending Vet / Operator" required id="give_administeredBy">
                <input 
                  id="give_administeredBy" 
                  type="text" 
                  required 
                  className="input-field" 
                  placeholder="Vet name" 
                  value={giveFormData.administeredBy} 
                  onChange={e => setGiveFormData({ ...giveFormData, administeredBy: e.target.value })}
                />
              </FormField>
              <FormField label="Administration Date" required id="give_date">
                <DatePicker value={giveFormData.administrationDate} onChange={date => setGiveFormData({ ...giveFormData, administrationDate: date })} required className="input-field" />
              </FormField>
            </FormGrid>

            <FormGrid cols={2}>
              <FormField label="Observed Patient Symptoms" id="give_symptoms">
                <input 
                  id="give_symptoms" 
                  type="text" 
                  className="input-field" 
                  placeholder="Describe observed symptoms (e.g. high heat, lethargy)" 
                  value={giveFormData.symptoms} 
                  onChange={e => setGiveFormData({ ...giveFormData, symptoms: e.target.value })}
                />
              </FormField>
              <FormField label="Follow-Up Check Date (Optional)" id="give_followUpDate">
                <DatePicker value={giveFormData.followUpDate} onChange={date => setGiveFormData({ ...giveFormData, followUpDate: date })} placeholder="Select check-up date" className="input-field" />
              </FormField>
            </FormGrid>

            <FormField label="Clinical / Veterinary Administration Notes" id="give_notes">
              <textarea id="give_notes" rows={2} className="input-field resize-none text-[11px]" placeholder="Add post-dosage care parameters or clinical observations..." value={giveFormData.notes} onChange={e => setGiveFormData({ ...giveFormData, notes: e.target.value })} />
            </FormField>
          </FormSection>

          <div className="flex justify-end gap-3 pt-4 border-t border-borderDark">
            <button type="button" onClick={() => setIsGiveModalOpen(false)} className="px-4 py-2 text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors">Cancel</button>
            <button type="submit" className="btn-primary py-2 px-6 flex items-center gap-2">
              <Syringe className="w-4 h-4" /> Administer Dose
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK BATCH USAGE HISTORY MODAL */}
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
