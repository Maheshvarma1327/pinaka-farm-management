import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAnimalStore } from '../store/useAnimalStore';
import { useTreatmentStore } from '../store/useTreatmentStore';
import { useMortalityStore } from '../store/useMortalityStore';
import { useSaleStore } from '../store/useSaleStore';
import { useCashBookStore } from '../store/useCashBookStore';
import { useFarrowingStore } from '../store/useFarrowingStore';
import { useBreedingStore } from '../store/useBreedingStore';
import {
  BarChart3, TrendingUp, TrendingDown, Database, Stethoscope,
  Skull, DollarSign, Wallet, Sparkles, GitCompare,
  Download, Filter, Calendar, RefreshCw
} from 'lucide-react';

// Simple stat card component
function ReportCard({ title, value, subtitle, color = 'primary', Icon }) {
  return (
    <div className="op-card p-5 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest">{title}</p>
        <p className={`text-2xl font-black text-${color}`}>{value}</p>
        {subtitle && <p className="text-[11px] text-textSecondary mt-0.5">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 shrink-0 rounded bg-${color}/10 border border-${color}/20 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}`} />
      </div>
    </div>
  );
}

// Simple bar chart using div widths
function SimpleBarChart({ data, valueKey, labelKey, color = '#0ea5e9', maxLabel = '' }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-24 text-textSecondary text-xs">No data available</div>
  );
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider w-28 shrink-0 truncate">{item[labelKey]}</span>
          <div className="flex-1 bg-sidebar rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${((item[valueKey] || 0) / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[11px] font-black text-textPrimary w-10 text-right shrink-0">{item[valueKey] || 0}{maxLabel}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsRecord() {
  const { animals, fetchAnimals } = useAnimalStore();
  const { treatments, fetchTreatments } = useTreatmentStore();
  const { mortalities, fetchMortalities } = useMortalityStore();
  const { sales, fetchSales } = useSaleStore();
  const { transactions, fetchTransactions } = useCashBookStore();
  const { farrowings, fetchFarrowings } = useFarrowingStore();
  const { breedings, fetchBreedings } = useBreedingStore();

  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchAnimals();
    fetchTreatments();
    fetchMortalities();
    fetchSales();
    fetchTransactions();
    fetchFarrowings();
    fetchBreedings();
  }, []);

  // ===== LIVESTOCK KPIs =====
  const livestockStats = useMemo(() => {
    const byStage = animals.reduce((acc, a) => {
      acc[a.lifecycleStage] = (acc[a.lifecycleStage] || 0) + 1;
      return acc;
    }, {});
    const stageData = Object.entries(byStage).map(([k, v]) => ({ stage: k, count: v }))
      .sort((a, b) => b.count - a.count);
    return {
      total: animals.length,
      active: animals.filter(a => !['Dead', 'Sold'].includes(a.lifecycleStage)).length,
      byStage: stageData
    };
  }, [animals]);

  // ===== BREEDING KPIs =====
  const breedingStats = useMemo(() => {
    const confirmed = (breedings || []).filter(b => b.pregnancyStatus === 'Confirmed Pregnant').length;
    const rate = breedings && breedings.length > 0
      ? Math.round((confirmed / breedings.length) * 100)
      : 0;
    return { total: breedings?.length || 0, confirmed, rate };
  }, [breedings]);

  // ===== FARROWING KPIs =====
  const farrowingStats = useMemo(() => {
    const totalLitters = farrowings.length;
    const totalAlive = farrowings.reduce((acc, f) => acc + (f.pigletsBornAlive || 0), 0);
    const totalStillborn = farrowings.reduce((acc, f) => acc + (f.stillbornPiglets || 0), 0);
    const avgLitter = totalLitters > 0 ? (totalAlive / totalLitters).toFixed(1) : 0;
    return { totalLitters, totalAlive, totalStillborn, avgLitter };
  }, [farrowings]);

  // ===== TREATMENT KPIs =====
  const treatmentStats = useMemo(() => {
    const recovered = treatments.filter(t => t.recoveryStatus === 'Recovered').length;
    const active = treatments.filter(t => ['Under Treatment', 'Under Observation', 'Critical'].includes(t.recoveryStatus)).length;
    const successRate = treatments.length > 0 ? Math.round((recovered / treatments.length) * 100) : 0;
    const byDiagnosis = treatments.reduce((acc, t) => {
      acc[t.diagnosis] = (acc[t.diagnosis] || 0) + 1;
      return acc;
    }, {});
    const diagData = Object.entries(byDiagnosis).map(([k, v]) => ({ name: k, count: v }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    return { total: treatments.length, recovered, active, successRate, diagData };
  }, [treatments]);

  // ===== MORTALITY KPIs =====
  const mortalityStats = useMemo(() => {
    const byStage = mortalities.reduce((acc, m) => {
      acc[m.lifecycleStage] = (acc[m.lifecycleStage] || 0) + 1;
      return acc;
    }, {});
    const byCause = mortalities.reduce((acc, m) => {
      acc[m.causeOfDeath] = (acc[m.causeOfDeath] || 0) + 1;
      return acc;
    }, {});
    const stageData = Object.entries(byStage).map(([k, v]) => ({ stage: k, count: v })).sort((a, b) => b.count - a.count);
    const causeData = Object.entries(byCause).map(([k, v]) => ({ cause: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 5);
    const mortalityRate = livestockStats.total > 0 ? ((mortalities.length / (livestockStats.total + mortalities.length)) * 100).toFixed(1) : 0;
    return { total: mortalities.length, stageData, causeData, mortalityRate };
  }, [mortalities, livestockStats]);

  // ===== FINANCIAL KPIs =====
  const financialStats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;
    const totalSaleRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const pendingSales = sales.filter(s => s.paymentStatus === 'Pending').reduce((acc, s) => acc + s.totalAmount, 0);
    return { income, expense, balance, totalSaleRevenue, pendingSales, totalSales: sales.length };
  }, [transactions, sales]);

  const handleExportCSV = () => {
    const reportData = [
      ['PINAKA Smart Farm Report', '', '', ''],
      ['Generated On:', new Date().toLocaleString(), '', ''],
      ['', '', '', ''],
      ['=== LIVESTOCK SUMMARY ===', '', '', ''],
      ['Total Animals', livestockStats.total, 'Active Animals', livestockStats.active],
      ['', '', '', ''],
      ['=== BREEDING ===', '', '', ''],
      ['Total Services', breedingStats.total, 'Confirmed Pregnant', breedingStats.confirmed],
      ['Conception Rate', `${breedingStats.rate}%`, '', ''],
      ['', '', '', ''],
      ['=== FARROWING ===', '', '', ''],
      ['Total Litters', farrowingStats.totalLitters, 'Total Live Piglets', farrowingStats.totalAlive],
      ['Avg Litter Size', farrowingStats.avgLitter, 'Stillborn', farrowingStats.totalStillborn],
      ['', '', '', ''],
      ['=== HEALTH ===', '', '', ''],
      ['Total Treatments', treatmentStats.total, 'Active Cases', treatmentStats.active],
      ['Recovery Rate', `${treatmentStats.successRate}%`, 'Mortality Count', mortalityStats.total],
      ['Mortality Rate', `${mortalityStats.mortalityRate}%`, '', ''],
      ['', '', '', ''],
      ['=== FINANCIALS ===', '', '', ''],
      ['Total Income', `Rs ${financialStats.income}`, 'Total Expenses', `Rs ${financialStats.expense}`],
      ['Net Balance', `Rs ${financialStats.balance}`, 'Sale Revenue', `Rs ${financialStats.totalSaleRevenue}`],
    ];

    const csvContent = reportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PINAKA_Farm_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-textPrimary uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" /> Reports & Analytics
            </h2>
            <p className="text-xs text-textSecondary mt-1">Central intelligence dashboard — livestock, health, reproductive, and financial analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="flex items-center gap-2 text-xs font-bold text-textSecondary hover:text-primary px-3 py-2 border border-borderDark rounded bg-sidebar hover:border-primary/40 transition-all">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-bold text-textSecondary hover:text-primary px-3 py-2 border border-borderDark rounded bg-sidebar hover:border-primary/40 transition-all">
              <Download className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* ===== SECTION 1: LIVESTOCK ===== */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-widest border-l-2 border-primary pl-2 flex items-center gap-2">
            <Database className="w-4 h-4" /> Livestock Overview
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard title="Total Herd" value={livestockStats.total} subtitle="All registered animals" color="primary" Icon={Database} />
            <ReportCard title="Active Animals" value={livestockStats.active} subtitle="Operational in farm" color="success" Icon={TrendingUp} />
            <ReportCard title="Sold" value={animals.filter(a => a.lifecycleStage === 'Sold').length} subtitle="Exited via sales" color="blueAccent" Icon={DollarSign} />
            <ReportCard title="Dead" value={animals.filter(a => a.lifecycleStage === 'Dead').length} subtitle="Mortality records" color="danger" Icon={Skull} />
          </div>
          <div className="op-card p-5">
            <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-4">Herd by Lifecycle Stage</p>
            <SimpleBarChart data={livestockStats.byStage} valueKey="count" labelKey="stage" color="#0ea5e9" />
          </div>
        </div>

        {/* ===== SECTION 2: BREEDING & FARROWING ===== */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-extrabold text-blueAccent uppercase tracking-widest border-l-2 border-blueAccent pl-2 flex items-center gap-2">
            <GitCompare className="w-4 h-4" /> Breeding & Farrowing Performance
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard title="Total Services" value={breedingStats.total} color="primary" Icon={GitCompare} />
            <ReportCard title="Conception Rate" value={`${breedingStats.rate}%`} subtitle={`${breedingStats.confirmed} confirmed`} color="success" Icon={TrendingUp} />
            <ReportCard title="Total Litters" value={farrowingStats.totalLitters} color="blueAccent" Icon={Sparkles} />
            <ReportCard title="Avg Litter Size" value={farrowingStats.avgLitter} subtitle={`${farrowingStats.totalAlive} total live`} color="warning" Icon={Sparkles} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="op-card p-5">
              <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-2">Litter Performance</p>
              <div className="flex flex-col gap-3 mt-4">
                {[
                  { label: 'Total Live Born', val: farrowingStats.totalAlive, color: 'success' },
                  { label: 'Stillborn', val: farrowingStats.totalStillborn, color: 'danger' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-sidebar rounded-lg border border-borderDark/40">
                    <span className="text-[11px] font-bold text-textSecondary">{label}</span>
                    <span className={`text-xl font-black text-${color}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="op-card p-5">
              <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-4">Pregnancy Status Breakdown</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Confirmed Pregnant', count: (breedings || []).filter(b => b.pregnancyStatus === 'Confirmed Pregnant').length, color: 'success' },
                  { label: 'Awaiting Scan', count: (breedings || []).filter(b => b.pregnancyStatus === 'Awaiting Scan').length, color: 'warning' },
                  { label: 'Not Pregnant', count: (breedings || []).filter(b => b.pregnancyStatus === 'Not Pregnant').length, color: 'danger' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-borderDark/40 last:border-0">
                    <span className="text-[11px] text-textSecondary">{label}</span>
                    <span className={`font-black text-${color}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION 3: HEALTH & TREATMENT ===== */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-extrabold text-warning uppercase tracking-widest border-l-2 border-warning pl-2 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" /> Health & Treatment Analytics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard title="Total Cases" value={treatmentStats.total} color="primary" Icon={Stethoscope} />
            <ReportCard title="Active Cases" value={treatmentStats.active} color="warning" Icon={Stethoscope} />
            <ReportCard title="Recovery Rate" value={`${treatmentStats.successRate}%`} subtitle={`${treatmentStats.recovered} recovered`} color="success" Icon={TrendingUp} />
            <ReportCard title="Mortality Rate" value={`${mortalityStats.mortalityRate}%`} subtitle={`${mortalityStats.total} deaths`} color="danger" Icon={Skull} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="op-card p-5">
              <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-4">Top Diagnoses</p>
              <SimpleBarChart data={treatmentStats.diagData} valueKey="count" labelKey="name" color="#f59e0b" />
            </div>
            <div className="op-card p-5">
              <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-4">Mortality by Cause</p>
              <SimpleBarChart data={mortalityStats.causeData} valueKey="count" labelKey="cause" color="#ef4444" />
            </div>
          </div>
        </div>

        {/* ===== SECTION 4: FINANCIAL ===== */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-extrabold text-success uppercase tracking-widest border-l-2 border-success pl-2 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Financial Summary
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard title="Net Balance" value={`₹${financialStats.balance.toLocaleString('en-IN')}`} color={financialStats.balance >= 0 ? 'success' : 'danger'} Icon={Wallet} />
            <ReportCard title="Total Income" value={`₹${financialStats.income.toLocaleString('en-IN')}`} color="success" Icon={TrendingUp} />
            <ReportCard title="Total Expenses" value={`₹${financialStats.expense.toLocaleString('en-IN')}`} color="danger" Icon={TrendingDown} />
            <ReportCard title="Pending Payments" value={`₹${financialStats.pendingSales.toLocaleString('en-IN')}`} subtitle={`${sales.filter(s => s.paymentStatus === 'Pending').length} sales pending`} color="warning" Icon={DollarSign} />
          </div>

          {/* Revenue vs Expense mini table */}
          <div className="op-card p-5">
            <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-4">Cash Flow Summary</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Income', val: financialStats.income, color: 'text-success' },
                { label: 'Expenses', val: financialStats.expense, color: 'text-danger' },
                { label: 'Net', val: financialStats.balance, color: financialStats.balance >= 0 ? 'text-success' : 'text-danger' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex flex-col items-center p-4 bg-sidebar border border-borderDark rounded-lg">
                  <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">{label}</p>
                  <p className={`text-xl font-black mt-1 ${color}`}>₹{val.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
