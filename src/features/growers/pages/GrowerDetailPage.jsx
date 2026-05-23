import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import { useGrowerStore } from '../../../store/useGrowerStore';
import { useAuthStore } from '../../../store/useAuthStore';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { FormField, FormGrid, FormSection } from '../../../components/ui/FormLayout';
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, 
  Scale, 
  Calendar, 
  Tag, 
  TrendingUp, 
  Activity, 
  Clock, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Printer, 
  CheckCircle,
  AlertCircle,
  Award,
  ChevronUp,
  ChevronDown,
  Skull
} from 'lucide-react';

export default function GrowerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    selectedGrower, 
    loading, 
    error, 
    fetchGrowerById, 
    addWeightRecord, 
    updateWeightRecord, 
    deleteWeightRecord, 
    updateStatusRecord,
    updateGrower,
    promoteToSow,
    promoteToBoar
  } = useGrowerStore();

  const canEdit = user?.role === 'Admin' || user?.role === 'Farm Worker';

  // 1. Modals state triggers
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [isEditWeightOpen, setIsEditWeightOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isMortalityOpen, setIsMortalityOpen] = useState(false);
  const [mortalityForm, setMortalityForm] = useState({
    causeOfDeath: 'Disease',
    postmortemFindings: '',
    notes: '',
    deathDate: new Date().toISOString().split('T')[0]
  });

  // 2. Forms payload states
  const [selectedWeightLog, setSelectedWeightLog] = useState(null);
  const [weightData, setWeightData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Weekly',
    weight: '',
    notes: ''
  });

  const [statusData, setStatusData] = useState({
    status: 'Active',
    remarks: ''
  });

  const [editDetailsData, setEditDetailsData] = useState({
    breed: '',
    sex: 'Male',
    sireNo: '',
    damNo: '',
    penNo: '',
    birthWeight: '',
    weaningWeight: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  // Sorting & Filtering for Weight Timeline Table
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [typeFilter, setTypeFilter] = useState('All');

  // 3. Load record details
  useEffect(() => {
    fetchGrowerById(id);
  }, [id, fetchGrowerById]);

  // Load details data once loaded
  useEffect(() => {
    if (selectedGrower) {
      setEditDetailsData({
        breed: selectedGrower.breed,
        sex: selectedGrower.sex,
        sireNo: selectedGrower.sireNo,
        damNo: selectedGrower.damNo,
        penNo: selectedGrower.penNo,
        birthWeight: selectedGrower.birthWeight,
        weaningWeight: selectedGrower.weaningWeight || '',
        notes: selectedGrower.notes || ''
      });
      setStatusData({
        status: selectedGrower.status,
        remarks: ''
      });
    }
  }, [selectedGrower]);

  // Calculate age in days
  const ageInDays = useMemo(() => {
    if (!selectedGrower) return 0;
    const diffTime = Math.abs(new Date() - new Date(selectedGrower.dob));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [selectedGrower]);

  // Open modals handlers
  const handleOpenAddWeight = () => {
    setFormError('');
    setWeightData({
      date: new Date().toISOString().split('T')[0],
      type: 'Weekly',
      weight: '',
      notes: ''
    });
    setIsWeightOpen(true);
  };

  const handleOpenEditWeight = (log) => {
    setFormError('');
    setSelectedWeightLog(log);
    setWeightData({
      date: log.date.split('T')[0],
      type: log.type,
      weight: log.weight,
      notes: log.notes || ''
    });
    setIsEditWeightOpen(true);
  };

  const handleOpenStatus = () => {
    setFormError('');
    setStatusData({
      status: selectedGrower?.status || 'Active',
      remarks: ''
    });
    setIsStatusOpen(true);
  };

  const handleOpenEditDetails = () => {
    setFormError('');
    setIsEditDetailsOpen(true);
  };

  const handleOpenMortality = () => {
    setFormError('');
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
      const { useMortalityStore } = await import('../../../store/useMortalityStore');
      const recordMortality = useMortalityStore.getState().recordMortality;
      await recordMortality({
        animalId: selectedGrower.animalNo,
        causeOfDeath: mortalityForm.causeOfDeath,
        postmortemFindings: mortalityForm.postmortemFindings,
        notes: mortalityForm.notes,
        deathDate: mortalityForm.deathDate,
        recordedBy: user?.name || 'System'
      });
      setIsMortalityOpen(false);
      fetchGrowerById(id);
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit operations
  const handleAddWeight = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!weightData.weight || Number(weightData.weight) <= 0) {
      setFormError('Please enter a valid positive weight.');
      return;
    }

    if (new Date(weightData.date) > new Date()) {
      setFormError('Future dates are not allowed.');
      return;
    }

    try {
      await addWeightRecord(id, {
        ...weightData,
        weight: Number(weightData.weight),
        enteredBy: user?.name || 'System'
      });
      setIsWeightOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEditWeight = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!weightData.weight || Number(weightData.weight) <= 0) {
      setFormError('Please enter a valid positive weight.');
      return;
    }

    if (new Date(weightData.date) > new Date()) {
      setFormError('Future dates are not allowed.');
      return;
    }

    try {
      await updateWeightRecord(id, selectedWeightLog._id, {
        ...weightData,
        weight: Number(weightData.weight),
        enteredBy: user?.name || 'System'
      });
      setIsEditWeightOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteWeight = async (weightLogId) => {
    if (window.confirm("Are you sure you want to delete this weight log entry?")) {
      try {
        await deleteWeightRecord(id, weightLogId);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setFormError('');

    if (statusData.status === 'Dead') {
      setIsStatusOpen(false);
      handleOpenMortality();
      return;
    }

    try {
      await updateStatusRecord(id, statusData.status, statusData.remarks, user?.name || 'System');
      setIsStatusOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEditDetails = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!editDetailsData.breed || !editDetailsData.penNo || !editDetailsData.birthWeight) {
      setFormError('All fields marked * are strictly required.');
      return;
    }

    try {
      await updateGrower(id, {
        ...editDetailsData,
        birthWeight: Number(editDetailsData.birthWeight),
        weaningWeight: editDetailsData.weaningWeight ? Number(editDetailsData.weaningWeight) : 0,
        enteredBy: user?.name || 'System'
      });
      setIsEditDetailsOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handlePromote = async () => {
    try {
      if (selectedGrower.sex === 'Female') {
        const updatedGrower = await promoteToSow(id, user?.name || 'System');
        setIsPromoteOpen(false);
        navigate(`/sows/${updatedGrower.sowId}`);
      } else {
        const updatedGrower = await promoteToBoar(id, user?.name || 'System');
        setIsPromoteOpen(false);
        navigate(`/boars/${updatedGrower.boarId}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Processed Weight Timeline (Sorted and Filtered)
  const processedWeightLogs = useMemo(() => {
    if (!selectedGrower || !selectedGrower.weightLogs) return [];
    let list = [...selectedGrower.weightLogs];

    // 1. Filter
    if (typeFilter !== 'All') {
      list = list.filter(w => w.type === typeFilter);
    }

    // 2. Sort
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'date') {
        return sortOrder === 'asc' 
          ? new Date(valA) - new Date(valB)
          : new Date(valB) - new Date(valA);
      }
      
      if (sortField === 'weight') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      // Default string compare
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [selectedGrower, typeFilter, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Recharts chart data preparation
  const chartData = useMemo(() => {
    if (!selectedGrower || !selectedGrower.weightLogs) return [];
    return [...selectedGrower.weightLogs]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(w => ({
        date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: w.weight
      }));
  }, [selectedGrower]);

  const isFetching = loading || (!selectedGrower && !error) || (selectedGrower && selectedGrower._id !== id && !error);

  if (isFetching) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20 text-xs text-textSecondary gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <span className="uppercase tracking-widest font-semibold text-[10px]">Hydrating Grower card...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !selectedGrower) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto w-full py-12 text-center my-8 bg-cardBg border border-borderDark rounded-lg p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center text-danger mb-4">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-danger mb-2">Record Sync Error</h2>
          <p className="text-xs text-textSecondary max-w-sm mx-auto leading-relaxed mb-6">
            {error || "We could not find this animal record on your device storage."}
          </p>
          <button 
            onClick={() => navigate('/growers')}
            className="px-4 py-2 bg-sidebar text-xs text-textPrimary hover:bg-cardBg hover:text-primary rounded border border-borderDark transition-all uppercase tracking-wider font-bold"
          >
            Back to Registers
          </button>
        </div>
      </MainLayout>
    );
  }

  const isPromoted = selectedGrower.status === 'Promoted to Sow' || selectedGrower.status === 'Promoted to Boar';
  const isDead = selectedGrower.status === 'Dead';

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 w-full">
        
        {/* Detail Page Header Section (No-Print) */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/growers')}
              className="p-1.5 hover:bg-cardBg rounded text-textSecondary border border-borderDark/40"
              title="Return to grower list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black tracking-wide text-textPrimary uppercase flex items-center gap-2">
                Grower Card: <span className="text-primary font-black select-all">{selectedGrower.animalNo}</span>
              </h2>
              <p className="text-[9px] text-textSecondary uppercase tracking-widest mt-1">
                Breed: {selectedGrower.breed} • Age: {ageInDays} Days Old
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-sidebar hover:bg-cardBg text-textPrimary text-xs font-bold rounded border border-borderDark transition-all flex items-center gap-1.5 uppercase tracking-wider"
              title="Print register sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Card
            </button>
            
            {canEdit && !isPromoted && (
              <button
                onClick={() => setIsPromoteOpen(true)}
                disabled={isDead}
                className={`px-3.5 py-2 bg-success hover:bg-success-dark text-white text-xs font-bold rounded shadow-md hover:shadow-glow transition-all flex items-center gap-1.5 uppercase tracking-wider ${isDead ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={isDead ? "Animal deceased — lifecycle closed" : (selectedGrower.sex === 'Female' ? "Promote female to Sow breeder records" : "Promote male to Boar breeder records")}
              >
                <Award className="w-3.5 h-3.5 stroke-[2.5]" />
                {selectedGrower.sex === 'Female' ? 'Promote to Sow' : 'Promote to Boar'}
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleOpenEditDetails}
                disabled={isDead}
                className={`px-3.5 py-2 bg-primary hover:bg-primary-dark text-black text-xs font-bold rounded shadow-md hover:shadow-glow transition-all flex items-center gap-1.5 uppercase tracking-wider ${isDead ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={isDead ? "Animal deceased — lifecycle closed" : "Edit Details"}
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Details
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            PRINTABLE GROWER CARD (Hidden on screen, visible on print)
            ======================================================== */}
        <div className="hidden print:block text-black bg-white p-8 w-full font-serif leading-relaxed text-xs">
          <div className="border-4 border-black p-6 flex flex-col gap-6">
            <div className="text-center border-b-2 border-black pb-4">
              <h1 className="text-xl font-bold tracking-widest uppercase">PINAKA DIGITAL PIG REGISTER</h1>
              <p className="text-[10px] tracking-wider uppercase font-sans font-bold mt-1">Smart Pig Farm Digital Register Card</p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-b border-black pb-4 text-[11px]">
              <div><strong>Animal No:</strong> <span className="underline font-sans font-bold text-sm">{selectedGrower.animalNo}</span></div>
              <div><strong>Breed:</strong> <span className="underline">{selectedGrower.breed}</span></div>
              <div><strong>Sex / Gender:</strong> <span className="underline">{selectedGrower.sex}</span></div>
              <div><strong>DOB:</strong> <span className="underline">{new Date(selectedGrower.dob).toLocaleDateString()}</span></div>
              <div><strong>Sire No:</strong> <span className="underline">{selectedGrower.sireNo}</span></div>
              <div><strong>Dam No:</strong> <span className="underline">{selectedGrower.damNo}</span></div>
              <div><strong>Birth Weight:</strong> <span className="underline font-sans font-bold">{selectedGrower.birthWeight} kg</span></div>
              <div><strong>Weaning Weight:</strong> <span className="underline">{selectedGrower.weaningWeight || 'N/A'} kg</span></div>
              <div><strong>Pen Location:</strong> <span className="underline font-sans font-bold">{selectedGrower.penNo}</span></div>
            </div>

            <div>
              <h3 className="font-bold text-[11px] uppercase border-b-2 border-black mb-2 font-sans">1. Weight Timeline</h3>
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="py-1">Date</th>
                    <th className="py-1">Weight Type</th>
                    <th className="py-1">Weight Value</th>
                    <th className="py-1">Age (Days)</th>
                    <th className="py-1">Entered By</th>
                    <th className="py-1">Remarks/Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...selectedGrower.weightLogs]
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((w, idx) => {
                      const ageDays = Math.ceil((new Date(w.date) - new Date(selectedGrower.dob)) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="py-1">{new Date(w.date).toLocaleDateString()}</td>
                          <td className="py-1">{w.type}</td>
                          <td className="py-1 font-bold">{w.weight} kg</td>
                          <td className="py-1">{ageDays} Days</td>
                          <td className="py-1">{w.enteredBy || 'System'}</td>
                          <td className="py-1 text-gray-700 italic">{w.notes || '-'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-bold text-[11px] uppercase border-b-2 border-black mb-2 font-sans">2. Operational Status Transitions</h3>
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="py-1">Change Date</th>
                    <th className="py-1">Previous Status</th>
                    <th className="py-1">New Status</th>
                    <th className="py-1">Updated By</th>
                    <th className="py-1">Remarks/Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedGrower.statusHistory || []).map((s, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="py-1">{new Date(s.changeDate || s.updatedAt).toLocaleDateString()}</td>
                      <td className="py-1 font-bold">{s.previousStatus || 'N/A'}</td>
                      <td className="py-1 font-bold">{s.newStatus || s.status}</td>
                      <td className="py-1">{s.updatedBy}</td>
                      <td className="py-1 text-gray-700 italic">{s.notes || s.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedGrower.promotionHistory && selectedGrower.promotionHistory.length > 0 && (
              <div>
                <h3 className="font-bold text-[11px] uppercase border-b-2 border-black mb-2 font-sans">3. Breeder Promotion Records</h3>
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-black font-bold">
                      <th className="py-1">Promoted Date</th>
                      <th className="py-1">Type</th>
                      <th className="py-1">Destination</th>
                      <th className="py-1">Promoted By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGrower.promotionHistory.map((p, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="py-1">{new Date(p.promotedAt).toLocaleDateString()}</td>
                        <td className="py-1 font-bold">{p.type}</td>
                        <td className="py-1 font-bold">{p.destinationModule}</td>
                        <td className="py-1">{p.promotedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedGrower.notes && (
              <div className="border-t border-black pt-4">
                <strong>General Management Notes:</strong>
                <p className="mt-1 italic text-gray-700">{selectedGrower.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            SCREEN LAYOUT (Hidden on print)
            ======================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 w-full print:hidden">
          
          {/* LEFT 2 COLUMNS: Visual Growth Analytics, Logs */}
          <div className="xl:col-span-2 flex flex-col gap-5">
            
            {/* 3. Section: Growth Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Birth Weight</p>
                  <h3 className="text-xl font-black text-textPrimary mt-1">{selectedGrower.birthWeight} <span className="text-xs font-medium">kg</span></h3>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Scale className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Latest Weight</p>
                  <h3 className="text-xl font-black text-success mt-1">{selectedGrower.latestWeight} <span className="text-xs font-medium">kg</span></h3>
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Average Daily Gain</p>
                  <h3 className="text-xl font-black text-blueAccent mt-1">{selectedGrower.adg} <span className="text-xs font-medium">kg/day</span></h3>
                </div>
                <div className="w-9 h-9 rounded-full bg-blueAccent/10 flex items-center justify-center text-blueAccent">
                  <Activity className="w-4.5 h-4.5" />
                </div>
              </div>
            </div>

            {/* Recharts chart curve */}
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between mb-4 border-b border-borderDark/50 pb-2">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 3: Growth Analytics Chart (kg)</span>
                <span className="text-[9px] text-textSecondary uppercase">Active lifecycle weight curves</span>
              </div>
              <div className="w-full h-64">
                {chartData.length <= 1 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-textSecondary text-[11px] gap-1">
                    <AlertCircle className="w-5 h-5 text-textSecondary/50" />
                    <span>Log weekly weights to calculate visual gain trends</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLine data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                      <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={9} tickLine={false} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                        labelStyle={{ color: 'var(--color-text-primary)', fontSize: '9px', fontWeight: 'bold' }}
                        itemStyle={{ color: 'var(--color-primary)', fontSize: '10px' }}
                      />
                      <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="var(--color-primary)" strokeWidth={3} dot={{ fill: 'var(--color-primary)', strokeWidth: 1 }} activeDot={{ r: 6 }} />
                    </RechartsLine>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 2. Section: Weight Timeline */}
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-borderDark/50 pb-3">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 2: Weight Timeline Log</span>
                
                <div className="flex items-center gap-2">
                  {/* Category Filter */}
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="dense-select text-[10px] w-28"
                  >
                    <option value="All">All Types</option>
                    <option value="Birth">Birth</option>
                    <option value="Weaning">Weaning</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Manual Check">Manual Check</option>
                  </select>

                  {canEdit && !isPromoted && (
                    <button
                      onClick={handleOpenAddWeight}
                      disabled={isDead}
                      className={`px-2.5 py-1 bg-secondary text-textPrimary text-[10px] font-bold rounded hover:bg-primary hover:text-black transition-colors flex items-center gap-1 uppercase tracking-wider ${isDead ? 'opacity-40 cursor-not-allowed' : ''}`}
                      title={isDead ? "Animal deceased — lifecycle closed" : "Update Weight"}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      Update Weight
                    </button>
                  )}
                </div>
              </div>

              <div className="dense-table-container">
                <table className="dense-table">
                  <thead>
                    <tr className="select-none">
                      <th className="py-2 px-3 cursor-pointer hover:text-primary" onClick={() => toggleSort('date')}>
                        <div className="flex items-center gap-1">
                          Weighing Date
                          {sortField === 'date' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th className="py-2 px-3 cursor-pointer hover:text-primary" onClick={() => toggleSort('type')}>
                        <div className="flex items-center gap-1">
                          Type
                          {sortField === 'type' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th className="py-2 px-3 cursor-pointer hover:text-primary" onClick={() => toggleSort('weight')}>
                        <div className="flex items-center gap-1">
                          Weight Value
                          {sortField === 'weight' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th className="py-2 px-3">Age (Days)</th>
                      <th className="py-2 px-3">Entered By</th>
                      <th className="py-2 px-3">Notes</th>
                      {canEdit && <th className="py-2 px-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {processedWeightLogs.length === 0 ? (
                      <tr>
                        <td colSpan={canEdit ? 7 : 6} className="py-4 text-center text-textSecondary italic">
                          No weight logs matching filter.
                        </td>
                      </tr>
                    ) : (
                      processedWeightLogs.map((w, idx) => {
                        const ageDays = Math.ceil((new Date(w.date) - new Date(selectedGrower.dob)) / (1000 * 60 * 60 * 24));
                        return (
                          <tr key={w._id}>
                            <td className="py-2 px-3 text-textPrimary font-mono">{new Date(w.date).toLocaleDateString()}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                w.type === 'Birth' ? 'bg-primary/10 text-primary border border-primary/20' :
                                w.type === 'Weaning' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                                w.type === 'Weekly' ? 'bg-blueAccent/10 text-blueAccent border border-blueAccent/20' :
                                'bg-border/40 text-textSecondary border border-border-strong'
                              }`}>{w.type}</span>
                            </td>
                            <td className="py-2 px-3 text-textPrimary font-extrabold font-mono">{w.weight} kg</td>
                            <td className="py-2 px-3 text-textSecondary font-mono">{ageDays} Days</td>
                            <td className="py-2 px-3 text-textSecondary font-semibold">{w.enteredBy || 'System'}</td>
                            <td className="py-2 px-3 text-textSecondary italic max-w-xs truncate" title={w.notes}>{w.notes || '-'}</td>
                            {canEdit && (
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditWeight(w)}
                                    disabled={isDead}
                                    className={`p-1 text-textSecondary hover:text-yellow-500 hover:bg-cardHover rounded ${isDead ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    title={isDead ? "Animal deceased — lifecycle closed" : "Edit weight entry"}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  {w.type !== 'Birth' && (
                                    <button
                                      onClick={() => handleDeleteWeight(w._id)}
                                      disabled={isDead}
                                      className={`p-1 text-textSecondary hover:text-danger hover:bg-cardHover rounded ${isDead ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      title={isDead ? "Animal deceased — lifecycle closed" : "Delete weight entry"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: Animal Overview Details, Status History, Promotion History, Notes */}
          <div className="flex flex-col gap-5">
            
            {/* 1. Section: Animal Overview */}
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between mb-3.5 border-b border-borderDark/50 pb-2">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 1: Animal Overview</span>
                <span className="text-[9px] uppercase tracking-wider text-textSecondary">Identity Index</span>
              </div>
              <div className="flex flex-col gap-2.5 text-[11px]">
                <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                  <span className="text-textSecondary font-medium">Animal ID Tag</span>
                  <span className="font-extrabold text-primary font-mono">{selectedGrower.animalNo}</span>
                </div>
                {(selectedGrower.originalPigletId || selectedGrower.originPigletId) && (
                  <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                    <span className="text-textSecondary font-medium">Origin Piglet ID</span>
                    <span className="font-bold text-warning font-mono">{selectedGrower.originalPigletId || selectedGrower.originPigletId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                  <span className="text-textSecondary font-medium">Breed Type</span>
                  <span className="font-bold text-textPrimary">{selectedGrower.breed}</span>
                </div>
                <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                  <span className="text-textSecondary font-medium">Sex / Gender</span>
                  <StatusBadge status={selectedGrower.sex} />
                </div>
                <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                  <span className="text-textSecondary font-medium">DOB / Age</span>
                  <span className="font-bold text-textPrimary">{new Date(selectedGrower.dob).toLocaleDateString()} ({ageInDays} Days)</span>
                </div>
                <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                  <span className="text-textSecondary font-medium">Pen Unit</span>
                  <span className="font-bold text-textPrimary bg-sidebar border border-borderDark px-2 py-0.5 rounded font-mono">{selectedGrower.penNo}</span>
                </div>
                <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                  <span className="text-textSecondary font-medium">Current Status</span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={selectedGrower.status} />
                    {isDead && (
                      <Skull className="w-3.5 h-3.5 text-danger shrink-0 animate-pulse" title="Animal deceased — lifecycle closed" />
                    )}
                    {canEdit && !isDead && (
                      <button 
                        onClick={handleOpenStatus}
                        className="text-[9px] text-primary hover:underline font-bold uppercase"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                  <span className="text-textSecondary font-medium">Sire Tag (Father)</span>
                  <span className="font-semibold text-textPrimary font-mono">{selectedGrower.sireNo}</span>
                </div>
                <div className="flex items-center justify-between border-b border-borderDark/20 pb-1.5">
                  <span className="text-textSecondary font-medium">Dam Tag (Mother)</span>
                  <span className="font-semibold text-textPrimary font-mono">{selectedGrower.damNo}</span>
                </div>
                {selectedGrower.slaughterDate && (
                  <div className="flex items-center justify-between text-warning">
                    <span>Slaughter Scheduled</span>
                    <span className="font-bold font-mono">{new Date(selectedGrower.slaughterDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Section: Status History */}
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between mb-3.5 border-b border-borderDark/50 pb-2">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 4: Status History Log</span>
                <Clock className="w-3.5 h-3.5 text-textSecondary" />
              </div>
              <div className="flex flex-col gap-3 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {selectedGrower.statusHistory && selectedGrower.statusHistory.length > 0 ? (
                  selectedGrower.statusHistory.map((s, idx) => (
                    <div key={s._id || idx} className="flex gap-2.5 text-[11px] border-l-2 border-borderDark pl-3.5 relative pb-1">
                      <div className="absolute w-2 h-2 rounded-full bg-primary -left-[5px] top-1"></div>
                      <div className="flex-1">
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-textPrimary uppercase tracking-wider text-[9px]">
                              {s.previousStatus || 'N/A'} &rarr; {s.newStatus || s.status}
                            </span>
                            <span className="text-[9px] text-textSecondary font-mono">{new Date(s.changeDate || s.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[9px] text-textSecondary">Logged by: {s.updatedBy || 'System'}</span>
                        </div>
                        <p className="text-textSecondary text-[10px] mt-0.5 leading-normal italic">{s.notes || s.remarks || 'No remarks recorded.'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-textSecondary italic text-[11px]">No status logs exist.</span>
                )}
              </div>
            </div>

            {/* 5. Section: Promotion History */}
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between mb-3 border-b border-borderDark/50 pb-2">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 5: Promotion History</span>
                <Award className="w-3.5 h-3.5 text-textSecondary" />
              </div>
              {selectedGrower.promotionHistory && selectedGrower.promotionHistory.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                  {selectedGrower.promotionHistory.map((p, idx) => (
                    <div key={p._id || idx} className="bg-sidebar/55 border border-borderDark/60 rounded p-2.5 text-[11px] flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-success uppercase text-[9px]">Promoted to {p.type}</span>
                        <span className="text-[9px] text-textSecondary font-mono">{new Date(p.promotedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-[10px] text-textSecondary mt-1">
                        <span><strong>Destination:</strong> {p.destinationModule} Register</span>
                        <span><strong>Approved By:</strong> {p.promotedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-sidebar/30 border border-borderDark/45 rounded text-textSecondary text-[11px] italic">
                  Not currently promoted into Sow or Boar databases.
                </div>
              )}
            </div>

            {/* 6. Section: Notes */}
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between mb-2.5 border-b border-borderDark/50 pb-2">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 6: Notes Ledger</span>
                <FileText className="w-3.5 h-3.5 text-textSecondary" />
              </div>
              <p className="text-[11px] text-textSecondary leading-relaxed italic bg-surface/40 p-3 border border-borderDark/50 rounded">
                {selectedGrower.notes || "No management notes have been posted on this animal's register."}
              </p>
            </div>

          </div>

        </div>

        {/* ========================================================
            MODAL 1: ADD NEW WEIGHT ENTRY
            ======================================================== */}
        <Modal
          isOpen={isWeightOpen}
          onClose={() => setIsWeightOpen(false)}
          title={`Log Weekly/Monthly Weight`}
          footer={
            <>
              <button 
                onClick={() => setIsWeightOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddWeight}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Log weight
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
            
            <FormSection title="Weight Registry Entry">
              <FormGrid cols={3}>
                <FormField label="Weighing Date" required>
                  <input
                    type="date"
                    value={weightData.date}
                    onChange={(e) => setWeightData({ ...weightData, date: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Weight Stage" required>
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
              <FormField label="Operational Remarks / Comments">
                <input
                  type="text"
                  placeholder="e.g. Normal feed acceptance, robust activity"
                  value={weightData.notes}
                  onChange={(e) => setWeightData({ ...weightData, notes: e.target.value })}
                  className="dense-input"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ========================================================
            MODAL 2: EDIT EXISTING WEIGHT ENTRY
            ======================================================== */}
        <Modal
          isOpen={isEditWeightOpen}
          onClose={() => setIsEditWeightOpen(false)}
          title={`Edit weight record entry`}
          footer={
            <>
              <button 
                onClick={() => setIsEditWeightOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditWeight}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Update Entry
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
            
            <FormSection title="Weight Registry Entry">
              <FormGrid cols={3}>
                <FormField label="Weighing Date" required>
                  <input
                    type="date"
                    value={weightData.date}
                    onChange={(e) => setWeightData({ ...weightData, date: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Weight Stage" required>
                  <select
                    value={weightData.type}
                    onChange={(e) => setWeightData({ ...weightData, type: e.target.value })}
                    disabled={selectedWeightLog?.type === 'Birth'}
                    className="dense-select"
                  >
                    <option value="Birth">Birth</option>
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
                    value={weightData.weight}
                    onChange={(e) => setWeightData({ ...weightData, weight: e.target.value })}
                    className="dense-input"
                    autoFocus
                  />
                </FormField>
              </FormGrid>
              <FormField label="Remarks / Comments">
                <input
                  type="text"
                  value={weightData.notes}
                  onChange={(e) => setWeightData({ ...weightData, notes: e.target.value })}
                  className="dense-input"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ========================================================
            MODAL 3: TRANSITION STATUS HISTORY
            ======================================================== */}
        <Modal
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
          title={`Transition status for ${selectedGrower.animalNo}`}
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
                    value={selectedGrower.status}
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
                    <option value="Sold">Sold</option>
                    <option value="Slaughtered">Slaughtered</option>
                    <option value="Dead">Dead</option>
                  </select>
                </FormField>
              </FormGrid>
              <FormField label="Operational remarks / Transition reason" required>
                <input
                  type="text"
                  placeholder="e.g. Promoted due to strong feed intake and genetics rating"
                  value={statusData.remarks}
                  onChange={(e) => setStatusData({ ...statusData, remarks: e.target.value })}
                  className="dense-input"
                  required
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ========================================================
            MODAL 4: EDIT DETAIL PARAMETERS
            ======================================================== */}
        <Modal
          isOpen={isEditDetailsOpen}
          onClose={() => setIsEditDetailsOpen(false)}
          title={`Edit core details for ${selectedGrower.animalNo}`}
          footer={
            <>
              <button 
                onClick={() => setIsEditDetailsOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditDetails}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Save Changes
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
                <FormField label="Breed" required>
                  <input
                    type="text"
                    value={editDetailsData.breed}
                    onChange={(e) => setEditDetailsData({ ...editDetailsData, breed: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Sex / Gender" required>
                  <select
                    value={editDetailsData.sex}
                    onChange={(e) => setEditDetailsData({ ...editDetailsData, sex: e.target.value })}
                    className="dense-select"
                    disabled={isPromoted}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </FormField>
              </FormGrid>
              <FormGrid cols={2}>
                <FormField label="Sire ID (Father)">
                  <input
                    type="text"
                    value={editDetailsData.sireNo}
                    onChange={(e) => setEditDetailsData({ ...editDetailsData, sireNo: e.target.value.toUpperCase() })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Dam ID (Mother)">
                  <input
                    type="text"
                    value={editDetailsData.damNo}
                    onChange={(e) => setEditDetailsData({ ...editDetailsData, damNo: e.target.value.toUpperCase() })}
                    className="dense-input"
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Weights Assignments">
              <FormGrid cols={2}>
                <FormField label="Birth Weight (kg)" required>
                  <input
                    type="number"
                    step="0.01"
                    value={editDetailsData.birthWeight}
                    onChange={(e) => setEditDetailsData({ ...editDetailsData, birthWeight: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
                <FormField label="Weaning Weight (kg)">
                  <input
                    type="number"
                    step="0.01"
                    value={editDetailsData.weaningWeight}
                    onChange={(e) => setEditDetailsData({ ...editDetailsData, weaningWeight: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Assignments & remarks">
              <FormGrid cols={2}>
                <FormField label="Pen location No" required>
                  <input
                    type="text"
                    value={editDetailsData.penNo}
                    onChange={(e) => setEditDetailsData({ ...editDetailsData, penNo: e.target.value })}
                    className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormField label="General Comments notes">
                <textarea
                  rows={2}
                  value={editDetailsData.notes}
                  onChange={(e) => setEditDetailsData({ ...editDetailsData, notes: e.target.value })}
                  className="dense-input w-full p-2"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ========================================================
            MODAL 5: BREEDER PROMOTION CONFIRMATION
            ======================================================== */}
        <Modal
          isOpen={isPromoteOpen}
          onClose={() => setIsPromoteOpen(false)}
          title={`Breeder Promotion: ${selectedGrower.animalNo}`}
          footer={
            <>
              <button 
                onClick={() => setIsPromoteOpen(false)}
                className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold"
              >
                Cancel Promotion
              </button>
              <button 
                onClick={handlePromote}
                className="px-4 py-2 bg-success text-white text-xs rounded uppercase font-bold shadow-md hover:bg-success/90"
              >
                Confirm Promotion
              </button>
            </>
          }
        >
          <div className="text-xs text-textSecondary p-1 leading-relaxed">
            <p className="font-bold text-textPrimary mb-3 text-sm">
              {selectedGrower.sex === 'Female' 
                ? `Move grower ${selectedGrower.animalNo} into Sow breeding records?` 
                : `Move grower ${selectedGrower.animalNo} into Boar breeding records?`
              }
            </p>
            <p className="mb-2">
              This operational lifecycle transition will automatically:
            </p>
            <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
              <li>Create a new <strong>{selectedGrower.sex === 'Female' ? 'Sow' : 'Boar'} breeder profile</strong> card.</li>
              <li>Sync lineage (Sire/Dam), DOB, breed, pen number, and weights.</li>
              <li>Set grower status to <span className="font-bold text-textPrimary">Promoted to {selectedGrower.sex === 'Female' ? 'Sow' : 'Boar'}</span>.</li>
              <li>Register an audited transaction log in the status and promotion history ledgers.</li>
            </ul>
            <p className="font-semibold text-warning">
              Warning: Once promoted, the sex assignment and identity details will be locked in the grower registries.
            </p>
          </div>
        </Modal>

        {/* ==============================================
            MODAL 6: RECORD MORTALITY CONFIRMATION
            ============================================== */}
        <Modal
          isOpen={isMortalityOpen}
          onClose={() => setIsMortalityOpen(false)}
          title={`Record Mortality — Grower ${selectedGrower.animalNo}`}
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
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed font-mono font-bold text-primary" value={selectedGrower.animalNo || ''} readOnly />
                </FormField>
                <FormField label="Breed">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed" value={selectedGrower.breed || ''} readOnly />
                </FormField>
              </FormGrid>
              <FormGrid cols={3}>
                <FormField label="Sex">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed" value={selectedGrower.sex || ''} readOnly />
                </FormField>
                <FormField label="Lifecycle Stage">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed" value="Grower" readOnly />
                </FormField>
                <FormField label="Current Pen / Location">
                  <input type="text" className="dense-input bg-cardBg opacity-60 cursor-not-allowed font-mono text-[10.5px]" value={selectedGrower.penNo || ''} readOnly />
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
                  <input
                    type="date"
                    value={mortalityForm.deathDate}
                    onChange={(e) => setMortalityForm({ ...mortalityForm, deathDate: e.target.value })}
                    className="dense-input"
                    required
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
