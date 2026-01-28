import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ hasFilters, onResetFilters }) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
        <UserGroupIcon className="h-full w-full" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasFilters ? t('employees.noResults') : t('employees.noEmployees')}
      </h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        {hasFilters 
          ? t('employees.adjustFilters') 
          : t('employees.getStarted')
        }
      </p>
      {hasFilters && (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {t('employees.clearFilters')}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
