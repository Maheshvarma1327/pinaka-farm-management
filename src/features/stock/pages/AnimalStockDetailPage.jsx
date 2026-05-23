import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import { useAnimalStore } from '../../../store/useAnimalStore';
import { useTreatmentStore } from '../../../store/useTreatmentStore';
import { FormField, FormGrid } from '../../../components/ui/FormLayout';
import StatusBadge from '../../../components/ui/StatusBadge';
import { 
  ArrowLeft, 
  Database,
  Hash,
  Tag,
  Calendar,
  Layers,
  Activity,
  HeartPulse,
  Heart
} from 'lucide-react';

export default function AnimalStockDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedAnimal: animal, loading, fetchAnimalById } = useAnimalStore();
  const { treatments, fetchTreatments } = useTreatmentStore();

  useEffect(() => {
    fetchAnimalById(id);
    fetchTreatments();
  }, [id, fetchAnimalById, fetchTreatments]);

  // Query medical treatments for this specific animal profile
  const animalTreatments = useMemo(() => {
    if (!animal) return [];
    return treatments.filter(t => t.animalId.toUpperCase() === animal.animalNo.toUpperCase());
  }, [treatments, animal]);

  if (loading || !animal) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 text-textSecondary text-sm font-bold uppercase tracking-widest animate-pulse">
          Loading Animal Profile...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto pb-12 flex flex-col gap-6">
        
        {/* Header Navigation & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/stock')}
              className="p-2 bg-sidebar border border-borderDark rounded hover:bg-cardBg hover:text-primary transition-colors text-textSecondary animate-fade-in"
              title="Back to Registry"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black text-textPrimary tracking-widest uppercase">
                  {animal.animalNo}
                </h2>
                <StatusBadge status={animal.operationalStatus} />
                <StatusBadge status={animal.lifecycleStage} />
              </div>
              <p className="text-[11px] text-textSecondary font-bold mt-1 tracking-wider uppercase">
                Master Registry Profile
              </p>
            </div>
          </div>
        </div>

        {/* Top Intelligence Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="op-card p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-textSecondary tracking-wider">Ear Tag</span>
            <div className="flex items-center gap-2 text-lg font-black text-textPrimary">
              <Tag className="w-4 h-4 text-primary" />
              {animal.earTag || 'UNTAGGED'}
            </div>
          </div>
          
          <div className="op-card p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-textSecondary tracking-wider">Age</span>
            <div className="flex items-center gap-2 text-lg font-black text-textPrimary">
              <Calendar className="w-4 h-4 text-primary" />
              {Math.floor((new Date() - new Date(animal.dob)) / (1000 * 60 * 60 * 24 * 30))} Months
            </div>
          </div>

          <div className="op-card p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-textSecondary tracking-wider">Sex & Breed</span>
            <div className="flex items-center gap-2 text-lg font-black text-textPrimary uppercase">
              <Hash className="w-4 h-4 text-primary" />
              {animal.sex.charAt(0)} / {animal.breed}
            </div>
          </div>

          <div className="op-card p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-textSecondary tracking-wider">Current Pen</span>
            <div className="flex items-center gap-2 text-lg font-black text-textPrimary">
              <Layers className="w-4 h-4 text-primary" />
              {animal.currentPen || 'Unassigned'}
            </div>
          </div>
        </div>

        {/* Identity Details & Lifecycle Path */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="op-card p-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest border-l-2 border-primary pl-2 mb-6">
                Identity Details
              </h3>
              <div className="flex flex-col gap-5">
                <FormGrid cols={2}>
                  <FormField label="Animal Number">
                    <div className="input-field bg-background/50 text-textSecondary select-all">{animal.animalNo}</div>
                  </FormField>
                  <FormField label="Ear Tag">
                    <div className="input-field bg-background/50 text-textSecondary">{animal.earTag || 'N/A'}</div>
                  </FormField>
                </FormGrid>
                
                <FormGrid cols={2}>
                  <FormField label="Date of Birth">
                    <div className="input-field bg-background/50 text-textSecondary">{new Date(animal.dob).toLocaleDateString()}</div>
                  </FormField>
                  <FormField label="Current Weight">
                    <div className="input-field bg-background/50 text-textSecondary">{animal.currentWeight} kg</div>
                  </FormField>
                </FormGrid>

                <FormGrid cols={2}>
                  <FormField label="Source">
                    <div className="input-field bg-background/50 text-textSecondary">{animal.source}</div>
                  </FormField>
                  <FormField label="Supplier">
                    <div className="input-field bg-background/50 text-textSecondary">{animal.supplier || 'N/A'}</div>
                  </FormField>
                </FormGrid>
              </div>
            </div>
          </div>

          {/* Module Links Side Panel */}
          <div className="flex flex-col gap-4">
            <div className="op-card p-5">
              <h3 className="text-[11px] font-black text-textPrimary uppercase tracking-widest flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-warning" />
                Linked Modules
              </h3>
              
              <div className="flex flex-col gap-3">
                <div className={`p-3 border rounded-lg flex flex-col gap-1.5 transition-all ${animalTreatments.length > 0 ? 'bg-success/5 border-success/20' : 'bg-sidebar border-borderDark opacity-50'}`}>
                  <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Health History</span>
                  <span className="text-xs text-textPrimary font-semibold">
                    {animalTreatments.length > 0 ? `${animalTreatments.length} cases registered` : 'No treatments active'}
                  </span>
                </div>
                
                {animal.lifecycleStage === 'Sow' && (
                  <div className="p-3 bg-blueAccent/10 border border-blueAccent/20 rounded-lg flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-blueAccent uppercase tracking-widest">Breeding Link</span>
                    <span className="text-xs text-textPrimary font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/sows/${animal.animalNo}`)}>View Sow Profile</span>
                  </div>
                )}
                
                {animal.lifecycleStage === 'Boar' && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Breeding Link</span>
                    <span className="text-xs text-textPrimary font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/boars/${animal.animalNo}`)}>View Boar Profile</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Medical History Section */}
        <div className="op-card p-6">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest border-l-2 border-primary pl-2 mb-6 flex items-center gap-2">
            <Heart className="w-4.5 h-4.5 text-primary shrink-0" /> Clinical Medical History
          </h3>
          {animalTreatments.length === 0 ? (
            <div className="py-8 text-center text-xs text-textSecondary bg-cardBg/30 border border-borderDark/45 rounded-xl">
              No historical treatments, medicine administrations, or clinical cases registered for this patient.
            </div>
          ) : (
            <div className="overflow-x-auto border border-borderDark/45 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-cardBg border-b border-borderDark text-textSecondary font-bold">
                    <th className="p-3">Date</th>
                    <th className="p-3">Treatment ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Diagnosis</th>
                    <th className="p-3">Prescribed Medicine</th>
                    <th className="p-3">Dosage / Route</th>
                    <th className="p-3">Recovery Status</th>
                    <th className="p-3">Attending Vet</th>
                  </tr>
                </thead>
                <tbody>
                  {animalTreatments.map((t, idx) => (
                    <tr key={idx} className="border-b border-borderDark/40 hover:bg-cardBg/40 text-textSecondary">
                      <td className="p-3 font-bold text-textPrimary">{t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-3 font-mono font-bold text-primary">{t.treatmentId}</td>
                      <td className="p-3"><StatusBadge status={t.treatmentType || 'Medicine'} /></td>
                      <td className="p-3 font-bold text-warning">{t.diagnosis}</td>
                      <td className="p-3 font-extrabold text-textPrimary">{t.medicineName || '—'}</td>
                      <td className="p-3 font-mono text-textPrimary">{t.doseQuantity ? `${t.doseQuantity} ${t.doseUnit || 'ml'} (${t.administrationRoute || 'IM'})` : '—'}</td>
                      <td className="p-3"><StatusBadge status={t.recoveryStatus} /></td>
                      <td className="p-3">{t.vetName || 'In-house'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
}
