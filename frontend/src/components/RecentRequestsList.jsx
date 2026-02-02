import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronRightIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';

export default function RecentRequestsList({ title, subtitle, items, type = 'leave' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  // Choose Icon based on type
  const Icon = type === 'leave' ? DocumentTextIcon : CurrencyDollarIcon;

  // SEPARATE NAVIGATION LOGIC
  const handleViewAll = (e) => {
    e.preventDefault();
    if (type === 'leave') {
      navigate('/leaves');
    } else {
      navigate('/salary-advances');
    }
  };

  const handleRowClick = (item) => {
    // If you want to go to a specific detail page later, you can use item._id
    if (type === 'leave') {
      navigate('/leaves');
    } else {
      navigate('/salary-advances');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white/50 p-8 h-full flex flex-col font-sans">
      
      {/* HEADER */}
      <div className={`flex items-end justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">
              {subtitle}
            </p>
          )}
        </div>

        <button 
          onClick={handleViewAll}
          className={`group inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-slate-900 text-xs font-bold text-white hover:bg-indigo-600 transition-all duration-300 shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {t('common.viewAll')}
          {isRTL ? <ArrowLeftIcon className="h-3.5 w-3.5" /> : <ArrowRightIcon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 space-y-3">
        {!items || items.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
            <ClockIcon className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.noData')}</p>
          </div>
        ) : (
          items.slice(0, 5).map((item) => (
            <div 
              key={item._id} 
              onClick={() => handleRowClick(item)}
              className={`
                group relative flex justify-between items-center p-5 rounded-[1.5rem]
                hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer
                ${isRTL ? 'flex-row-reverse text-right' : ''}
              `}
            >
              <div className={`flex items-center gap-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {/* Icon Container */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100
                  group-hover:scale-110 transition-all duration-300
                  ${type === 'leave' ? 'text-indigo-600' : 'text-emerald-600'}
                `}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div>
                  <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.user_name}
                  </p>
                  <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[11px] font-black text-slate-500 uppercase">
                      {type === 'leave' ? t(`leaveTypes.${item.leave_type}`) : `${item.amount} DT`}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[11px] font-medium text-slate-400">
                      {type === 'leave' 
                        ? `${item.days} ${t('time.days')}` 
                        : new Date(item.created_at).toLocaleDateString(i18n.language)
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action */}
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <StatusBadge status={item.status} enhanced />
                <div className={`
                  w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 text-white 
                  opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100
                  transition-all duration-300
                  ${isRTL ? 'rotate-180' : ''}
                `}>
                  <ChevronRightIcon className="h-4 w-4" strokeWidth={3} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}