import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
            </div>
            <div className="ml-4 space-y-2 flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="ml-4 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
            <div className="ml-4 space-y-2">
              <div className="h-6 bg-gray-300 rounded w-20"></div>
            </div>
            <div className="ml-4 space-y-2">
              <div className="h-6 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
