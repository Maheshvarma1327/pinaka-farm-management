import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useTreatmentStore } from '../store/useTreatmentStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import Modal from '../components/ui/Modal';
import { FormField, FormGrid, FormSection } from '../components/ui/FormLayout';
import { Stethoscope, Plus, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function TreatmentRecord() {
  const { treatments, loading, fetchTreatments, registerTreatment, updateTreatmentStatus } = useTreatmentStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    animalId: '', animalType: 'Grower', symptoms: '',
    diagnosis: '', treatmentDetails: '', vetName: '',
    startDate: '', followUpDate: '', recoveryStatus: 'Under Observation', notes: ''
  });

  useEffect(() => { fetchTreatments(); }, [fetchTreatments]);

  const kpis = useMemo(() => ({
    total: treatments.length,
    active: treatments.filter(t => ['Under Observation', 'Under Treatment'].includes(t.recoveryStatus)).length,
    recovering: treatments.filter(t => t.recoveryStatus === 'Recovering').length,
    recovered: treatments.filter(t => t.recoveryStatus === 'Recovered').length,
  }), [treatments]);

  const columns = useMemo(() => [
    {
      header: "Treatment ID", accessor: "_id", sortable: true,
      render: (val, row) => <span className="font-extrabold text-primary font-mono text-[11px]">{row.treatmentId}</span>
    },
    {
      header: "Animal ID", accessor: "animalId", sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-textPrimary text-[11px]">{val}</span>
          <span className="text-[10px] text-textSecondary">{row.animalType}</span>
        </div>
      )
    },
    { header: "Symptoms", accessor: "symptoms", render: (val) => <span className="text-[11px] text-textSecondary truncate max-w-[150px] block">{val}</span> },
    { header: "Diagnosis", accessor: "diagnosis", render: (val) => <span className="text-[11px] text-warning font-bold">{val}</span> },
    { header: "Vet", accessor: "vetName", render: (val) => <span className="text-[11px] text-textSecondary">{val || 'In-house'}</span> },
    {
      header: "Start Date", accessor: "startDate",
      render: (val) => <span className="text-[11px] text-textSecondary">{val ? new Date(val).toLocaleDateString() : 'N/A'}</span>
    },
    {
      header: "Follow-Up", accessor: "followUpDate",
      render: (val) => {
        if (!val) return <span className="text-textSecondary/40 text-[10px]">—</span>;
        const isPast = new Date(val) < new Date();
        return <span className={`text-[11px] font-bold ${isPast ? 'text-danger' : 'text-blueAccent'}`}>{new Date(val).toLocaleDateString()}</span>;
      }
    },
    { header: "Status", accessor: "recoveryStatus", render: (val) => <StatusBadge status={val} /> },
  ], []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await registerTreatment({ ...formData, operator: 'System' });
      setIsAddModalOpen(false);
      setFormData({ animalId: '', animalType: 'Grower', symptoms: '', diagnosis: '', treatmentDetails: '', vetName: '', startDate: '', followUpDate: '', recoveryStatus: 'Under Observation', notes: '' });
    } catch (err) { alert(err.message); }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-textPrimary uppercase tracking-widest flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-primary" /> Treatment Register
            </h2>
            <p className="text-xs text-textSecondary mt-1">Disease case management, diagnosis, and recovery tracking for all livestock.</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2 text-xs py-2 px-4 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Log Treatment
          </button>
        </div>

        {loading && treatments.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Cases', val: kpis.total, color: 'primary', Icon: Stethoscope },
              { label: 'Active / Observing', val: kpis.active, color: 'danger', Icon: AlertTriangle },
              { label: 'Recovering', val: kpis.recovering, color: 'warning', Icon: Clock },
              { label: 'Recovered', val: kpis.recovered, color: 'success', Icon: CheckCircle },
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
          {loading && treatments.length === 0 ? <TableSkeleton rows={5} cols={8} /> : (
            <DataTable columns={columns} data={treatments} searchPlaceholder="Search by Animal ID, Diagnosis, Vet..." />
          )}
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log New Treatment Case" icon={<Stethoscope className="w-5 h-5 text-primary" />}>
        <form onSubmit={handleAdd} className="flex flex-col gap-5 p-1">
          <FormSection title="Animal Identity">
            <FormGrid cols={2}>
              <FormField label="Animal ID" required id="animalId">
                <input id="animalId" type="text" required className="input-field font-mono" placeholder="e.g. S-101 or G-304" value={formData.animalId} onChange={e => setFormData({ ...formData, animalId: e.target.value.toUpperCase() })} />
              </FormField>
              <FormField label="Animal Type" required id="animalType">
                <select id="animalType" className="input-field" value={formData.animalType} onChange={e => setFormData({ ...formData, animalType: e.target.value })}>
                  {['Grower', 'Sow', 'Boar', 'Piglet'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
            </FormGrid>
          </FormSection>
          <FormSection title="Clinical Information">
            <FormField label="Symptoms Observed" required id="symptoms">
              <textarea id="symptoms" required rows={2} className="input-field resize-none" placeholder="Describe observed symptoms..." value={formData.symptoms} onChange={e => setFormData({ ...formData, symptoms: e.target.value })} />
            </FormField>
            <FormGrid cols={2}>
              <FormField label="Diagnosis" required id="diagnosis">
                <input id="diagnosis" type="text" required className="input-field" placeholder="e.g. MMA, PRRS" value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} />
              </FormField>
              <FormField label="Attending Vet" id="vetName">
                <input id="vetName" type="text" className="input-field" placeholder="Vet name" value={formData.vetName} onChange={e => setFormData({ ...formData, vetName: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormField label="Treatment Protocol" required id="treatmentDetails">
              <textarea id="treatmentDetails" required rows={2} className="input-field resize-none" placeholder="Treatment administered..." value={formData.treatmentDetails} onChange={e => setFormData({ ...formData, treatmentDetails: e.target.value })} />
            </FormField>
          </FormSection>
          <FormSection title="Timeline & Status">
            <FormGrid cols={3}>
              <FormField label="Start Date" required id="startDate">
                <input id="startDate" type="date" required className="input-field" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </FormField>
              <FormField label="Follow-Up Date" id="followUpDate">
                <input id="followUpDate" type="date" className="input-field" value={formData.followUpDate} onChange={e => setFormData({ ...formData, followUpDate: e.target.value })} />
              </FormField>
              <FormField label="Recovery Status" required id="recoveryStatus">
                <select id="recoveryStatus" className="input-field" value={formData.recoveryStatus} onChange={e => setFormData({ ...formData, recoveryStatus: e.target.value })}>
                  {['Under Observation', 'Under Treatment', 'Recovering', 'Recovered', 'Critical', 'Dead'].map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
            </FormGrid>
          </FormSection>
          <div className="flex justify-end gap-3 pt-4 border-t border-borderDark">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors">Cancel</button>
            <button type="submit" className="btn-primary py-2 px-6">Log Treatment</button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
