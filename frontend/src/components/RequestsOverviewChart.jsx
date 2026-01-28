import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RequestsOverviewChart({ title, subtitle, data = [], selectOptions = true }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // State for the filter
  const [timeRange, setTimeRange] = useState('month'); // 'week' or 'month'

  // Filter the data based on the selection
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (timeRange === 'week') {
      // Assuming data is sorted by date, take the last 7 entries
      return data.slice(-7);
    }
    return data; // Return full month data
  }, [data, timeRange]);

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Header Section */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-sm font-bold text-gray-400 mt-1">{subtitle}</p>
        </div>

        {selectOptions && (
          <div className="relative group">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-gray-50 border-0 rounded-2xl px-6 py-3 pr-10 text-xs font-black uppercase tracking-widest text-gray-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none cursor-pointer"
            >
              <option value="week">{t('common.thisWeek') || 'This Week'}</option>
              <option value="month">{t('common.thisMonth') || 'This Month'}</option>
            </select>
            <div className={`absolute pointer-events-none top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'}`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
            
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
            />
            
            <Tooltip 
              cursor={{ fill: '#F8FAFC', radius: 12 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border-0">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{payload[0].payload.name}</p>
                      <p className="text-sm font-black">{payload[0].value} {t('common.requests')}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Bar 
              dataKey="value" 
              fill="url(#barGradient)"
              radius={[10, 10, 10, 10]}
              barSize={timeRange === 'week' ? 32 : 16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}