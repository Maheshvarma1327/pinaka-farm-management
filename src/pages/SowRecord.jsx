import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useSowStore } from '../store/useSowStore';
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
  Flame, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  Activity, 
  Heart,
  Trash2
} from 'lucide-react';

export default function SowRecord() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    sows, 
    loading, 
    error, 
    heatAlerts,
    fetchSows, 
    createSow, 
    importSowFromGrower,
    updateSowStatusDirect,
    deleteSow
  } = useSowStore();

  // 1. Modals & Dialog triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedSow, setSelectedSow] = useState(null);

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
    parityCount: '0',
    status: 'Active',
    pregnancyStatus: 'Not Pregnant',
    lastHeatDate: '',
    notes: ''
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
    fetchSows();
  }, [fetchSows]);

  // Load female growers for import on modal open
  const loadFemaleGrowers = () => {
    try {
      const stored = localStorage.getItem('pinaka_growers');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only active/available female growers that haven't been promoted
        const females = parsed.filter(g => 
          g.sex === 'Female' && 
          g.status !== 'Promoted to Sow' && 
          g.status !== 'Promoted to Boar' &&
          !g.isDeleted
        );
        setGrowersList(females);
        return females;
      }
    } catch (e) {
      console.error("Failed to load growers list:", e);
    }
    return [];
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Sow record card? This will perform a soft-delete (archive) from the breeding registry.")) {
      try {
        await deleteSow(id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Farm Worker';

  // 8 Reproductive Lifecycle KPI Cards
  const kpis = useMemo(() => {
    const activeSows = sows.filter(s => s.status !== 'Dead' && s.status !== 'Culled' && s.status !== 'Sold');
    const total = activeSows.length;
    const pregnant = activeSows.filter(s => s.status === 'Pregnant' || s.pregnancyStatus === 'Pregnant').length;
    const lactating = activeSows.filter(s => s.status === 'Lactating').length;
    const inHeat = activeSows.filter(s => s.status === 'In Heat').length;
    
    // Average parity count
    const totalParity = activeSows.reduce((acc, s) => acc + (s.parityCount || 0), 0);
    const avgParity = total > 0 ? (totalParity / total).toFixed(1) : '0.0';

    // Alerts counting
    const upcoming = heatAlerts.filter(a => a.type === 'Upcoming Heat').length;
    const overdue = heatAlerts.filter(a => a.type === 'Overdue Heat').length;
    const underTreatment = activeSows.filter(s => s.status === 'Under Treatment').length;

    return { total, pregnant, lactating, inHeat, avgParity, upcoming, overdue, underTreatment };
  }, [sows, heatAlerts]);

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
      parityCount: '0',
      status: 'Active',
      pregnancyStatus: 'Not Pregnant',
      lastHeatDate: '',
      notes: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenImport = () => {
    setFormError('');
    const list = loadFemaleGrowers();
    setImportData({
      growerId: list.length > 0 ? list[0]._id : '',
      notes: 'Promoted and imported from Grower module records due to breeding maturity.'
    });
    setIsImportOpen(true);
  };

  const handleOpenStatus = (sow) => {
    setFormError('');
    setSelectedSow(sow);
    setStatusData({
      status: sow.status,
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
      await createSow({
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
      setFormError('Please select a female grower to promote.');
      return;
    }

    try {
      await importSowFromGrower(
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
      await updateSowStatusDirect(
        selectedSow._id,
        statusData.status,
        statusData.remarks,
        user?.name || 'System'
      );
      setIsStatusOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Spreadsheet Columns
  const columns = [
    { 
      header: "Sow No", 
      accessor: "animalNo", 
      sortable: true,
      render: (val, row) => (
        <span 
          className="font-extrabold text-primary select-all cursor-pointer hover:underline" 
          onClick={() => navigate(`/sows/${row._id}`)}
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
      header: "Parity", 
      accessor: "parityCount", 
      sortable: true,
      render: (val) => <span className="font-mono font-bold">{val || 0} farrows</span>
    },
    { 
      header: "Gestation Status", 
      accessor: "pregnancyStatus", 
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    },
    { 
      header: "Expected Farrowing", 
      accessor: "expectedFarrowingDate", 
      sortable: true,
      render: (val) => val ? (
        <span className="font-mono font-semibold text-success">{new Date(val).toLocaleDateString()}</span>
      ) : <span className="text-textSecondary/40">-</span>
    },
    { 
      header: "Operational Status", 
      accessor: "status", 
      sortable: true,
      render: (val) => <StatusBadge status={val} /> 
    },
    { 
      header: "Cycle / Days Tracker", 
      accessor: "status", 
      sortable: false,
      render: (val, row) => {
        const now = new Date();
        
        // Helper to get fallback date from statusHistory
        const getFallbackDate = (targetStatus) => {
          const matchedHistory = row.statusHistory?.filter(h => h.newStatus === targetStatus)?.pop();
          return matchedHistory ? new Date(matchedHistory.updatedAt) : new Date(row.createdAt || Date.now());
        };
        
        // 1. Pregnant sow
        if (row.pregnancyStatus === 'Pregnant' || val === 'Pregnant') {
          const serviceDate = row.lastServiceDate ? new Date(row.lastServiceDate) : getFallbackDate('Pregnant');
          const diffTime = Math.abs(now - serviceDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return (
            <div className="flex flex-col">
              <span className="font-bold text-warning">Gestation: {diffDays}d</span>
              <span className="text-[10px] text-textSecondary">Mated: {serviceDate.toLocaleDateString()}</span>
            </div>
          );
        }

        // 2. Pregnancy Pending Confirmation
        if (val === 'Pregnancy Pending' || row.pregnancyStatus === 'Pending Confirmation') {
          const serviceDate = row.lastServiceDate ? new Date(row.lastServiceDate) : getFallbackDate('Pregnancy Pending');
          const diffTime = Math.abs(now - serviceDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-info">Mated: {diffDays}d ago</span>
              <span className="text-[10px] text-textSecondary">Scan pending</span>
            </div>
          );
        }

        // 3. In Heat
        if (val === 'In Heat') {
          const heatDate = row.lastHeatDate ? new Date(row.lastHeatDate) : getFallbackDate('In Heat');
          const diffTime = Math.abs(now - heatDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return (
            <div className="flex flex-col">
              <span className="font-extrabold text-primary animate-pulse">Heat Day: {diffDays}</span>
              <span className="text-[10px] text-textSecondary">Started: {heatDate.toLocaleDateString()}</span>
            </div>
          );
        }

        // 4. Lactating (Farrowed)
        if (val === 'Lactating') {
          const lacDate = (row.farrowingHistory && row.farrowingHistory.length > 0)
            ? new Date(row.farrowingHistory[row.farrowingHistory.length - 1].farrowingDate)
            : getFallbackDate('Lactating');
          const diffTime = Math.abs(now - lacDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return (
            <div className="flex flex-col">
              <span className="font-bold text-success">Lactating: {diffDays}d</span>
              <span className="text-[10px] text-textSecondary">Wean due: {Math.max(0, 60 - diffDays)}d</span>
            </div>
          );
        }

        // 5. Dead / Culled / Sold
        if (val === 'Dead' || val === 'Culled' || val === 'Sold') {
          const eventDate = getFallbackDate(val);
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-danger">{val} Event</span>
              <span className="text-[10px] text-textSecondary">Date: {eventDate.toLocaleDateString()}</span>
            </div>
          );
        }

        // 6. Active / Normal - Next Heat cycle monitoring
        const heatDate = row.lastHeatDate ? new Date(row.lastHeatDate) : (row.statusHistory?.filter(h => h.newStatus === 'In Heat')?.pop() ? getFallbackDate('In Heat') : null);
        if (heatDate) {
          const nextHeat = new Date(heatDate.getTime() + (21 * 24 * 60 * 60 * 1000));
          const diffTime = nextHeat - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0) {
            return (
              <div className="flex flex-col">
                <span className="font-medium text-textPrimary">Next Heat: in {diffDays}d</span>
                <span className="text-[10px] text-textSecondary">Due: {nextHeat.toLocaleDateString()}</span>
              </div>
            );
          } else if (diffDays === 0) {
            return (
              <div className="flex flex-col">
                <span className="font-extrabold text-primary animate-pulse">Heat Due Today!</span>
                <span className="text-[10px] text-textSecondary">Due: {nextHeat.toLocaleDateString()}</span>
              </div>
            );
          } else {
            return (
              <div className="flex flex-col">
                <span className="font-bold text-danger">Heat Overdue: {Math.abs(diffDays)}d</span>
                <span className="text-[10px] text-textSecondary">Was due: {nextHeat.toLocaleDateString()}</span>
              </div>
            );
          }
        }

        return <span className="text-textSecondary/40">No cycle logs</span>;
      }
    },
    {
      header: "Actions",
      accessor: "_id",
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 no-print">
          <button 
            onClick={() => navigate(`/sows/${row._id}`)}
            className="p-1 hover:bg-cardBg hover:text-primary rounded text-textSecondary"
            title="View full reproductive history card"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <>
              <button 
                onClick={() => handleOpenStatus(row)}
                className="p-1 hover:bg-cardBg hover:text-success rounded text-textSecondary"
                title="Transition operational status"
              >
                <ClipboardList className="w-3.5 h-3.5" />
              </button>
            </>
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
      <div className="flex flex-col gap-5 w-full">
        
        {/* Module Header Panel */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 no-print">
          <div>
            <h2 className="text-base font-black tracking-wide text-textPrimary uppercase">
              SOW REPRODUCTIVE REGISTRY
            </h2>
            <p className="text-[10px] text-textSecondary uppercase tracking-widest mt-1">
              Breeding sow profiles, reproductive lifecycle monitoring, gestation and heat alerts
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenImport}
                className="px-3 py-2 bg-secondary hover:bg-cardBg text-textPrimary text-xs font-bold rounded border border-borderDark transition-all flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Award className="w-3.5 h-3.5 stroke-[2]" />
                Import Female Grower
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-black text-xs font-bold rounded shadow-md hover:shadow-glow transition-all duration-150 flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Register Sow
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Interactive Heat Alerts Center */}
        {heatAlerts.length > 0 && (
          <div className="bg-cardBg border border-borderDark rounded-lg p-4 no-print shadow-md">
            <div className="flex items-center gap-2 border-b border-borderDark/50 pb-2 mb-3">
              <Flame className="w-4.5 h-4.5 text-primary animate-pulse" />
              <span className="text-xs font-extrabold uppercase text-textPrimary tracking-widest">
                Active Heat & Cycle Warnings Center ({heatAlerts.length})
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {heatAlerts.map((alert) => {
                const isCritical = alert.priority === 'Critical';
                const isHigh = alert.priority === 'High';
                
                let borderClass = 'border-borderDark';
                let iconColor = 'text-textSecondary';
                let bgClass = 'bg-[#0f151f]';

                if (isCritical) {
                  borderClass = 'border-danger/60 shadow-[0_0_8px_rgba(239,83,80,0.15)]';
                  iconColor = 'text-danger animate-bounce';
                  bgClass = 'bg-danger/5';
                } else if (isHigh) {
                  borderClass = 'border-primary/60 shadow-[0_0_8px_rgba(255,107,0,0.15)]';
                  iconColor = 'text-primary';
                  bgClass = 'bg-primary/5';
                }

                return (
                  <div 
                    key={alert.id} 
                    className={`flex items-start gap-2.5 p-3 rounded-lg border ${borderClass} ${bgClass} text-xs transition-all duration-150`}
                  >
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[11px] text-textPrimary uppercase tracking-wider">{alert.type} - {alert.animalNo}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          isCritical ? 'bg-danger/20 text-danger' : 
                          isHigh ? 'bg-primary/20 text-primary' : 'bg-blueAccent/20 text-blueAccent'
                        }`}>
                          {alert.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-textSecondary mt-1 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 8 Reproductive Lifecycle KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 no-print">
          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Total Sows</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-primary">{kpis.total}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Active</span>
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Pregnant</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-warning">{kpis.pregnant}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Ultrasound</span>
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Lactating</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-success">{kpis.lactating}</h3>
              <span className="text-[9px] text-textSecondary uppercase">In Pen</span>
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Standing Heat</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-primary animate-pulse">{kpis.inHeat}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Ready</span>
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Avg Parity</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-blueAccent">{kpis.avgParity}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Farrows</span>
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Upcoming Heats</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-info">{kpis.upcoming}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Warnings</span>
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Overdue Heats</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-danger">{kpis.overdue}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Alerts</span>
            </div>
          </div>

          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Under Vet Care</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-danger">{kpis.underTreatment}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Sows</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-danger/10 border border-danger/25 text-danger p-3.5 rounded-lg text-xs font-semibold no-print">
            [Sow Registry Sync Failure]: {error}
          </div>
        )}

        {/* Database List Table */}
        {loading ? (
          <TableSkeleton rows={7} cols={9} />
        ) : (
          <DataTable 
            columns={columns} 
            data={sows} 
            searchPlaceholder="Search by Sow No, Breed, Pen..."
          />
        )}

        {/* ==============================================
            MODAL 1: REGISTER NEW SOW (MANUAL)
            ============================================== */}
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Manual Sow Registration"
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
                Save Sow Record
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
                <FormField label="Sow Animal No / Tag ID" required>
                  <input
                     type="text"
                     placeholder="e.g. S-103"
                     value={formData.animalNo}
                     onChange={(e) => setFormData({ ...formData, animalNo: e.target.value })}
                     className="dense-input"
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
                  <input
                     type="date"
                     value={formData.dob}
                     onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Gender / Sex (Locked)" required>
                  <input
                     type="text"
                     value="Female (Breeding Sow)"
                     disabled
                     className="dense-input opacity-50 cursor-not-allowed font-bold"
                  />
                </FormField>
              </FormGrid>
            </FormSection>
            
            <FormSection title="Breeding Background & Pen">
              <FormGrid cols={3}>
                <FormField label="Sire ID (Father)">
                  <input
                     type="text"
                     value={formData.sireNo}
                     onChange={(e) => setFormData({ ...formData, sireNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Dam ID (Mother)">
                  <input
                     type="text"
                     value={formData.damNo}
                     onChange={(e) => setFormData({ ...formData, damNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Pen location No" required>
                  <input
                     type="text"
                     placeholder="e.g. Breeding Unit 3"
                     value={formData.penNo}
                     onChange={(e) => setFormData({ ...formData, penNo: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormGrid cols={3}>
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
                     step="0.1"
                     placeholder="150"
                     value={formData.currentWeight}
                     onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
                <FormField label="Initial Parity Count">
                  <input
                     type="number"
                     min="0"
                     placeholder="0"
                     value={formData.parityCount}
                     onChange={(e) => setFormData({ ...formData, parityCount: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Reproductive State">
              <FormGrid cols={3}>
                <FormField label="Operational Status">
                  <select
                     value={formData.status}
                     onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                     className="dense-select"
                  >
                    <option value="Active">Active (Open)</option>
                    <option value="In Heat">Heat</option>
                    <option value="Pregnancy Pending">Mating</option>
                    <option value="Pregnant">Pregnancy</option>
                    <option value="Lactating">Lactating</option>
                    <option value="Under Treatment">Under Treatment</option>
                  </select>
                </FormField>
                <FormField label="Pregnancy Status">
                  <select
                     value={formData.pregnancyStatus}
                     onChange={(e) => setFormData({ ...formData, pregnancyStatus: e.target.value })}
                     className="dense-select"
                  >
                    <option value="Not Pregnant">Not Pregnant</option>
                    <option value="Pending Confirmation">Pending Confirmation</option>
                    <option value="Pregnant">Pregnant (Confirmed)</option>
                  </select>
                </FormField>
                <FormField label="Last Active Heat Date">
                  <input
                     type="date"
                     value={formData.lastHeatDate}
                     onChange={(e) => setFormData({ ...formData, lastHeatDate: e.target.value })}
                     className="dense-input"
                  />
                </FormField>
              </FormGrid>
              <FormField label="Notes / Reproductive Remarks">
                <textarea
                   rows={2}
                   placeholder="Enter sow specific history, temperaments, physical parameters..."
                   value={formData.notes}
                   onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                   className="dense-input w-full p-2"
                />
              </FormField>
            </FormSection>
          </form>
        </Modal>

        {/* ==============================================
            MODAL 2: IMPORT / PROMOTE GROWER TO SOW
            ============================================== */}
        <Modal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          title="Import Female Grower to Sow Registry"
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
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Promote & Import
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
            
            {growersList.length === 0 ? (
              <div className="p-6 bg-[#0f151f] rounded border border-borderDark text-center flex flex-col items-center justify-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-textPrimary">No Female Growers Eligible for Promotion</span>
                  <span className="text-[11px] text-textSecondary">
                    No active female growers are currently eligible for breeder promotion on your device. Only female growers with 'Active' status are displayed.
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
              <FormSection title="Breeder Promotion Details">
                <FormGrid cols={1}>
                  <FormField label="Select Female Grower" required>
                    <select
                      value={importData.growerId}
                      onChange={(e) => setImportData({ ...importData, growerId: e.target.value })}
                      className="dense-select"
                    >
                      {growersList.map(g => {
                        const diffTime = Math.abs(new Date() - new Date(g.dob));
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return (
                          <option key={g._id} value={g._id}>
                            {g.animalNo} [{g.breed}] - Pen: {g.penNo} - Age: {diffDays}d - Weight: {g.latestWeight || g.birthWeight} kg
                          </option>
                        );
                      })}
                    </select>
                  </FormField>
                </FormGrid>
                <FormField label="Promotion Remarks" required>
                  <textarea
                     rows={3}
                     placeholder="Insert comments regarding maternal line evaluation, weight milestone confirmation, or physical selection checks..."
                     value={importData.notes}
                     onChange={(e) => setImportData({ ...importData, notes: e.target.value })}
                     className="dense-input w-full p-2"
                     required
                  />
                </FormField>
              </FormSection>
            )}
          </form>
        </Modal>

        {/* ==============================================
            MODAL 3: DIRECT STATUS TRANSITION
            ============================================== */}
        <Modal
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
          title={`Transition status for Sow ${selectedSow?.animalNo}`}
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
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md"
              >
                Transition Status
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
            
            <FormSection title="Status Transition Details">
              <FormGrid cols={2}>
                <FormField label="Current Status">
                  <input
                     type="text"
                     value={selectedSow?.status || ''}
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
                    <option value="Active">Active (Open)</option>
                    <option value="In Heat">Heat</option>
                    <option value="Pregnancy Pending">Mating</option>
                    <option value="Pregnant">Pregnancy</option>
                    <option value="Lactating">Lactating</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Culled">Culled</option>
                    <option value="Sold">Sold</option>
                    <option value="Dead">Dead</option>
                  </select>
                </FormField>
              </FormGrid>
              <FormField label="Operational Remarks / Reason for Transition" required>
                <input
                  type="text"
                  placeholder="e.g. Exhibiting normal active heat signals"
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
