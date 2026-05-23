import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import { useFarrowingStore } from '../../../store/useFarrowingStore';
import { useAuthStore } from '../../../store/useAuthStore';
import Modal from '../../../components/ui/Modal';
import { FormField, FormGrid } from '../../../components/ui/FormLayout';
import StatusBadge from '../../../components/ui/StatusBadge';
import { 
  ArrowLeft, 
  Baby,
  Syringe,
  Scale,
  Activity,
  Heart
} from 'lucide-react';

export default function ParityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { 
    selectedFarrowing: litter, 
    loading, 
    fetchFarrowingById, 
    updatePigletWeight,
    addLitterHealthLog
  } = useFarrowingStore();

  const [selectedPiglet, setSelectedPiglet] = useState(null);
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [weightData, setWeightData] = useState('');

  const [isVaxOpen, setIsVaxOpen] = useState(false);
  const [vaxData, setVaxData] = useState({ type: 'Vaccine', name: '', dose: '', dateAdministered: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => {
    fetchFarrowingById(id);
  }, [id, fetchFarrowingById]);

  // Handlers
  const handleOpenWeight = (piglet) => {
    setSelectedPiglet(piglet);
    setWeightData(piglet.currentWeight);
    setIsWeightOpen(true);
  };

  const submitWeight = async (e) => {
    e.preventDefault();
    try {
      await updatePigletWeight(id, selectedPiglet.pigletId, weightData);
      setIsWeightOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenVax = () => {
    setVaxData({ type: 'Vaccine', name: '', dose: '', dateAdministered: new Date().toISOString().split('T')[0], notes: '' });
    setIsVaxOpen(true);
  };

  const submitVax = async (e) => {
    e.preventDefault();
    try {
      await addLitterHealthLog(id, { ...vaxData, operator: user?.name });
      setIsVaxOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !litter) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20 text-xs text-textSecondary gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <span className="uppercase tracking-widest font-semibold text-[10px]">Loading Litter Data...</span>
        </div>
      </MainLayout>
    );
  }

  const isLactating = litter.lactationStatus === 'Lactating';

  return (
    <MainLayout>
      <div className="flex flex-col gap-5 w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/parity')} className="p-1.5 hover:bg-cardBg rounded text-textSecondary border border-borderDark/40">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black tracking-wide text-textPrimary uppercase flex items-center gap-2">
                Litter Management: <span className="text-primary font-black select-all">{litter._id.replace('far_', 'LIT-').toUpperCase()}</span>
              </h2>
              <p className="text-[9px] text-textSecondary uppercase tracking-widest mt-1">
                Farrowed On: {new Date(litter.actualFarrowingDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <StatusBadge status={litter.lactationStatus} />
        </div>

        {/* Genetics / Parents */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider text-textSecondary font-bold">Mother (Dam)</span>
              <span className="text-lg font-black text-primary select-all mt-1">Sow {litter.sowNo}</span>
            </div>
            <Heart className="w-6 h-6 text-danger opacity-50" />
          </div>
          <div className="bg-cardBg border border-borderDark rounded-lg p-4 flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider text-textSecondary font-bold">Father (Sire)</span>
              <span className="text-lg font-black text-primary select-all mt-1">Boar {litter.boarNo}</span>
            </div>
            <Activity className="w-6 h-6 text-info opacity-50" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
          {/* Section 1: Baby Roster */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-borderDark/50 pb-2 mb-4">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest flex items-center gap-1.5"><Baby className="w-4 h-4" /> Baby Piglet Roster</span>
                <span className="text-[10px] text-textSecondary font-bold">{litter.piglets?.length || 0} Total Born</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-borderDark/50 text-[10px] text-textSecondary uppercase tracking-wider bg-sidebar/50">
                      <th className="p-3 font-black">Baby ID</th>
                      <th className="p-3 font-black">Sex</th>
                      <th className="p-3 font-black">Status</th>
                      <th className="p-3 font-black text-right">Current Wgt (kg)</th>
                      <th className="p-3 font-black text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {litter.piglets?.map(piglet => (
                      <tr key={piglet.pigletId} className="border-b border-borderDark/20 hover:bg-sidebar/30 transition-colors">
                        <td className="p-3 font-bold font-mono text-primary select-all">{piglet.pigletId}</td>
                        <td className="p-3 font-semibold text-textSecondary">{piglet.sex}</td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${piglet.status === 'Dead' ? 'bg-danger/10 text-danger' : piglet.status === 'Nursing' ? 'bg-success/10 text-success' : 'bg-sidebar border border-borderDark text-textSecondary'}`}>
                            {piglet.status}
                          </span>
                        </td>
                        <td className="p-3 font-black text-right">{piglet.currentWeight}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => handleOpenWeight(piglet)}
                            disabled={!isLactating || piglet.status !== 'Nursing'}
                            className="px-2 py-1 bg-sidebar border border-borderDark rounded text-[10px] uppercase font-bold text-textPrimary hover:bg-cardBg hover:text-primary transition-colors disabled:opacity-50"
                          >
                            Update Wgt
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!litter.piglets || litter.piglets.length === 0) && (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-textSecondary italic">No individual babies tracked for this legacy litter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Health & Vaccines */}
          <div className="flex flex-col gap-5">
            <div className="bg-cardBg border border-borderDark rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-borderDark/50 pb-2 mb-4">
                <span className="text-[10px] font-black uppercase text-textPrimary tracking-widest flex items-center gap-1.5"><Syringe className="w-4 h-4" /> Litter Health Log</span>
                {isLactating && (
                  <button onClick={handleOpenVax} className="text-[10px] font-bold uppercase text-primary hover:text-primary-dark">
                    + Log Dose
                  </button>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                {litter.healthLog?.map((log, idx) => (
                  <div key={idx} className="bg-sidebar border border-borderDark rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-textPrimary">{log.name}</span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${log.type === 'Vaccine' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'}`}>
                        {log.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-textSecondary">
                      <span>Dose: {log.dose}</span>
                      <span>{new Date(log.dateAdministered).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {(!litter.healthLog || litter.healthLog.length === 0) && (
                  <div className="text-center py-4 text-xs text-textSecondary italic border border-dashed border-borderDark/50 rounded">
                    No vaccines or medicines logged yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Update Weight */}
        <Modal
          isOpen={isWeightOpen}
          onClose={() => setIsWeightOpen(false)}
          title={`Update Weight: ${selectedPiglet?.pigletId}`}
          footer={
            <>
              <button onClick={() => setIsWeightOpen(false)} className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold">Cancel</button>
              <button onClick={submitWeight} className="px-4 py-2 bg-primary hover:bg-primary-dark text-black text-xs rounded uppercase font-bold shadow-md">Save Weight</button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs">
            <p className="text-[11px] text-textSecondary">Update individual weight for this baby.</p>
            <FormGrid cols={1}>
              <FormField label="Current Weight (kg)" required>
                <input type="number" step="0.1" value={weightData} onChange={(e) => setWeightData(e.target.value)} className="dense-input font-black" required />
              </FormField>
            </FormGrid>
          </form>
        </Modal>

        {/* Modal: Log Vaccine */}
        <Modal
          isOpen={isVaxOpen}
          onClose={() => setIsVaxOpen(false)}
          title="Log Litter Vaccine/Medicine"
          footer={
            <>
              <button onClick={() => setIsVaxOpen(false)} className="px-4 py-2 hover:bg-cardBg border border-borderDark text-textSecondary text-xs rounded uppercase font-bold">Cancel</button>
              <button onClick={submitVax} className="px-4 py-2 bg-warning hover:bg-warning/80 text-black text-xs rounded uppercase font-bold shadow-md flex items-center gap-1"><Syringe className="w-3.5 h-3.5"/> Log Dose</button>
            </>
          }
        >
          <form className="flex flex-col gap-4 text-xs">
            <p className="text-[11px] text-textSecondary">This logs a batch dose applied to all nursing babies in this litter.</p>
            
            <FormGrid cols={2}>
              <FormField label="Type" required>
                <select value={vaxData.type} onChange={(e) => setVaxData({...vaxData, type: e.target.value})} className="dense-select">
                  <option value="Vaccine">Vaccine</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Treatment">Treatment</option>
                </select>
              </FormField>
              <FormField label="Date Administered" required>
                <input type="date" value={vaxData.dateAdministered} onChange={(e) => setVaxData({...vaxData, dateAdministered: e.target.value})} className="dense-input" required />
              </FormField>
            </FormGrid>

            <FormGrid cols={2}>
              <FormField label="Vaccine / Medicine Name" required>
                <input type="text" placeholder="e.g. Porcine Circo FLEX" value={vaxData.name} onChange={(e) => setVaxData({...vaxData, name: e.target.value})} className="dense-input font-bold" required />
              </FormField>
              <FormField label="Dose (Per Piglet)">
                <input type="text" placeholder="e.g. 1 ml I/M" value={vaxData.dose} onChange={(e) => setVaxData({...vaxData, dose: e.target.value})} className="dense-input" />
              </FormField>
            </FormGrid>

            <FormField label="Notes">
              <textarea rows={2} value={vaxData.notes} onChange={(e) => setVaxData({...vaxData, notes: e.target.value})} className="dense-input w-full p-2" />
            </FormField>
          </form>
        </Modal>

      </div>
    </MainLayout>
  );
}
