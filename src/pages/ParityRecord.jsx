import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useFarrowingStore } from '../store/useFarrowingStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { 
  Eye, 
  Syringe,
  Baby,
  Scale
} from 'lucide-react';

export default function ParityRecord() {
  const navigate = useNavigate();
  
  const { 
    farrowings, 
    loading, 
    fetchFarrowings 
  } = useFarrowingStore();

  useEffect(() => {
    fetchFarrowings();
  }, [fetchFarrowings]);

  // KPIs
  const kpis = useMemo(() => {
    const activeLitters = farrowings.filter(f => f.lactationStatus === 'Lactating').length;
    const totalPigletsNursing = farrowings
      .filter(f => f.lactationStatus === 'Lactating')
      .reduce((acc, f) => acc + ((f.piglets || []).filter(p => p.status === 'Nursing').length), 0);
    
    // Total vaccines given across all litters
    const totalVaccines = farrowings.reduce((acc, f) => acc + ((f.healthLog || []).filter(h => h.type === 'Vaccine').length), 0);

    return { activeLitters, totalPigletsNursing, totalVaccines };
  }, [farrowings]);

  const columns = [
    { 
      header: "Litter / Parity ID", 
      accessor: "_id", 
      sortable: true,
      render: (val, row) => (
        <span 
          className="font-extrabold text-primary select-all cursor-pointer hover:underline" 
          onClick={() => navigate(`/parity/${row._id}`)}
        >
          {val ? val.replace('far_', 'LIT-').toUpperCase() : 'UNKNOWN'}
        </span>
      )
    },
    { header: "Mother (Sow)", accessor: "sowNo", sortable: true, render: (val) => <span className="font-bold font-mono text-textPrimary">{val}</span> },
    { header: "Father (Boar)", accessor: "boarNo", sortable: true, render: (val) => <span className="font-bold text-textSecondary">{val}</span> },
    { 
      header: "Farrowed On", 
      accessor: "actualFarrowingDate", 
      sortable: true,
      render: (val) => <span className="font-mono text-info">{new Date(val).toLocaleDateString()}</span>
    },
    { 
      header: "Live Babies", 
      accessor: "piglets", 
      sortable: false,
      render: (piglets) => {
        const alive = (piglets || []).filter(p => p.status === 'Nursing').length;
        return <span className="font-black text-success flex items-center gap-1"><Baby className="w-3.5 h-3.5" /> {alive}</span>;
      }
    },
    { 
      header: "Vaccines Logged", 
      accessor: "healthLog", 
      sortable: false,
      render: (logs) => {
        const vax = (logs || []).filter(l => l.type === 'Vaccine').length;
        return <span className="font-black text-warning flex items-center gap-1"><Syringe className="w-3.5 h-3.5" /> {vax} Doses</span>;
      }
    },
    { 
      header: "Lactation Status", 
      accessor: "lactationStatus", 
      sortable: true,
      render: (val) => <StatusBadge status={val} /> 
    },
    {
      header: "Actions",
      accessor: "_id",
      sortable: false,
      render: (val, row) => (
        <button 
          onClick={() => navigate(`/parity/${row._id}`)}
          className="p-1 hover:bg-cardBg hover:text-primary rounded text-textSecondary flex items-center gap-1"
          title="Manage Litter"
        >
          <Scale className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase font-bold tracking-wider">Manage</span>
        </button>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="flex flex-col gap-5 w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 no-print">
          <div>
            <h2 className="text-base font-black tracking-wide text-textPrimary uppercase">
              PARITY & LITTER MANAGEMENT
            </h2>
            <p className="text-[10px] text-textSecondary uppercase tracking-widest mt-1">
              Track baby piglet weights, individual IDs, and strict vaccination schedules during the 2-month lactation phase.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 no-print">
          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Active Litters</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-primary">{kpis.activeLitters}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Sows Nursing</span>
            </div>
          </div>
          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Total Piglets Nursing</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-success animate-pulse">{kpis.totalPigletsNursing}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Babies</span>
            </div>
          </div>
          <div className="bg-cardBg border border-borderDark rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[9px] text-textSecondary uppercase tracking-widest font-black">Litter Vaccines Logged</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className="text-lg font-black text-warning">{kpis.totalVaccines}</h3>
              <span className="text-[9px] text-textSecondary uppercase">Total Doses</span>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={7} cols={8} />
        ) : (
          <DataTable 
            columns={columns} 
            data={farrowings} // Showing all litters, but user can filter via search
            searchPlaceholder="Search by Litter ID, Sow No..."
          />
        )}

      </div>
    </MainLayout>
  );
}
