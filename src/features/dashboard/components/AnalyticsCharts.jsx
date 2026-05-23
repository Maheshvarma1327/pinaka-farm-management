import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsCharts({ breedings, growers, mortalities }) {
  
  // 1. Breeding Success Data
  const breedingData = useMemo(() => {
    const success = breedings.filter(b => b.pregnancyResult === 'Pregnant Confirmed').length;
    const failed = breedings.filter(b => b.pregnancyResult === 'Failed' || b.pregnancyResult === 'Not Pregnant').length;
    const pending = breedings.filter(b => b.pregnancyResult === 'Pending').length;

    return [
      { name: 'Confirmed', value: success },
      { name: 'Failed', value: failed },
      { name: 'Pending', value: pending },
    ];
  }, [breedings]);

  // 2. Mortality Trend (Last 6 Months)
  const mortalityData = useMemo(() => {
    const months = {};
    const today = new Date();
    for(let i=5; i>=0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months[d.toLocaleString('default', { month: 'short' })] = 0;
    }

    mortalities.forEach(m => {
      if (m.deathDate) {
        const d = new Date(m.deathDate);
        const diffMonths = (today.getFullYear() - d.getFullYear()) * 12 + today.getMonth() - d.getMonth();
        if (diffMonths >= 0 && diffMonths < 6) {
          const monthName = d.toLocaleString('default', { month: 'short' });
          if(months[monthName] !== undefined) months[monthName]++;
        }
      }
    });

    return Object.keys(months).map(k => ({ month: k, count: months[k] }));
  }, [mortalities]);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b']; // Success, Danger, Warning

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-cardBg border border-borderDark p-3 rounded shadow-xl">
          <p className="text-[10px] font-bold text-textPrimary uppercase mb-1">{label || payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-xs font-mono" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
      
      {/* Chart 1: Breeding Performance */}
      <div className="op-card border border-borderDark rounded-xl p-4">
        <h3 className="text-xs font-black text-textPrimary uppercase tracking-widest mb-4 border-l-2 border-primary pl-2">
          Breeding Success Rate
        </h3>
        <div className="h-[250px] w-full">
          {breedings.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-textSecondary">No breeding data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breedingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {breedingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Mortality Trend */}
      <div className="op-card border border-borderDark rounded-xl p-4">
        <h3 className="text-xs font-black text-textPrimary uppercase tracking-widest mb-4 border-l-2 border-danger pl-2">
          Mortality Trend (6 Mo)
        </h3>
        <div className="h-[250px] w-full">
          {mortalities.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-textSecondary">No mortality data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mortalityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2a2a2a' }} />
                <Bar dataKey="count" name="Deaths" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
