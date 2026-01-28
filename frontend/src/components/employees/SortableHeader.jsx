import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useDirection } from '../../hooks/useDirection';

const SortableHeader = ({ label, sortKey, sortConfig, onSort }) => {
  const { isRTL } = useDirection();
  const isSorted = sortConfig.key === sortKey;
  
  return (
    <th 
      className={`px-6 py-4 bg-brand-surface border-b border-brand-border cursor-pointer transition-all duration-150 group hover:bg-brand-border/30 ${
        isRTL ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Fluent Typography: Tiny, Black weight, Spaced out */}
        <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] group-hover:text-brand-dark transition-colors">
          {label}
        </span>
        
        <div className="flex-shrink-0">
          {isSorted ? (
            sortConfig.direction === 'asc' ? (
              <ChevronUpIcon className="h-3.5 w-3.5 text-brand-primary stroke-[3px]" />
            ) : (
              <ChevronDownIcon className="h-3.5 w-3.5 text-brand-primary stroke-[3px]" />
            )
          ) : (
            /* Subtle ghost icon on hover to indicate interactability */
            <ChevronUpIcon className="h-3.5 w-3.5 text-brand-muted opacity-0 group-hover:opacity-40 transition-opacity duration-150 stroke-[3px]" />
          )}
        </div>
      </div>
      
      {/* Active Indicator Line (Optional Fluent UI touch) */}
      {isSorted && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary" />
      )}
    </th>
  );
};

export default SortableHeader;