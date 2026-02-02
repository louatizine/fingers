import { ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import StatusBadge from './StatusBadge';

export default function RecentActivityCard({ recentLeaves }) {
  const { t } = useTranslation()
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentActivity')}</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
          {t('common.viewAll')}
        </button>
      </div>

      {/* Recent Leaves List */}
      <div className="space-y-3">
        {recentLeaves?.slice(0, 4).map((leave) => (
          <div
            key={leave._id}
            className="group p-4 rounded-xl border border-gray-100 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                  {leave.leave_type}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {leave.start_date} → {leave.end_date}
                </p>
              </div>
              <StatusBadge status={leave.status} enhanced />
            </div>

            <div className="flex items-center text-xs text-gray-500 mt-1">
              <ClockIcon className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
              <span>{leave.days} {t('common.days')}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span>{t('leaves.submittedOn', { date: leave.submitted_date || leave.start_date })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notification */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-900">
              {t('notifications.policyUpdate')}
            </p>
            <p className="text-yellow-700 mt-1">
              {t('notifications.maternityPolicyUpdate')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
