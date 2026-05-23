import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAnimalStore } from '../store/useAnimalStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import Modal from '../components/ui/Modal';
import { FormField, FormGrid } from '../components/ui/FormLayout';
import { 
  Database,
  Plus,
  Search,
  Hash,
  Tag,
  Activity,
  Calendar,
  Layers
} from 'lucide-react';

export default function AnimalStockRecord() {
  const navigate = useNavigate();
  const { animals, loading, fetchAnimals, registerAnimal } = useAnimalStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    animalNo: '',
    earTag: '',
    dob: '',
    sex: 'Female',
    breed: 'Large White',
    currentWeight: '',
    source: 'Farm Born',
    lifecycleStage: 'Piglet',
    currentPen: ''
  });

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const kpis = useMemo(() => {
    const totalAnimals = animals.length;
    const totalActive = animals.filter(a => a.operationalStatus !== 'Culled' && a.operationalStatus !== 'Dead').length;
    const totalSows = animals.filter(a => a.lifecycleStage === 'Sow').length;
    const totalGrowers = animals.filter(a => a.lifecycleStage === 'Grower').length;

    return { totalAnimals, totalActive, totalSows, totalGrowers };
  }, [animals]);

  const columns = useMemo(() => [
    { 
      header: "Animal ID", 
      accessor: "animalNo", 
      sortable: true,
      render: (val, row) => (
        <span 
          className="font-extrabold text-primary select-all cursor-pointer hover:underline flex items-center gap-1.5" 
          onClick={() => navigate(`/stock/${row._id}`)}
        >
          <Hash className="w-3.5 h-3.5 opacity-50" />
          {val}
        </span>
      )
    },
    { 
      header: "Ear Tag", 
      accessor: "earTag", 
      sortable: true,
      render: (val) => val ? (
        <span className="text-textSecondary flex items-center gap-1 text-[11px] font-bold">
          <Tag className="w-3 h-3" /> {val}
        </span>
      ) : <span className="text-textSecondary/40 text-[10px]">UNTAGGED</span>
    },
    { 
      header: "Stage", 
      accessor: "lifecycleStage", 
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    },
    { 
      header: "Sex & Breed", 
      accessor: "breed", 
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-textPrimary text-[11px] uppercase tracking-wider">{val}</span>
          <span className="text-[10px] text-textSecondary">{row.sex}</span>
        </div>
      )
    },
    { 
      header: "Age", 
      accessor: "dob", 
      sortable: true,
      render: (val) => {
        if (!val) return 'N/A';
        const months = Math.floor((new Date() - new Date(val)) / (1000 * 60 * 60 * 24 * 30));
        return <span className="font-medium text-textSecondary">{months} mo</span>;
      }
    },
    { 
      header: "Status", 
      accessor: "operationalStatus", 
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    }
  ], [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerAnimal({
        ...formData,
        operator: 'System'
      });
      setIsAddModalOpen(false);
      setFormData({
        animalNo: '',
        earTag: '',
        dob: '',
        sex: 'Female',
        breed: 'Large White',
        currentWeight: '',
        source: 'Farm Born',
        lifecycleStage: 'Piglet',
        currentPen: ''
      });
    } catch (err) {
      alert(err.message || 'Failed to register animal.');
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-textPrimary uppercase tracking-widest flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Master Animal Registry
            </h2>
            <p className="text-xs text-textSecondary mt-1 max-w-2xl leading-relaxed">
              Global source of truth for all livestock identities across the farm. Lifecycle states are inherited from this registry.
            </p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-4 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Register Animal
          </button>
        </div>

        {/* KPI Row */}
        {loading && animals.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="op-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Total Herd</p>
                <p className="text-2xl font-black text-primary">{kpis.totalAnimals}</p>
              </div>
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                <Database className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            <div className="op-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Active Operations</p>
                <p className="text-2xl font-black text-success">{kpis.totalActive}</p>
              </div>
              <div className="w-10 h-10 rounded bg-success/10 flex items-center justify-center border border-success/20">
                <Activity className="w-5 h-5 text-success" />
              </div>
            </div>

            <div className="op-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Total Sows</p>
                <p className="text-2xl font-black text-blueAccent">{kpis.totalSows}</p>
              </div>
              <div className="w-10 h-10 rounded bg-blueAccent/10 flex items-center justify-center border border-blueAccent/20">
                <Layers className="w-5 h-5 text-blueAccent" />
              </div>
            </div>

            <div className="op-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Active Growers</p>
                <p className="text-2xl font-black text-warning">{kpis.totalGrowers}</p>
              </div>
              <div className="w-10 h-10 rounded bg-warning/10 flex items-center justify-center border border-warning/20">
                <Layers className="w-5 h-5 text-warning" />
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="op-card border border-borderDark rounded-xl overflow-hidden">
          {loading && animals.length === 0 ? (
            <TableSkeleton rows={6} cols={6} />
          ) : (
            <DataTable 
              columns={columns} 
              data={animals} 
              searchPlaceholder="Search by Animal ID, Tag, or Breed..."
            />
          )}
        </div>

      </div>

      {/* Add Animal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Animal"
        icon={<Database className="w-5 h-5 text-primary" />}
      >
        <form onSubmit={handleRegister} className="flex flex-col gap-5 p-1">
          <FormGrid>
            <FormField label="System Animal ID" required id="animalNo">
              <input
                id="animalNo"
                type="text"
                required
                className="input-field font-mono"
                placeholder="e.g. S-101"
                value={formData.animalNo}
                onChange={e => setFormData({ ...formData, animalNo: e.target.value.toUpperCase() })}
              />
            </FormField>
            
            <FormField label="Ear Tag (Optional)" id="earTag">
              <input
                id="earTag"
                type="text"
                className="input-field"
                placeholder="e.g. ET-001"
                value={formData.earTag}
                onChange={e => setFormData({ ...formData, earTag: e.target.value.toUpperCase() })}
              />
            </FormField>
          </FormGrid>

          <FormGrid>
            <FormField label="Date of Birth" required id="dob">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
                <input
                  id="dob"
                  type="date"
                  required
                  className="input-field pl-9"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </FormField>

            <FormField label="Sex" required id="sex">
              <select
                id="sex"
                required
                className="input-field"
                value={formData.sex}
                onChange={e => setFormData({ ...formData, sex: e.target.value })}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Unknown">Unknown</option>
              </select>
            </FormField>
          </FormGrid>

          <FormGrid>
            <FormField label="Breed" required id="breed">
              <select
                id="breed"
                required
                className="input-field"
                value={formData.breed}
                onChange={e => setFormData({ ...formData, breed: e.target.value })}
              >
                <option value="Large White">Large White</option>
                <option value="Landrace">Landrace</option>
                <option value="Duroc">Duroc</option>
                <option value="Crossbred">Crossbred</option>
                <option value="Berkshire">Berkshire</option>
              </select>
            </FormField>

            <FormField label="Initial Weight (kg)" required id="weight">
              <input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                required
                className="input-field"
                placeholder="0.00"
                value={formData.currentWeight}
                onChange={e => setFormData({ ...formData, currentWeight: e.target.value })}
              />
            </FormField>
          </FormGrid>

          <FormGrid>
            <FormField label="Lifecycle Stage" required id="lifecycleStage">
              <select
                id="lifecycleStage"
                required
                className="input-field"
                value={formData.lifecycleStage}
                onChange={e => setFormData({ ...formData, lifecycleStage: e.target.value })}
              >
                <option value="Piglet">Piglet</option>
                <option value="Grower">Grower</option>
                <option value="Sow">Sow</option>
                <option value="Boar">Boar</option>
              </select>
            </FormField>

            <FormField label="Source" required id="source">
              <select
                id="source"
                required
                className="input-field"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Farm Born">Farm Born</option>
                <option value="Purchased">Purchased</option>
                <option value="Imported">Imported</option>
              </select>
            </FormField>
          </FormGrid>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-borderDark">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-2 px-6"
            >
              Register Animal
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
