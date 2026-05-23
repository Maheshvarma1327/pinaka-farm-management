import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import { useBreedingStore } from '../../../store/useBreedingStore';
import { useAuthStore } from '../../../store/useAuthStore';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { FormField, FormGrid, FormSection } from '../../../components/ui/FormLayout';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Activity,
  Heart,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function BreedingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { 
    selectedBreeding, 
    loading, 
    error, 
    fetchBreedingById, 
    confirmPregnancy,
    markFailedBreeding,
    returnToHeat
  } = useBreedingStore();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isFailedOpen, setIsFailedOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchBreedingById(id);
  }, [id, fetchBreedingById]);

  const canEdit = user?.role === 'Admin' || user?.role === 'Farm Worker';

  // Modal handlers
  const handleOpenConfirm = () => {
    setFormError('');
    setActionNotes('Ultrasound scan confirmed positive pregnancy.');
    setIsConfirmOpen(true);
  };

  const handleOpenFailed = () => {
    setFormError('');
    setActionNotes('Ultrasound scan showed negative. Mismate recorded.');
    setIsFailedOpen(true);
  };

  const handleOpenReturn = () => {
    setFormError('');
    setActionNotes('Sow returned to heat cycle successfully after failed breeding or abortion.');
    setIsReturnOpen(true);
  };

  const submitConfirm = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await confirmPregnancy(id, user?.name, actionNotes);
      setIsConfirmOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const submitFailed = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await markFailedBreeding(id, user?.name, actionNotes);
      setIsFailedOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const submitReturnToHeat = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await returnToHeat(id, user?.name, actionNotes);
      setIsReturnOpen(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading || (!selectedBreeding && !error) || (selectedBreeding && selectedBreeding._id !== id && !error)) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20 text-xs text-textSecondary gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <span className="uppercase tracking-widest font-semibold text-[10px]">Hydrating Breeding Record...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !selectedBreeding) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto w-full py-12 text-center my-8 bg-cardBg border border-borderDark rounded-lg p-6 flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-danger mb-4" />
          <h2 className="text-sm font-black uppercase tracking-widest text-danger mb-2">Record Sync Error</h2>
          <p className="text-xs text-textSecondary mb-6">{error || "Breeding record not found."}</p>
          <button 
            onClick={() => navigate('/breeding')}
            className="px-4 py-2 bg-sidebar text-xs text-textPrimary hover:bg-cardBg hover:text-primary rounded border border-borderDark uppercase tracking-wider font-bold"
          >
            Back to Registry
          </button>
        </div>
      </MainLayout>
    );
  }

  const isPending = selectedBreeding.pregnancyResult === 'Pending Confirmation';
  const isFailed = selectedBreeding.pregnancyResult === 'Failed Breeding' || selectedBreeding.pregnancyResult === 'Returned To Heat' || selectedBreeding.pregnancyResult === 'Aborted';
  const isPregnant = selectedBreeding.pregnancyResult === 'Pregnant Confirmed';
  const currentStatus = selectedBreeding.breedingStatus;

  return (
    <MainLayout>
      <div className="flex flex-col gap-5 w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/breeding')}
              className="p-1.5 hover:bg-cardBg rounded text-textSecondary border border-borderDark/40"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black tracking-wide text-textPrimary uppercase flex items-center gap-2">
                Breeding Card: <span className="text-primary font-black select-all">{selectedBreeding._id.replace('br_', 'BR-').toUpperCase()}</span>
              </h2>
              <p className="text-[9px] text-textSecondary uppercase tracking-widest mt-1">
                Sow {selectedBreeding.sowNo} x Boar {selectedBreeding.boarNo} • Operator: {selectedBreeding.operator}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Reproductive Timeline */}
        <div className="bg-cardBg border border-borderDark rounded-lg p-5 no-print">
          <div className="flex items-center justify-between border-b border-borderDark/50 pb-2 mb-4">
            <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 2: Reproductive Timeline</span>
            <span className="text-[9px] text-textSecondary uppercase font-mono">Current Status: {currentStatus}</span>
          </div>

          <div className="relative flex items-center justify-between w-full mt-6 px-4">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-borderDark/60 z-0"></div>
            
            {[
              { label: 'Heat Detected', status: 'Heat Detected' },
              { label: 'Serviced', status: 'Pregnancy Pending' },
              { label: 'Pregnancy Confirmed', status: 'Pregnant Confirmed' },
              { label: 'Farrowing Expected', status: 'Farrowing Expected' }
            ].map((step, idx) => {
              const statusSequence = ['Heat Detected', 'Pregnancy Pending', 'Pregnant Confirmed', 'Farrowing Expected'];
              let currentIdx = statusSequence.indexOf(currentStatus);
              if (currentIdx === -1 && currentStatus === 'Failed Breeding') currentIdx = 1; // Failed after pending
              if (currentIdx === -1 && currentStatus === 'Returned To Heat') currentIdx = 1;
              if (currentIdx === -1) currentIdx = 0;

              const stepIdx = statusSequence.indexOf(step.status);
              
              const isPast = currentIdx > stepIdx || (isPregnant && stepIdx <= 2) || (currentStatus === 'Farrowing Expected');
              const isCurrent = currentStatus === step.status || (isPending && step.status === 'Pregnancy Pending');

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCurrent 
                      ? 'bg-primary border-primary text-black font-extrabold shadow-glow' 
                      : isPast 
                      ? 'bg-sidebar border-success text-success' 
                      : 'bg-sidebar border-borderDark text-textSecondary'
                  }`}>
                    {isCurrent ? <Activity className="w-4 h-4 animate-spin-slow" /> : isPast ? <CheckCircle className="w-4.5 h-4.5" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold mt-2 uppercase tracking-wide ${isCurrent ? 'text-primary' : isPast ? 'text-success' : 'text-textSecondary'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 w-full">
          {/* Section 1 & 4 */}
          <div className="xl:col-span-2 flex flex-col gap-5">
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-borderDark/50 pb-2 mb-4">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 1: Breeding Overview</span>
                <StatusBadge status={currentStatus} />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-sidebar/30 border border-borderDark/50 rounded p-3 text-center">
                  <p className="text-[9px] text-textSecondary uppercase font-bold tracking-wider">Service Date</p>
                  <h4 className="text-xs font-black text-textPrimary mt-1.5 font-mono">
                    {new Date(selectedBreeding.serviceDate).toLocaleDateString()}
                  </h4>
                </div>
                <div className="bg-sidebar/30 border border-borderDark/50 rounded p-3 text-center">
                  <p className="text-[9px] text-textSecondary uppercase font-bold tracking-wider">Mating Type</p>
                  <h4 className="text-[10px] font-black text-textPrimary mt-1.5 uppercase tracking-wider">{selectedBreeding.matingType}</h4>
                </div>
                <div className="bg-sidebar/30 border border-borderDark/50 rounded p-3 text-center">
                  <p className="text-[9px] text-textSecondary uppercase font-bold tracking-wider">Pregnancy Check</p>
                  <h4 className="text-xs font-black text-info mt-1.5 font-mono">{new Date(selectedBreeding.pregnancyCheckDate).toLocaleDateString()}</h4>
                </div>
                <div className="bg-sidebar/30 border border-borderDark/50 rounded p-3 text-center">
                  <p className="text-[9px] text-textSecondary uppercase font-bold tracking-wider">Expected Farrowing</p>
                  <h4 className="text-xs font-black text-success mt-1.5 font-mono">{selectedBreeding.expectedFarrowingDate ? new Date(selectedBreeding.expectedFarrowingDate).toLocaleDateString() : '-'}</h4>
                </div>
              </div>
            </div>

            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-borderDark/50 pb-2 mb-4">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 4: Linked Records</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => navigate(`/sows/${selectedBreeding.sowId}`)} className="flex items-center justify-between bg-sidebar p-3 border border-borderDark rounded hover:border-primary/50 transition-colors">
                   <div className="flex flex-col text-left">
                     <span className="text-[9px] uppercase tracking-wider text-textSecondary">Sow Record</span>
                     <span className="text-sm font-black text-primary select-all">{selectedBreeding.sowNo}</span>
                   </div>
                   <ArrowLeft className="w-4 h-4 text-textSecondary rotate-180" />
                 </button>
                 <button onClick={() => navigate(`/boars/${selectedBreeding.boarId}`)} className="flex items-center justify-between bg-sidebar p-3 border border-borderDark rounded hover:border-primary/50 transition-colors">
                   <div className="flex flex-col text-left">
                     <span className="text-[9px] uppercase tracking-wider text-textSecondary">Boar Record</span>
                     <span className="text-sm font-black text-primary select-all">{selectedBreeding.boarNo}</span>
                   </div>
                   <ArrowLeft className="w-4 h-4 text-textSecondary rotate-180" />
                 </button>
              </div>
            </div>

            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-borderDark/50 pb-2 mb-4">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Breeding Ledger History</span>
              </div>
              <div className="flex flex-col gap-3">
                {selectedBreeding.statusHistory?.map((sh, i) => (
                  <div key={i} className="flex flex-col border-l-2 border-primary/40 pl-3 py-1">
                    <span className="text-[9px] text-textSecondary font-mono">{new Date(sh.updatedAt).toLocaleString()} • {sh.updatedBy}</span>
                    <span className="text-xs font-bold text-textPrimary uppercase mt-1">{sh.newStatus}</span>
                    {sh.notes && <span className="text-[11px] text-textSecondary mt-0.5">{sh.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Pregnancy Management */}
          <div className="flex flex-col gap-5">
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-borderDark/50 pb-2 mb-4">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest">Section 3: Pregnancy Management</span>
              </div>

              {!isPending && !isFailed && !isPregnant && (
                 <p className="text-[11px] text-textSecondary italic">No active management actions available.</p>
              )}

              {isPending && canEdit && (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] text-textSecondary mb-2">Pregnancy check is due 21 days after service. Update the status below upon scan completion.</p>
                  <button 
                    onClick={handleOpenConfirm}
                    className="w-full py-2.5 bg-success/10 hover:bg-success/20 text-success border border-success/30 uppercase text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Confirm Pregnancy
                  </button>
                  <button 
                    onClick={handleOpenFailed}
                    className="w-full py-2.5 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 uppercase text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Mark Failed Breeding
                  </button>
                </div>
              )}

              {isFailed && canEdit && currentStatus !== 'Returned To Heat' && (
                <div className="flex flex-col gap-3">
                  <div className="bg-danger/10 text-danger p-3 rounded border border-danger/20 text-[11px] font-bold uppercase mb-2">
                    Service Failed
                  </div>
                  <button 
                    onClick={handleOpenReturn}
                    className="w-full py-2.5 bg-secondary hover:bg-cardBg text-primary border border-primary/30 uppercase text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Return Sow to Heat
                  </button>
                </div>
              )}

              {isPregnant && (
                <div className="bg-success/10 text-success p-4 rounded border border-success/20 flex flex-col items-center justify-center text-center">
                  <Heart className="w-8 h-8 mb-2" />
                  <span className="text-xs font-black uppercase tracking-widest">Pregnancy Confirmed</span>
                  <span className="text-[10px] mt-1 opacity-80">Awaiting Farrowing Registry</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <Modal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          title="Confirm Pregnancy Positive"
          footer={
            <>
              <button onClick={() => setIsConfirmOpen(false)} className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold">Cancel</button>
              <button onClick={submitConfirm} className="px-4 py-2 bg-success hover:bg-success-dark text-white text-xs rounded uppercase font-bold shadow-md">Confirm Pregnancy</button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs">
            {formError && <div className="bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium text-[11px]">{formError}</div>}
            <FormField label="Confirmation Remarks" required>
              <textarea rows={3} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} className="dense-input w-full p-2" required />
            </FormField>
          </form>
        </Modal>

        <Modal
          isOpen={isFailedOpen}
          onClose={() => setIsFailedOpen(false)}
          title="Mark Breeding as Failed"
          footer={
            <>
              <button onClick={() => setIsFailedOpen(false)} className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold">Cancel</button>
              <button onClick={submitFailed} className="px-4 py-2 bg-danger hover:bg-danger-dark text-white text-xs rounded uppercase font-bold shadow-md">Mark Failed</button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs">
            {formError && <div className="bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium text-[11px]">{formError}</div>}
            <FormField label="Failure Remarks / Cause" required>
              <textarea rows={3} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} className="dense-input w-full p-2" required />
            </FormField>
          </form>
        </Modal>

        <Modal
          isOpen={isReturnOpen}
          onClose={() => setIsReturnOpen(false)}
          title="Return Sow to Heat"
          footer={
            <>
              <button onClick={() => setIsReturnOpen(false)} className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold">Cancel</button>
              <button onClick={submitReturnToHeat} className="px-4 py-2 bg-primary text-black text-xs rounded uppercase font-bold shadow-md">Return to Heat</button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs">
            {formError && <div className="bg-danger/10 border border-danger/25 p-3 rounded text-danger font-medium text-[11px]">{formError}</div>}
            <p className="text-[11px] text-textSecondary">This will update the sow's operational status and recalculate the next expected heat cycle automatically.</p>
            <FormField label="Remarks" required>
              <textarea rows={3} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} className="dense-input w-full p-2" required />
            </FormField>
          </form>
        </Modal>

      </div>
    </MainLayout>
  );
}
