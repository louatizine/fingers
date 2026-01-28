import React from 'react';
import { XMarkIcon, ArrowDownTrayIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../hooks/useDirection';

const BulkActions = ({ selectedCount, onDeactivate, onExport, onClearSelection }) => {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  
  return (
    <div className={`
      bg-white border border-brand-border shadow-premium rounded-item p-3 
      flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300
      relative overflow-hidden
    `}>
      {/* Power Apps Left-Accent Bar */}
      <div className={`absolute inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-1 bg-brand-primary`} />

      <div className={`flex items-center ${isRTL ? 'mr-4 flex-row-reverse' : 'ml-4'}`}>
        <span className="text-sm font-black text-brand-dark tracking-tight">
          {selectedCount} <span className="text-brand-muted font-bold ml-1">{t('employees.selected')}</span>
        </span>
      </div>

      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Deactivate Button - Hollow Red Style */}
        <button
          onClick={onDeactivate}
          className="inline-flex items-center px-4 py-2 border-2 border-status-error/20 text-[10px] font-black uppercase tracking-widest rounded-item text-status-error hover:bg-status-error hover:text-white transition-all duration-200"
        >
          <NoSymbolIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} stroke-[2.5px]`} />
          {t('actions.deactivate')}
        </button>

        {/* Export Button - Standard Fluent Style */}
        <button
          onClick={onExport}
          className="inline-flex items-center px-4 py-2 border-2 border-brand-border text-[10px] font-black uppercase tracking-widest rounded-item text-brand-dark hover:bg-brand-surface transition-all duration-200"
        >
          <ArrowDownTrayIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} stroke-[2.5px]`} />
          {t('actions.export')}
        </button>

        <div className="w-px h-6 bg-brand-border mx-1" />

        {/* Clear Button */}
        <button
          onClick={onClearSelection}
          className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-item transition-all"
          title={t('common.clearSelection')}
        >
          <XMarkIcon className="h-5 w-5 stroke-[2px]" />
        </button>
      </div>
    </div>
  );
};

export default BulkActions;