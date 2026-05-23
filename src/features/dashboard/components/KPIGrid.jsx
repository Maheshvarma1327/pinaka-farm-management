import React from 'react';
import { Database, Activity, Flame, Award, Heart, Shield, Skull, TrendingUp, DollarSign, Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function KPIGrid({ kpis }) {
  const cards = [
    { label: 'Total Active Animals', value: kpis.totalActive, Icon: Database, color: 'textPrimary' },
    { label: 'Pregnant Sows', value: kpis.pregnantSows, Icon: Activity, color: 'success' },
    { label: 'Sows In Heat', value: kpis.sowsInHeat, Icon: Flame, color: 'danger' },
    { label: 'Breeding Ready Boars', value: kpis.breedingReadyBoars, Icon: Award, color: 'primary' },
    { label: 'Active Litters', value: kpis.activeLitters, Icon: Heart, color: 'info' },
    { label: 'Nursing Piglets', value: kpis.nursingPiglets, Icon: Heart, color: 'info', animate: true },
    { label: 'Weaning Due Soon', value: kpis.weaningDue, Icon: Clock, color: 'warning' },
    { label: 'Under Treatment', value: kpis.underTreatment, Icon: Shield, color: 'danger' },
    { label: 'Vaccinations Due', value: kpis.vaccinationsDue, Icon: AlertTriangle, color: 'warning' },
    { label: 'Mortality (This Month)', value: kpis.mortalityThisMonth, Icon: Skull, color: 'textSecondary' },
    { label: 'Sold Animals', value: kpis.soldAnimals, Icon: DollarSign, color: 'success' },
    { label: 'Farm Growth Rate', value: kpis.growthRate, Icon: TrendingUp, color: 'success' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="op-card p-4 flex flex-col justify-between group hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-textSecondary uppercase tracking-widest font-black leading-tight max-w-[80%]">
              {card.label}
            </span>
            <div className={`w-8 h-8 rounded bg-${card.color}/10 border border-${card.color}/20 flex items-center justify-center shrink-0`}>
              <card.Icon className={`w-4 h-4 text-${card.color} ${card.animate ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <h3 className={`text-2xl font-black text-${card.color}`}>{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
