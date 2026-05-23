import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DatePicker from '../components/ui/DatePicker';
import { useGrowerStore } from '../store/useGrowerStore';
import { useAuthStore } from '../store/useAuthStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { FormField, FormGrid, FormSection } from '../components/ui/FormLayout';
import AnimalSelect from '../components/ui/AnimalSelect';
import { TableSkeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import { Plus, Eye, Edit, Trash2, Scale, Calendar, ClipboardList, Database, Award, Skull } from 'lucide-react';

export default function GrowerRecord() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    growers, 
    loading, 
    error, 
    fetchGrowers, 
    createGrower, 
    updateGrower, 
    deleteGrower,
    updateStatusRecord,
    addWeightRecord,
    promoteToSow,
    promoteToBoar
  } = useGrowerStore();

  // 1. Core State Triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [promotionRemarks, setPromotionRemarks] = useState('Promoted and imported from Grower module records due to breeding maturity.');

  const [isMortalityOpen, setIsMortalityOpen] = useState(false);
  const [mortalityAnimal, setMortalityAnimal] = useState(null);
  const [mortalityForm, setMortalityForm] = useState({
    causeOfDeath: 'Disease',
    postmortemFindings: '',
    notes: '',
    deathDate: new Date().toISOString().split('T')[0]
  });

  // 2. Form payload states
  const [formData, setFormData] = useState({
    animalNo: '',
    dob: '',
    sex: 'Male',
    breed: '',
    sireNo: 'UNKNOWN',
    damNo: 'UNKNOWN',
    birthWeight: '',
    penNo: '',
    status: 'Active',
    weaningWeight: '',
    notes: ''
  });

  const [statusData, setStatusData] = useState({
    status: 'Active',
    remarks: ''
  });

  const [weightData, setWeightData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Weekly',
    weight: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  // 3. Load database registers on mount
  useEffect(() => {
    fetchGrowers();
  }, [fetchGrowers]);

  // Can the current user perform operational edits?
  const canEdit = user?.role === 'Admin' || user?.role === 'Farm Worker';

  // 4. Summarize KPI Cards
  const kpis = useMemo(() => {
    const active = growers.filter(g => g.status === 'Active');
    const total = active.length;
    
    // Average birth weight calculation
    const avgBirth = total > 0 
      ? (active.reduce((acc, g) => acc + g.birthWeight, 0) / total).toFixed(2) 
      : '0.00';
    
    // Pen locations distributions
    const pens = [...new Set(active.map(g => g.penNo))].length;

    // Slaughter scheduled (status check)
    const slaughterScheduled = growers.filter(g => g.status === 'Slaughtered' || g.slaughterDate).length;

    return { total, avgBirth, pens, slaughterScheduled };
  }, [growers]);

  // 5. Open Form handlers
  const handleOpenAdd = () => {
    setFormError('');
    setFormData({
      animalNo: '',
      dob: '',
      sex: 'Male',
      breed: '',
      sireNo: 'UNKNOWN',
      damNo: 'UNKNOWN',
      birthWeight: '',
      penNo: '',
      status: 'Active',
      weaningWeight: '',
      notes: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (animal) => {
    setFormError('');
    setSelectedAnimal(animal);
    setFormData({
      animalNo: animal.animalNo,
      dob: animal.dob.split('T')[0],
      sex: animal.sex,
      breed: animal.breed,
      sireNo: animal.sireNo || 'UNKNOWN',
      damNo: animal.damNo || 'UNKNOWN',
      birthWeight: animal.birthWeight,
      penNo: animal.penNo,
      status: animal.status,
      weaningWeight: animal.weaningWeight || '',
      notes: animal.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleOpenStatus = (animal) => {
    setFormError('');
    setSelectedAnimal(animal);
    setStatusData({
      status: animal.status,
      remarks: ''
    });
    setIsStatusOpen(true);
  };

  const handleOpenUpdateWeight = (animal) => {
    setFormError('');
    setSelectedAnimal(animal);
    setWeightData({
      date: new Date().toISOString().split('T')[0],
      type: 'Weekly',
      weight: '',
      notes: ''
    });
    setIsWeightOpen(true);
  };

  const handleOpenPromote = (animal) => {
    setFormError('');
    setSelectedAnimal(animal);
    setPromotionRemarks(`Promoted and imported from Grower records due to breeding maturity.`);
    setIsPromoteOpen(true);
  };

  const handleOpenMortality = (animal) => {
    setMortalityAnimal(animal);
    setMortalityForm({
      causeOfDeath: 'Disease',
      postmortemFindings: '',
      notes: '',
      deathDate: new Date().toISOString().split('T')[0]
    });
    setIsMortalityOpen(true);
  };

  const handleMortalitySubmit = async (e) => {
    e.preventDefault();
    try {
      const { useMortalityStore } = await import('../store/useMortalityStore');
      const recordMortality = useMortalityStore.getState().recordMortality;
      await recordMortality({
        animalId: mortalityAnimal.animalNo,
        causeOfDeath: mortalityForm.causeOfDeath,
        postmortemFindings: mortalityForm.postmortemFindings,
        notes: mortalityForm.notes,
        deathDate: mortalityForm.deathDate,
        recordedBy: user?.name || 'System'
      });
      setIsMortalityOpen(false);
      fetchGrowers();
    } catch (err) {
      alert(err.message);
    }
  };

  // 6. Submit Actions
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.animalNo || !formData.dob || !formData.breed || !formData.birthWeight || !formData.penNo) {
      setFormError('All fields marked * are strictly required.');
      return;
    }

    try {
      await createGrower({
        ...formData,
        enteredBy: user?.name || 'System'
      });
      setIsAddOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      await updateGrower(selectedAnimal._id, {
        ...formData,
        enteredBy: user?.name || 'System'
      });
      setIsEditOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setFormError('');

    if (statusData.status === 'Dead') {
      setIsStatusOpen(false);
      handleOpenMortality(selectedAnimal);
      return;
    }

    try {
      if (statusData.status === 'Promoted to Sow') {
        if (selectedAnimal.sex !== 'Female') {
          throw new Error("Only female growers can be promoted to Sow.");
        }
        const updated = await promoteToSow(selectedAnimal._id, user?.name || 'System');
        setIsStatusOpen(false);
        navigate(`/sows/${updated.sowId}`);
      } else if (statusData.status === 'Promoted to Boar') {
        if (selectedAnimal.sex !== 'Male') {
          throw new Error("Only male growers can be promoted to Boar.");
        }
        const updated = await promoteToBoar(selectedAnimal._id, user?.name || 'System');
        setIsStatusOpen(false);
        navigate(`/boars/${updated.boarId}`);
      } else {
        await updateStatusRecord(selectedAnimal._id, statusData.status, statusData.remarks, user?.name || 'System');
        setIsStatusOpen(false);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!weightData.weight || Number(weightData.weight) <= 0) {
      setFormError('Weight must be a positive number.');
      return;
    }

    if (new Date(weightData.date) > new Date()) {
      setFormError('Future dates are not allowed.');
      return;
    }

    try {
      await addWeightRecord(selectedAnimal._id, {
        date: weightData.date,
        type: weightData.type,
        weight: Number(weightData.weight),
        notes: weightData.notes,
        enteredBy: user?.name || 'System'
      });
      setIsWeightOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (selectedAnimal.sex === 'Female') {
        const updated = await promoteToSow(selectedAnimal._id, user?.name || 'System');
        setIsPromoteOpen(false);
        navigate(`/sows/${updated.sowId}`);
      } else {
        const updated = await promoteToBoar(selectedAnimal._id, user?.name || 'System');
        setIsPromoteOpen(false);
        navigate(`/boars/${updated.boarId}`);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this animal record card? This will perform a soft-delete (archive) from the operational list.")) {
      try {
        await deleteGrower(id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // 8. Spreadsheet Column definitions
  const columns = [
    { 
      header: "Animal No", 
      accessor: "animalNo", 
      sortable: true,
      render: (val, row) => (
        <span 
          className="font-extrabold text-primary select-all cursor-pointer hover:underline" 
          onClick={() => navigate(`/growers/${row._id}`)}
          title={row.originPigletId || row.originalPigletId ? `Origin Piglet ID: ${row.originPigletId || row.originalPigletId}` : undefined}
        >
          {val}
        </span>
      )
    },
    { 
      header: "DOB", 
      accessor: "dob", 
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString() 
    },
    { 
      header: "Sex", 
      accessor: "sex", 
      sortable: true,
      render: (val) => <StatusBadge status={val} /> 
    },
    { header: "Breed", accessor: "breed", sortable: true },
    { 
      header: "Birth Wt (kg)", 
      accessor: "birthWeight", 
      sortable: true,
      render: (val) => <span className="font-mono">{val} kg</span>
    },
    { 
      header: "Latest Wt (kg)", 
      accessor: "latestWeight",
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-success">{val} kg</span>
    },
    { 
      header: "ADG (kg/d)", 
      accessor: "adg",
      sortable: true,
      render: (val) => <span className="font-mono font-semibold text-blueAccent">{val}</span>
    },
    { 
      header: "Pen No", 
      accessor: "penNo", 
      sortable: true,
      render: (val) => <span className="font-semibold text-textPrimary bg-sidebar border border-borderDark px-2 py-0.5 rounded">{val}</span>
    },
    {
      header: "Origin",
      accessor: "lifecycleSource",
      sortable: true,
      render: (val, row) => {
        if (val === 'Farrowing Promotion' && row.originPigletId) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-black text-warning bg-warning/10 px-1.5 py-0.5 rounded w-fit">
                Farrowing
              </span>
              <span className="text-[10px] font-mono text-textSecondary">{row.originPigletId}</span>
            </div>
          );
        }
        return <span className="text-[10px] text-textSecondary">{val || 'Direct Entry'}</span>;
      }
    },
    { 
      header: "Status", 
      accessor: "status", 
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={val} />
          {val === 'Dead' && (
            <Skull className="w-3.5 h-3.5 text-danger shrink-0 animate-pulse" title="Animal deceased — lifecycle closed" />
          )}
        </div>
      )
    },
    {
      header: "Actions",
      accessor: "_id",
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 no-print">
          <button 
            onClick={() => navigate(`/growers/${row._id}`)}
            className="p-1 hover:bg-cardBg hover:text-primary rounded text-textSecondary"
            title="View full history card"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <>
              <button 
                onClick={() => handleOpenUpdateWeight(row)}
                className={`p-1 hover:bg-cardBg hover:text-primary rounded text-textSecondary ${row.status === 'Dead' ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={row.status === 'Dead'}
                title={row.status === 'Dead' ? "Animal deceased — lifecycle closed" : "Update Weight"}
              >
                <Scale className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleOpenStatus(row)}
                className={`p-1 hover:bg-cardBg hover:text-success rounded text-textSecondary ${row.status === 'Dead' ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={row.status === 'Dead'}
                title={row.status === 'Dead' ? "Animal deceased — lifecycle closed" : "Transition status state"}
              >
                <ClipboardList className="w-3.5 h-3.5" />
              </button>
              {row.status !== 'Promoted to Sow' && row.status !== 'Promoted to Boar' && row.status !== 'Sold' && row.status !== 'Slaughtered' && row.status !== 'Dead' && (
                <button 
                  onClick={() => handleOpenPromote(row)}
                  className="p-1 hover:bg-cardBg hover:text-primary rounded text-textSecondary"
                  title={row.sex === 'Female' ? "Promote to Sow" : "Promote to Boar"}
                >
                  <Award className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                onClick={() => handleOpenEdit(row)}
                className={`p-1 hover:bg-cardBg hover:text-yellow-500 rounded text-textSecondary ${row.status === 'Dead' ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={row.status === 'Dead'}
                title={row.status === 'Dead' ? "Animal deceased — lifecycle closed" : "Edit core details"}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {user?.role === 'Admin' && (
            <button 
              onClick={() => handleDelete(val)}
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
      <div className="flex flex-col gap-5 w-full">
        
        {/* Module Header Panel */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 no-print">
          <div>
            <h2 className="text-base font-black tracking-wide text-textPrimary uppercase">
              GROWER RECORD CARDS
            </h2>
            <p className="text-[10px] text-textSecondary uppercase tracking-widest mt-1">
              Livestock growth rates, weight entries, and pen distributions
            </p>
          </div>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-black text-xs font-bold rounded shadow-md hover:shadow-glow transition-all duration-150 flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Register Grower
            </button>
          )}
        </div>

        {/* KPI Summaries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Active Growers</p>
              <h3 className="text-xl font-black text-primary mt-1">{kpis.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Avg Birth Wt</p>
              <h3 className="text-xl font-black text-success mt-1">{kpis.avgBirth} <span className="text-xs">kg</span></h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Active Pens</p>
              <h3 className="text-xl font-black text-blueAccent mt-1">{kpis.pens}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blueAccent/10 flex items-center justify-center text-blueAccent">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Scheduled Slaughter</p>
              <h3 className="text-xl font-black text-warning mt-1">{kpis.slaughterScheduled}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-danger/10 border border-danger/25 text-danger p-3.5 rounded-lg text-xs font-semibold no-print">
            [Growers Module Sync Failure]: {error}
          </div>
        )}

        {/* Dense Spreadsheet Registers */}
        {loading ? (
          <TableSkeleton rows={7} cols={8} />
        ) : (
          <DataTable 
            columns={columns} 
            data={growers} 
            searchPlaceholder="Search by Animal No, Breed, Pen..."
          />
        )}

        {/* ==============================================
            MODAL 1: REGISTER NEW GROWER
            ============================================== */}
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Register New Grower"
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
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Save Record
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
            
            <FormSection title="Livestock Identity">
              <FormGrid cols={2}>
                <FormField label="Animal No / Tag ID" required>
                  <AnimalSelect
                     value={formData.animalNo}
                     onChange={(val) => setFormData({ ...formData, animalNo: val })}
                     onSelectFull={(animal) => {
                       setFormData(prev => ({
                         ...prev,
                         animalNo: animal.animalNo,
                         breed: animal.breed || prev.breed,
                         dob: animal.dob ? animal.dob.split('T')[0] : prev.dob,
                         sex: animal.sex || prev.sex,
                         birthWeight: animal.currentWeight || animal.birthWeight || prev.birthWeight,
                         penNo: animal.currentPen || prev.penNo
                       }));
                     }}
                     filterByStage="Grower"
                     required
                  />
                </FormField>
                <FormField label="Breed" required>
                  <input
                     type="text"
                     placeholder="e.g. Large White"
                     value={formData.breed}
                     onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormGrid cols={2}>
                <FormField label="DOB / Birth Date" required>
                  <DatePicker
                     value={formData.dob}
                     onChange={(val) => setFormData({ ...formData, dob: val })}
                  />
                </FormField>
                <FormField label="Sex / Gender" required>
                  <select
                     value={formData.sex}
                     onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                     className="dense-select"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </FormField>
              </FormGrid>
            </FormSection>
            
            <FormSection title="Lineage & Weight">
              <FormGrid cols={3}>
                <FormField label="Sire No (Sire Tag)">
                  <input
                     type="text"
                     value={formData.sireNo}
                     onChange={(e) => setFormData({ ...formData, sireNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Dam No (Dam Tag)">
                  <input
                     type="text"
                     value={formData.damNo}
                     onChange={(e) => setFormData({ ...formData, damNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Birth Weight (kg)" required>
                  <input
                     type="number"
                     step="0.01"
                     placeholder="e.g. 1.4"
                     value={formData.birthWeight}
                     onChange={(e) => setFormData({ ...formData, birthWeight: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormGrid cols={2}>
                <FormField label="Weaning Weight (kg)">
                  <input
                     type="number"
                     step="0.01"
                     placeholder="e.g. 6.8"
                     value={formData.weaningWeight}
                     onChange={(e) => setFormData({ ...formData, weaningWeight: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Pen location No" required>
                  <input
                     type="text"
                     placeholder="e.g. Pen 14B"
                     value={formData.penNo}
                     onChange={(e) => setFormData({ ...formData, penNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
            </FormSection>
            <FormSection title="Operational comments">
              <FormField label="General Management Notes">
                <textarea
                   rows={2}
                   placeholder="Insert growth notes..."
                   value={formData.notes}
                   onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                   className="dense-input w-full p-2"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ==============================================
            MODAL 2: EDIT EXISTING DETAILS
            ============================================== */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit details for ${selectedAnimal?.animalNo}`}
          footer={
            <>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Update Details
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
            
            <FormSection title="Livestock Identity">
              <FormGrid cols={2}>
                <FormField label="Animal No (Read-only)">
                  <input
                     type="text"
                     value={formData.animalNo}
                     disabled
                     className="dense-input opacity-50 cursor-not-allowed"
                  />
                </FormField>
                <FormField label="Breed">
                  <input
                     type="text"
                     value={formData.breed}
                     onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormGrid cols={2}>
                <FormField label="DOB (Read-only)">
                  <input
                     type="date"
                     value={formData.dob}
                     disabled
                     className="dense-input opacity-50 cursor-not-allowed"
                  />
                </FormField>
                <FormField label="Sex">
                  <select
                     value={formData.sex}
                     onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                     className="dense-select"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Lineage & Weight">
              <FormGrid cols={2}>
                <FormField label="Sire No">
                  <input
                     type="text"
                     value={formData.sireNo}
                     onChange={(e) => setFormData({ ...formData, sireNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Dam No">
                  <input
                     type="text"
                     value={formData.damNo}
                     onChange={(e) => setFormData({ ...formData, damNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormGrid cols={3}>
                <FormField label="Birth Weight (kg)">
                  <input
                     type="number"
                     step="0.01"
                     value={formData.birthWeight}
                     onChange={(e) => setFormData({ ...formData, birthWeight: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Weaning Weight (kg)">
                  <input
                     type="number"
                     step="0.01"
                     value={formData.weaningWeight}
                     onChange={(e) => setFormData({ ...formData, weaningWeight: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Pen location No">
                  <input
                     type="text"
                     value={formData.penNo}
                     onChange={(e) => setFormData({ ...formData, penNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
            </FormSection>
            <FormSection title="Operational remarks">
              <FormField label="General Management Notes">
                <textarea
                   rows={2}
                   value={formData.notes}
                   onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                   className="dense-input w-full p-2"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ==============================================
            MODAL 3: TRANSITION STATUS STATE
            ============================================== */}
        <Modal
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
          title={`Transition status for ${selectedAnimal?.animalNo}`}
          footer={
            <>
              <button 
                onClick={() => setIsStatusOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleStatusChange}
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
                     value={selectedAnimal?.status || ''}
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
                    <option value="Under Observation">Under Observation</option>
                    <option value="Breeding Candidate">Breeding Candidate</option>
                    {selectedAnimal?.sex === 'Female' ? (
                      <option value="Promoted to Sow">Promoted to Sow (Breeder Registry)</option>
                    ) : (
                      <option value="Promoted to Boar">Promoted to Boar (Breeder Registry)</option>
                    )}
                    <option value="Sold">Sold</option>
                    <option value="Slaughtered">Slaughtered</option>
                    <option value="Dead">Dead</option>
                  </select>
                </FormField>
              </FormGrid>
              <FormField label="Operational Remarks / Transition Remarks" required>
                <input
                  type="text"
                  placeholder="e.g. Promoted due to strong ADG and physical rating"
                  value={statusData.remarks}
                  onChange={(e) => setStatusData({ ...statusData, remarks: e.target.value })}
                  className="dense-input"
                  required
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ==============================================
            MODAL 4: DYNAMIC WEIGHT UPDATE MODAL
            ============================================== */}
        <Modal
          isOpen={isWeightOpen}
          onClose={() => setIsWeightOpen(false)}
          title={`Update Weight for ${selectedAnimal?.animalNo}`}
          footer={
            <>
              <button 
                onClick={() => setIsWeightOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleWeightSubmit}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Save Weight
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
            
            <FormSection title="Weight Log Entry">
              <FormGrid cols={3}>
                <FormField label="Weighing Date" required>
                  <DatePicker
                    value={weightData.date}
                    onChange={(val) => setWeightData({ ...weightData, date: val })}
                  />
                </FormField>
                <FormField label="Weight Type" required>
                  <select
                    value={weightData.type}
                    onChange={(e) => setWeightData({ ...weightData, type: e.target.value })}
                    className="dense-select"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weaning">Weaning</option>
                    <option value="Manual Check">Manual Check</option>
                  </select>
                </FormField>
                <FormField label="Weight (kg)" required>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 34.5"
                    value={weightData.weight}
                    onChange={(e) => setWeightData({ ...weightData, weight: e.target.value })}
                    className="dense-input"
                    autoFocus
                  />
                </FormField>
              </FormGrid>
              <FormField label="Notes / Comments">
                <input
                  type="text"
                  placeholder="e.g. Excellent active condition"
                  value={weightData.notes}
                  onChange={(e) => setWeightData({ ...weightData, notes: e.target.value })}
                  className="dense-input"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ==============================================
            MODAL 5: CONFIRM BREEDER PROMOTION
            ============================================== */}
        <Modal
          isOpen={isPromoteOpen}
          onClose={() => setIsPromoteOpen(false)}
          title={`Promote Grower ${selectedAnimal?.animalNo} to ${selectedAnimal?.sex === 'Female' ? 'Sow' : 'Boar'}`}
          footer={
            <>
              <button 
                onClick={() => setIsPromoteOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handlePromoteSubmit}
                className="px-4 py-2 bg-success text-white text-xs rounded uppercase font-bold shadow-md hover:bg-success/90"
              >
                Promote & Import
              </button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs" onSubmit={handlePromoteSubmit}>
            {formError && (
              <div className="bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium text-[11px]">
                {formError}
              </div>
            )}

            <FormSection title="Breeder Promotion Details">
              <div className="mb-3 text-textPrimary leading-relaxed">
                You are about to promote the {selectedAnimal?.sex.toLowerCase()} grower candidate <span className="font-extrabold text-primary">{selectedAnimal?.animalNo}</span> to a breeding {selectedAnimal?.sex === 'Female' ? 'Sow' : 'Boar'}.
              </div>

              <FormField label="Promotion Auditing Remarks notes" required>
                <textarea
                  rows={3}
                  placeholder="e.g. Promoted due to excellent average daily gain and structural maturity."
                  value={promotionRemarks}
                  onChange={(e) => setPromotionRemarks(e.target.value)}
                  className="dense-input w-full p-2"
                  required
                />
              </FormField>
              
              <div className="p-3 bg-primary/10 border border-primary/25 rounded text-[11px] text-primary flex items-start gap-2">
                <span className="font-bold">Operational Note:</span>
                <span>
                  Promoting updates this grower's operational status to "Promoted to {selectedAnimal?.sex === 'Female' ? 'Sow' : 'Boar'}", registers a new active {selectedAnimal?.sex === 'Female' ? 'Sow' : 'Boar'} Card, copies over history, and redirects you automatically.
                </span>
              </div>
            </FormSection>
          </form>
        </Modal>

        {/* ==============================================
            MODAL 6: RECORD MORTALITY CONFIRMATION
            ============================================== */}
        <Modal
          isOpen={isMortalityOpen}
          onClose={() => setIsMortalityOpen(false)}
          title={`Record Mortality — Grower ${mortalityAnimal?.animalNo}`}
          icon={<Skull className="w-5 h-5 text-danger" />}
          footer={
            <>
              <button 
                onClick={() => setIsMortalityOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleMortalitySubmit}
                className="px-4 py-2 bg-danger hover:bg-danger/80 text-white text-xs rounded uppercase font-bold shadow-md"
              >
                Record Mortality
              </button>
            </>
          }
        >
          <form onSubmit={handleMortalitySubmit} className="flex flex-col gap-4 text-xs">
            <FormSection title="Deceased Grower Logistics">
              <FormGrid cols={2}>
                <FormField label="Animal ID">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed font-mono font-bold text-primary" value={mortalityAnimal?.animalNo || ''} readOnly />
                </FormField>
                <FormField label="Breed">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed" value={mortalityAnimal?.breed || ''} readOnly />
                </FormField>
              </FormGrid>
              <FormGrid cols={3}>
                <FormField label="Sex">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed" value={mortalityAnimal?.sex || ''} readOnly />
                </FormField>
                <FormField label="Lifecycle Stage">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed" value="Grower" readOnly />
                </FormField>
                <FormField label="Current Pen / Location">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed font-mono text-[10.5px]" value={mortalityAnimal?.penNo || ''} readOnly />
                </FormField>
              </FormGrid>
            </FormSection>
            
            <FormSection title="Clinical Mortality Details">
              <FormGrid cols={2}>
                <FormField label="Cause Of Death" required>
                  <select
                    value={mortalityForm.causeOfDeath}
                    onChange={(e) => setMortalityForm({ ...mortalityForm, causeOfDeath: e.target.value })}
                    className="dense-select"
                  >
                    {['Disease', 'Respiratory Failure', 'Infection', 'Accident', 'Weak Birth', 'Injury', 'Unknown', 'Natural Causes', 'Euthanasia'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Date Of Death" required>
                  <DatePicker
                    value={mortalityForm.deathDate}
                    onChange={(val) => setMortalityForm({ ...mortalityForm, deathDate: val })}
                  />
                </FormField>
              </FormGrid>
              <FormField label="Postmortem Findings" required>
                <input
                  type="text"
                  placeholder="e.g. Lungs congested, heart lesions"
                  value={mortalityForm.postmortemFindings}
                  onChange={(e) => setMortalityForm({ ...mortalityForm, postmortemFindings: e.target.value })}
                  className="dense-input"
                  required
                />
              </FormField>
              <FormField label="Additional Description / Notes">
                <textarea
                  rows={2}
                  placeholder="Enter any other specific observations regarding clinical treatment history or timeline..."
                  value={mortalityForm.notes}
                  onChange={(e) => setMortalityForm({ ...mortalityForm, notes: e.target.value })}
                  className="dense-input w-full p-2"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

      </div>
    </MainLayout>
  );
}
