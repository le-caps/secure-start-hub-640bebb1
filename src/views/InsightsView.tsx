import React from 'react';
import { Deal } from '@/types';
import { formatStageName } from '@/lib/stageFormatter';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, CartesianGrid 
} from 'recharts';
import { Activity, AlertTriangle, PauseCircle, ArrowRight } from 'lucide-react';

interface InsightsViewProps {
  deals: Deal[];
  onSelectDeal: (id: string) => void;
}

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-2 rounded shadow-sm text-xs z-50">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-gray-500 dark:text-gray-400">
          {prefix}{payload[0].value.toLocaleString()}{suffix}
        </p>
      </div>
    );
  }
  return null;
};

export const InsightsView: React.FC<InsightsViewProps> = ({ deals, onSelectDeal }) => {
  const totalInactiveValue = deals
    .filter(d => d.daysInactive > 7)
    .reduce((sum, d) => sum + d.amount, 0);
  
  const avgDaysInStage = Math.round(
    deals.reduce((sum, d) => sum + d.daysInStage, 0) / (deals.length || 1)
  );

  const highPriorityCount = deals.filter(d => d.priority === 'high').length;

  const dealsByStage = deals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + deal.amount;
    return acc;
  }, {} as Record<string, number>);

  const valueByStageData = Object.entries(dealsByStage).map(([stage, value]) => ({
    name: formatStageName(stage),
    value: value,
  }));

  const inactiveDaysByStage = deals.reduce((acc, deal) => {
    if (!acc[deal.stage]) acc[deal.stage] = { totalDays: 0, count: 0 };
    acc[deal.stage].totalDays += deal.daysInactive;
    acc[deal.stage].count += 1;
    return acc;
  }, {} as Record<string, { totalDays: number, count: number }>);

  const bottleneckData = Object.entries(inactiveDaysByStage).map(([stage, data]) => ({
    name: formatStageName(stage),
    avgInactive: Math.round(data.totalDays / data.count),
  }));

  const healthStats = {
    healthy: deals.filter(d => d.daysInactive <= 7).length,
    stalled: deals.filter(d => d.daysInactive > 7 && d.daysInactive <= 14).length,
    critical: deals.filter(d => d.daysInactive > 14).length,
  };

  const healthData = [
    { name: 'Healthy (<7d)', value: healthStats.healthy, color: '#6366f1' }, 
    { name: 'Stalled (7-14d)', value: healthStats.stalled, color: '#a5b4fc' }, 
    { name: 'Critical (>14d)', value: healthStats.critical, color: '#fb7185' }, 
  ];

  const highPriorityDeals = deals.filter(d => d.priority === 'high');

  const StatCard = ({ title, value, sub, icon: Icon, iconColor }: any) => (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-lg flex flex-col justify-between h-full shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <Icon size={18} className={iconColor} strokeWidth={2} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{sub}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto px-6 w-full">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Pipeline Insights</h2>
        </div>
      </div>
     
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Stalled Revenue"
          value={`$${totalInactiveValue.toLocaleString()}`}
          sub="Deals inactive > 7 days"
          icon={PauseCircle}
          iconColor="text-rose-500"
        />
        <StatCard 
          title="Avg. Deal Velocity"
          value={`${avgDaysInStage} Days`}
          sub="Average time in current stage"
          icon={Activity}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Attention Needed"
          value={highPriorityCount}
          sub="High priority active deals"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Value by Stage */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">Revenue at Risk by Stage</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueByStageData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }} barSize={20}>
                <CartesianGrid horizontal={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis 
                    type="number" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#1D4ED8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bottleneck Analysis */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-lg shadow-sm">
           <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">Bottleneck Analysis (Avg. Inactive Days)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottleneckData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6B7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <Tooltip content={<CustomTooltip suffix=" days" />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="avgInactive" radius={[4, 4, 0, 0]}>
                   {bottleneckData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgInactive > 14 ? '#fb7185' : '#818cf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Portfolio Health (Pie) */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-lg flex flex-col items-center shadow-sm">
           <div className="w-full mb-2">
             <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Deal Health Distribution</h3>
           </div>
           
           <div className="h-[220px] w-full flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={healthData}
                   cx="50%"
                   cy="50%"
                   innerRadius={70}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                   cornerRadius={4}
                   stroke="none"
                   startAngle={90}
                   endAngle={-270}
                 >
                   {healthData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
               </PieChart>
             </ResponsiveContainer>
             
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{deals.length}</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Total</span>
             </div>
           </div>
           <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
             {healthData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                   <div className="flex items-baseline gap-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-gray-400">({item.value})</span>
                   </div>
                </div>
             ))}
           </div>
        </div>

        {/* Priority Focus List */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-lg flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Priority Focus</h3>
            <span className="bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {highPriorityDeals.length}
            </span>
          </div>
          
          <div className="space-y-1 flex-1 overflow-y-auto max-h-[240px] pr-1">
            {highPriorityDeals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <p className="text-xs">No high priority deals.</p>
              </div>
            ) : (
              highPriorityDeals.map(deal => (
                <button 
                  key={deal.id} 
                  onClick={() => onSelectDeal(deal.id)}
                  className="w-full flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-md transition-colors group text-left border border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                >
                  <div className="overflow-hidden mr-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{deal.name}</p>
                    <p className="text-xs text-gray-500 truncate">{deal.companyName}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">${(deal.amount / 1000).toFixed(0)}k</p>
                      <p className="text-[10px] text-rose-600 font-medium">{deal.daysInactive}d</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
