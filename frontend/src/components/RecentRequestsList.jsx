import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronRightIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  ArrowRightIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';

export default function RecentRequestsList({ title, subtitle, items, type = 'leave' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const Icon = type === 'leave' ? DocumentTextIcon : CurrencyDollarIcon;

  const handleViewAll = () => {
    navigate(type === 'leave' ? '/leaves' : '/advances');
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6">
      
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 pb-4 border-b border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        <button 
          onClick={handleViewAll}
          className={`group flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {t('common.viewAll')}
          {isRTL ? (
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          ) : (
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </div>

      {/* List */}
      <div className="space-y-1">
        {!items || items.length === 0 ? (
          <div className="py-8 text-center bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">{t('common.noData')}</p>
          </div>
        ) : (
          items.slice(0, 5).map((item) => (
            <div 
              key={item._id} 
              onClick={() => navigate(type === 'leave' ? '/leaves' : '/advances')}
              className={`group flex justify-between items-center px-4 py-3 rounded-xl border border-gray-100 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer ${isRTL ? 'flex-row-reverse text-right' : ''}`}
            >
              {/* Left content */}
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  type === 'leave' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.user_name}</p>
                  <div className={`flex items-center gap-2 mt-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs text-gray-500">
                      {type === 'leave' ? t(`leaveTypes.${item.leave_type}`) : `${item.amount} DT`}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {type === 'leave' 
                        ? `${item.days} ${t('time.days')}` 
                        : new Date(item.created_at).toLocaleDateString(i18n.language)
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Right content */}
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <StatusBadge status={item.status} enhanced />
                <div className={`text-gray-400 group-hover:text-blue-600 transition-colors ${isRTL ? 'rotate-180' : ''}`}>
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
