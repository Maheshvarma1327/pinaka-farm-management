import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useBoarStore } from '../store/useBoarStore';
import { useAuthStore } from '../store/useAuthStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { FormField, FormGrid, FormSection } from '../components/ui/FormLayout';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { 
  Plus, 
  Eye, 
  Scale, 
  Calendar, 
  ClipboardList, 
  Database, 
  Award, 
  TrendingUp, 
  Activity, 
  Heart,
  AlertCircle,
  FileText,
  Percent,
  Trash2
} from 'lucide-react';

export default function BoarRecord() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    boars, 
    loading, 
    error, 
    fetchBoars, 
    createBoar, 
    importBoarFromGrower,
    updateBoarStatusDirect,
    deleteBoar
  } = useBoarStore();

  // 1. Modals & Dialog triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedBoar, setSelectedBoar] = useState(null);

  // 2. Form payload states
  const [formData, setFormData] = useState({
    animalNo: '',
    dob: '',
    breed: '',
    sireNo: 'UNKNOWN',
    damNo: 'UNKNOWN',
    birthWeight: '1.5',
    currentWeight: '150',
    penNo: '',
    status: 'Active',
    notes: '',
    pubertyDate: '',
    diseaseTestResult: 'Negative',
    congenitalDefects: 'None',
    rudimentaryTeats: '14',
    breedingStatus: 'Growing'
  });

  const [importData, setImportData] = useState({
    growerId: '',
    notes: '',
  });

  const [statusData, setStatusData] = useState({
    status: 'Active',
    remarks: ''
  });

  const [formError, setFormError] = useState('');
  const [growersList, setGrowersList] = useState([]);

  // Load backend registers on mount
  useEffect(() => {
    fetchBoars();
  }, [fetchBoars]);

  // Load male growers for import on modal open
  const loadMaleGrowers = () => {
    try {
      const stored = localStorage.getItem('pinaka_growers');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only active/available male growers that haven't been promoted
        const males = parsed.filter(g => 
          g.sex === 'Male' && 
          g.status !== 'Promoted to Sow' && 
          g.status !== 'Promoted to Boar' &&
          !g.isDeleted
        );
        setGrowersList(males);
        return males;
      }
    } catch (e) {
      console.error("Failed to load growers list:", e);
    }
    return [];
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Boar record card? This will perform a soft-delete (archive) from the breeding registry.")) {
      try {
        await deleteBoar(id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Farm Worker';

  // Boar KPI Cards (Replaced with specific operational KPIs)
  const kpis = useMemo(() => {
    const total = boars.length;
    const activeBreeders = boars.filter(b => b.breedingStatus === 'Breeding Active' || (b.status === 'Active' && b.breedingStatus === 'Breeding Active')).length;
    const breedingReady = boars.filter(b => b.breedingStatus === 'Breeding Ready').length;
    const underVet = boars.filter(b => b.status === 'Under Treatment' || b.breedingStatus === 'Under Treatment').length;
    const lowFertility = boars.filter(b => b.breedingStatus === 'Low Fertility').length;
    const retiredCulled = boars.filter(b => b.status === 'Culled' || b.breedingStatus === 'Retired' || b.status === 'Inactive').length;

    return { total, activeBreeders, breedingReady, underVet, lowFertility, retiredCulled };
  }, [boars]);

  // Form handlers
  const handleOpenAdd = () => {
    setFormError('');
    setFormData({
      animalNo: '',
      dob: '',
      breed: '',
      sireNo: 'UNKNOWN',
      damNo: 'UNKNOWN',
      birthWeight: '1.5',
      currentWeight: '150',
      penNo: '',
      status: 'Active',
      notes: '',
      pubertyDate: '',
      diseaseTestResult: 'Negative',
      congenitalDefects: 'None',
      rudimentaryTeats: '14',
      breedingStatus: 'Growing'
    });
    setIsAddOpen(true);
  };

  const handleOpenImport = () => {
    setFormError('');
    const list = loadMaleGrowers();
    setImportData({
      growerId: list.length > 0 ? list[0]._id : '',
      notes: 'Promoted and imported from Grower module records due to breeding maturity.'
    });
    setIsImportOpen(true);
  };

  const handleOpenStatus = (boar) => {
    setFormError('');
    setSelectedBoar(boar);
    setStatusData({
      status: boar.status,
      remarks: ''
    });
    setIsStatusOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.animalNo || !formData.dob || !formData.breed || !formData.penNo) {
      setFormError('All fields marked with * are strictly required.');
      return;
    }

    try {
      await createBoar({
        ...formData,
        enteredBy: user?.name || 'System'
      });
      setIsAddOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!importData.growerId) {
      setFormError('Please select a male grower to promote.');
      return;
    }

    // Age warning
    const selectedGrower = growersList.find(g => g._id === importData.growerId);
    if (selectedGrower) {
      const dobDate = new Date(selectedGrower.dob);
      const ageInDays = Math.ceil((Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24));
      if (ageInDays < 150) {
        const proceed = window.confirm(`Warning: Selected grower ${selectedGrower.animalNo} is only ${ageInDays} days old. Standard promotion to Boar recommends at least 150 days of age.\n\nDo you want to proceed with the promotion anyway?`);
        if (!proceed) {
          return;
        }
      }
    }

    try {
      await importBoarFromGrower(
        importData.growerId, 
        importData.notes, 
        user?.name || 'System'
      );
      setIsImportOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      await updateBoarStatusDirect(
        selectedBoar._id,
        statusData.status,
        statusData.remarks,
        user?.name || 'System'
      );
      setIsStatusOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Helper for rendering breeding status classes
  const getBreedingStatusBadge = (status) => {
    const map = {
      'Growing': 'text-info bg-info/10 border-info/20',
      'Puberty Reached': 'text-primary bg-primary/10 border-primary/20',
      'Breeding Ready': 'text-success bg-success/10 border-success/20',
      'Breeding Active': 'text-success bg-success/15 border-success/30 font-black animate-pulse',
      'Low Fertility': 'text-warning bg-warning/10 border-warning/20',
      'Under Treatment': 'text-danger bg-danger/10 border-danger/20',
      'Retired': 'text-textSecondary bg-sidebar border-borderDark/60',
      'Sold': 'text-textSecondary bg-sidebar border-borderDark/60',
      'Dead': 'text-danger bg-danger/5 border-danger/10 line-through'
    };
    return (
      <span className={`text-[10px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${map[status] || 'text-textSecondary bg-sidebar'}`}>
        {status}
      </span>
    );
  };

  // Spreadsheet Columns
  const columns = [
    { 
      header: "Boar No", 
      accessor: "animalNo", 
      sortable: true,
      render: (val, row) => (
        <span 
          className="font-extrabold text-primary select-all cursor-pointer hover:underline" 
          onClick={() => navigate(`/boars/${row._id}`)}
        >
          {val}
        </span>
      )
    },
    { 
      header: "Age / DOB", 
      accessor: "dob", 
      sortable: true,
      render: (val) => {
        const diffTime = Math.abs(new Date() - new Date(val));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30);
        return (
          <span title={`DOB: ${new Date(val).toLocaleDateString()}`}>
            {months > 0 ? `${months} Mo (${diffDays}d)` : `${diffDays} Days`}
          </span>
        );
      }
    },
    { header: "Breed", accessor: "breed", sortable: true },
    { 
      header: "Pen No", 
      accessor: "penNo", 
      sortable: true,
      render: (val) => <span className="font-semibold text-textPrimary bg-sidebar border border-borderDark px-2 py-0.5 rounded">{val}</span>
    },
    { 
      header: "Latest Weight", 
      accessor: "latestWeight", 
      sortable: true,
      render: (val) => <span className="font-mono font-bold">{val || '-'} kg</span>
    },
    { 
      header: "Breeding Source", 
      accessor: "source", 
      sortable: true,
      render: (val) => (
        <span className={`text-[10px] font-bold uppercase tracking-wider ${val === 'GrowerPromotion' ? 'text-primary' : 'text-textSecondary'}`}>
          {val === 'GrowerPromotion' ? 'Grower Promotion' : 'Direct Import'}
        </span>
      )
    },
    { 
      header: "Breeding Status", 
      accessor: "breedingStatus", 
      sortable: true,
      render: (val) => getBreedingStatusBadge(val || 'Growing')
    },
    {
      header: "Total Services",
      accessor: "fertilityAnalytics.totalServices",
      sortable: true,
      render: (val, row) => <span className="font-mono font-bold">{row.fertilityAnalytics?.totalServices || 0}</span>
    },
    {
      header: "Pregnancy Success Rate",
      accessor: "fertilityAnalytics.pregnancySuccessRate",
      sortable: true,
      render: (val, row) => (
        <span className={`font-mono font-extrabold ${row.fertilityAnalytics?.pregnancySuccessRate < 60 && row.fertilityAnalytics?.totalServices >= 3 ? 'text-danger' : 'text-success'}`}>
          {row.fertilityAnalytics?.pregnancySuccessRate || 0}%
        </span>
      )
    },
    {
      header: "Avg Litter Size",
      accessor: "fertilityAnalytics.averageLitterSize",
      sortable: true,
      render: (val, row) => <span className="font-mono font-semibold">{row.fertilityAnalytics?.averageLitterSize || 0} piglets</span>
    },
    { 
      header: "Operational Status", 
      accessor: "status", 
      sortable: true,
      render: (val) => <StatusBadge status={val} /> 
    },
    {
      header: "Actions",
      accessor: "_id",
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 no-print">
          <button 
            onClick={() => navigate(`/boars/${row._id}`)}
            className="p-1 hover:bg-cardBg hover:text-primary rounded text-textSecondary"
            title="View full boar reproductive intelligence card"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <button 
              onClick={() => handleOpenStatus(row)}
              className="p-1 hover:bg-cardBg hover:text-warning rounded text-textSecondary"
              title="Transition operational status"
            >
              <ClipboardList className="w-3.5 h-3.5" />
            </button>
          )}
          {user?.role === 'Admin' && (
            <button 
              onClick={() => handleDelete(row._id)}
              className="p-1 hover:bg-cardBg hover:text-danger rounded text-textSecondary"
              title="Delete (soft-delete) record card"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 w-full">
        
        {/* Module title & Header actions */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 no-print">
          <div>
            <h1 className="text-base font-black tracking-wide text-textPrimary uppercase">Boar Breeding Registers</h1>
            <p className="text-[9px] text-textSecondary uppercase tracking-widest mt-1">
              Enterprise Male Breeders, Puberty Milestones, and Semen Vigor Analytics
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleOpenImport}
                className="px-3 py-2 bg-secondary hover:bg-cardBg text-textPrimary text-xs font-bold rounded border border-borderDark transition-all flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Award className="w-3.5 h-3.5 stroke-[2]" />
                Import Male Grower
              </button>
              <button 
                onClick={handleOpenAdd}
                className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-black text-xs font-black rounded shadow-md hover:shadow-glow transition-all flex items-center gap-1 uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Register Boar
              </button>
            </div>
          )}
        </div>

        {/* 6 Core Operational Reproductive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 no-print">
          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Total Boars</p>
              <h3 className="text-xl font-black text-textPrimary mt-1">{kpis.total}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-sidebar/50 border border-borderDark flex items-center justify-center text-textSecondary">
              <Database className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Active Breeders</p>
              <h3 className="text-xl font-black text-success mt-1">{kpis.activeBreeders}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center text-success">
              <Activity className="w-4.5 h-4.5 text-success" />
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Breeding Ready</p>
              <h3 className="text-xl font-black text-primary mt-1">{kpis.breedingReady}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Award className="w-4.5 h-4.5 text-primary" />
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Under Vet Care</p>
              <h3 className="text-xl font-black text-danger mt-1">{kpis.underVet}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center text-danger">
              <Heart className="w-4.5 h-4.5 text-danger animate-pulse" />
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Low Fertility</p>
              <h3 className="text-xl font-black text-warning mt-1">{kpis.lowFertility}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <Percent className="w-4.5 h-4.5 text-warning" />
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Retired / Culled</p>
              <h3 className="text-xl font-black text-textSecondary mt-1">{kpis.retiredCulled}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-sidebar border border-borderDark/40 flex items-center justify-center text-textSecondary">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Database validation errors or backend warnings */}
        {error && (
          <div className="bg-danger/15 border border-danger/25 p-4 rounded-lg text-danger text-xs font-bold uppercase tracking-wider flex items-center gap-2 no-print">
            <span className="w-2 h-2 rounded-full bg-danger animate-ping"></span>
            Warning: {error}
          </div>
        )}

        {/* Dynamic Spreadsheet Record Layout */}
        <div className="bg-cardBg border border-borderDark rounded-lg p-1.5 shadow-sm">
          {loading && boars.length === 0 ? (
            <TableSkeleton rows={8} />
          ) : (
            <DataTable 
              columns={columns} 
              data={boars} 
              searchPlaceholder="Search by Boar No, Breed, Pen..." 
            />
          )}
        </div>

        {/* ========================================================
            MODAL 1: REGISTER NEW BREEDING BOAR (MANUAL REGISTER)
            ======================================================== */}
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Register Existing Breeding Boar"
          footer={
            <>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-primary hover:bg-primary text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Register Card
              </button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs">
            {formError && (
              <div className="bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            
            <FormSection title="Livestock Identity & Metadata (Male Boar)">
              <FormGrid cols={2}>
                <FormField label="Boar Animal No / Ear Tag ID *" required>
                  <input
                    type="text"
                    placeholder="e.g. B-205"
                    value={formData.animalNo}
                    onChange={(e) => setFormData({ ...formData, animalNo: e.target.value.toUpperCase() })}
                    className="dense-input"
                    required
                  />
                </FormField>
                <FormField label="Approx Date of Birth / DOB *" required>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="dense-input"
                    required
                  />
                </FormField>
              </FormGrid>
              <FormGrid cols={2}>
                <FormField label="Breed *" required>
                  <input
                    type="text"
                    placeholder="e.g. Duroc"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="dense-input"
                    required
                  />
                </FormField>
                <FormField label="Current Pen location No *" required>
                  <input
                    type="text"
                    placeholder="e.g. Boar Unit 3"
                    value={formData.penNo}
                    onChange={(e) => setFormData({ ...formData, penNo: e.target.value })}
                    className="dense-input"
                    required
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Ancestry Lineage (Optional)">
              <FormGrid cols={2}>
                <FormField label="Sire ID (Father)">
                  <input
                    type="text"
                    placeholder="e.g. SIRE-901"
                    value={formData.sireNo}
                    onChange={(e) => setFormData({ ...formData, sireNo: e.target.value.toUpperCase() })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Dam ID (Mother)">
                  <input
                    type="text"
                    placeholder="e.g. DAM-102"
                    value={formData.damNo}
                    onChange={(e) => setFormData({ ...formData, damNo: e.target.value.toUpperCase() })}
                    className="dense-input"
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Growth & Reproductive Specs (Partial Data Supported)">
              <FormGrid cols={2}>
                <FormField label="Birth Weight (kg)">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.5"
                    value={formData.birthWeight}
                    onChange={(e) => setFormData({ ...formData, birthWeight: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Current Weight (kg)">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150"
                    value={formData.currentWeight}
                    onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormGrid cols={3}>
                <FormField label="Date of Puberty (if reached)">
                  <input
                    type="date"
                    value={formData.pubertyDate}
                    onChange={(e) => setFormData({ ...formData, pubertyDate: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Teats Count">
                  <input
                    type="number"
                    value={formData.rudimentaryTeats}
                    onChange={(e) => setFormData({ ...formData, rudimentaryTeats: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Breeding Status">
                  <select
                    value={formData.breedingStatus}
                    onChange={(e) => setFormData({ ...formData, breedingStatus: e.target.value })}
                    className="dense-select"
                  >
                    <option value="Growing">Growing</option>
                    <option value="Puberty Reached">Puberty Reached</option>
                    <option value="Breeding Ready">Breeding Ready</option>
                    <option value="Breeding Active">Breeding Active</option>
                    <option value="Low Fertility">Low Fertility</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Retired">Retired</option>
                  </select>
                </FormField>
              </FormGrid>
              <FormGrid cols={2}>
                <FormField label="Disease Testing Result">
                  <select
                    value={formData.diseaseTestResult}
                    onChange={(e) => setFormData({ ...formData, diseaseTestResult: e.target.value })}
                    className="dense-select"
                  >
                    <option value="Negative">Negative</option>
                    <option value="Positive">Positive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </FormField>
                <FormField label="Congenital Defects">
                  <input
                    type="text"
                    placeholder="e.g. Hernia, Cryptorchidism, or None"
                    value={formData.congenitalDefects}
                    onChange={(e) => setFormData({ ...formData, congenitalDefects: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormField label="General Management Notes">
                <textarea
                  rows={2}
                  placeholder="Additional health history, genetic characteristics..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="dense-input w-full p-2"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ========================================================
            MODAL 2: IMPORT / PROMOTE MALE GROWER TO BOAR
            ======================================================== */}
        <Modal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          title="Import Male Grower to Boar Registry"
          footer={
            <>
              <button 
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleImportSubmit}
                disabled={growersList.length === 0}
                className="px-4 py-2 bg-success text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs rounded uppercase font-bold shadow-md hover:bg-success/90"
              >
                Promote & Import
              </button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs" onSubmit={handleImportSubmit}>
            {formError && (
              <div className="bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <FormSection title="Breeder Promotion Setup">
              {growersList.length === 0 ? (
                <div className="p-4 bg-sidebar rounded border border-borderDark text-center flex flex-col items-center justify-center gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-textPrimary">No Male Growers Eligible for Promotion</span>
                    <span className="text-[10px] text-textSecondary">
                      All male grower cards are already promoted or currently set as inactive/slaughtered.
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsImportOpen(false);
                      navigate('/growers');
                    }}
                    className="mt-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded text-xs font-bold uppercase transition-all"
                  >
                    View Grower Records
                  </button>
                </div>
              ) : (
                <>
                  <FormField label="Select Male Grower Candidate" required>
                    <select
                      value={importData.growerId}
                      onChange={(e) => setImportData({ ...importData, growerId: e.target.value })}
                      className="dense-select"
                      required
                    >
                      {growersList.map(g => {
                        const ageDays = Math.ceil((Date.now() - new Date(g.dob).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <option key={g._id} value={g._id}>
                            {g.animalNo} — {g.breed} ({ageDays}d old, {g.latestWeight || g.birthWeight} kg, {g.penNo})
                          </option>
                        );
                      })}
                    </select>
                  </FormField>

                  <FormField label="Promotion Auditing Remarks notes">
                    <textarea
                      rows={3}
                      placeholder="e.g. Promoted due to excellent average daily gain and semen traits rating."
                      value={importData.notes}
                      onChange={(e) => setImportData({ ...importData, notes: e.target.value })}
                      className="dense-input w-full p-2"
                    />
                  </FormField>
                  
                  <div className="p-3 bg-primary/10 border border-primary/25 rounded text-[11px] text-primary flex items-start gap-2">
                    <Award className="w-4.5 h-4.5 flex-shrink-0 text-primary mt-0.5" />
                    <div>
                      <span className="font-bold">Promotion Rule & Flow:</span>
                      <p className="mt-0.5 text-textSecondary leading-normal">
                        Copies birth weight, latest weight, DOB, breed, parent ancestry, pen, and history to create an active Boar card. Updates grower status to "Promoted to Boar" to prevent duplicate promotion.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </FormSection>
          </form>
        </Modal>

        {/* ========================================================
            MODAL 3: TRANSITION STATUS HISTORY
            ======================================================== */}
        <Modal
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
          title={`Transition status for ${selectedBoar?.animalNo}`}
          footer={
            <>
              <button 
                onClick={() => setIsStatusOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleStatusSubmit}
                className="px-4 py-2 bg-primary hover:bg-primary text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Transition
              </button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs">
            {formError && (
              <div className="bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium text-[11px]">
                {formError}
              </div>
            )}
            
            <FormSection title="Status Transition details">
              <FormGrid cols={2}>
                <FormField label="Current Status">
                  <input
                    type="text"
                    value={selectedBoar?.status || ''}
                    disabled
                    className="dense-input opacity-60 cursor-not-allowed uppercase"
                  />
                </FormField>
                <FormField label="New Target Status" required>
                  <select
                    value={statusData.status}
                    onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                    className="dense-select"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Culled">Culled</option>
                    <option value="Dead">Dead</option>
                  </select>
                </FormField>
              </FormGrid>
              <FormField label="Operational remarks / Transition reason" required>
                <input
                  type="text"
                  placeholder="e.g. Boar fully recovered or retired from breeding"
                  value={statusData.remarks}
                  onChange={(e) => setStatusData({ ...statusData, remarks: e.target.value })}
                  className="dense-input"
                  required
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

      </div>
    </MainLayout>
  );
}
