import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData';
import KPIGrid from '../features/dashboard/components/KPIGrid';
import LifecycleFlow from '../features/dashboard/components/LifecycleFlow';
import AlertsPanel from '../features/dashboard/components/AlertsPanel';
import ActivityFeed from '../features/dashboard/components/ActivityFeed';
import AnalyticsCharts from '../features/dashboard/components/AnalyticsCharts';
import QuickActions from '../features/dashboard/components/QuickActions';
import { Activity } from 'lucide-react';

export default function Dashboard() {
  const { 
    loading, 
    kpis, 
    alerts, 
    activityFeed,
    breedings, 
    growers, 
    mortalities, 
    treatments 
  } = useDashboardData();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <Activity className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-xs font-black uppercase tracking-widest text-textSecondary">Syncing Farm Operations...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col max-w-[1600px] mx-auto pb-10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderDark/60 pb-3.5 mb-6 no-print">
          <div>
            <h2 className="text-base font-black tracking-wide text-textPrimary uppercase">
              Farm Command Center
            </h2>
            <p className="text-[10px] text-textSecondary uppercase tracking-widest mt-1">
              Real-time operational dashboard & livestock lifecycle analytics
            </p>
          </div>
        </div>

        {/* 1. KPI Grid */}
        <KPIGrid kpis={kpis} />

        {/* 2. Lifecycle Pipeline */}
        <LifecycleFlow kpis={kpis} />

        {/* 3. Alerts & Activity Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <AlertsPanel alerts={alerts} />
          <ActivityFeed feed={activityFeed} />
        </div>

        {/* 4. Analytics Charts */}
        <AnalyticsCharts breedings={breedings} growers={growers} mortalities={mortalities} />

        {/* 5. Quick Actions */}
        <QuickActions />

      </div>
    </MainLayout>
  );
}
