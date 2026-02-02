import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  RadialBarChart, RadialBar 
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#6366f1', '#94a3b8'];

/**
 * STYLE A: THE GLASS DONUT
 * Best for: Leave Request Distribution
 */
export function RequestsDonutChart({ title, subtitle, data = [] }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const totalValue = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] h-full flex flex-col">
      <div className={`mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{title}</h3>
        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">{subtitle || 'Status Overview'}</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8">
        <div className="relative w-full max-w-[200px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={10}>
                {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => active && payload?.length && (
                <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl text-[11px] font-bold">
                  {payload[0].name}: {payload[0].value}
                </div>
              )} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-slate-900 leading-none">{totalValue}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('attendance.total')}</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          {data.map((entry, index) => {
            const percentage = totalValue > 0 ? ((entry.value / totalValue) * 100).toFixed(0) : 0;
            return (
              <div key={entry.name} className={`flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-700">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-900">{entry.value}</span>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * STYLE B: THE DARK RADIAL
 * Best for: Salary Advance Metrics
 */
export function RequestsRadialChart({ title, subtitle, data = [] }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col h-full text-white overflow-hidden relative">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
      
      <div className={`mb-6 relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h3 className="text-xl font-black tracking-tight leading-none">{title}</h3>
        <p className="text-[10px] font-black text-indigo-400 mt-2 uppercase tracking-[0.2em]">{subtitle || 'Usage Metrics'}</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center relative z-10">
        <div className="w-full h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="110%" barSize={10} data={data} startAngle={180} endAngle={-180}>
              <RadialBar minAngle={15} background={{ fill: '#1e293b' }} clockWise dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3 w-full lg:w-48">
          {data.map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: item.fill || COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">{item.name}</span>
              </div>
              <span className="text-xs font-black text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}