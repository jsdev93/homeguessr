import React from 'react';
import { HomeItem } from '../types';

interface CluesOverlayProps {
  current: HomeItem | null;
}

const CluesOverlay: React.FC<CluesOverlayProps> = ({ current }) => {
  if (!current) return null;
  return (
    <>
      {/* Year Built on the left side, vertically centered */}
      <div className="fixed left-0 top-0 bottom-0 flex flex-col justify-center items-start z-50 pl-8">
        <div className="bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-gray-200 rounded-xl px-4 py-2 shadow-lg text-lg font-semibold font-mono">
          <span>Year Built:</span> <span className="ml-2 text-2xl font-bold">{current.yearBuilt}</span>
        </div>
      </div>
      {/* Other clues on the right side */}
      <div className="fixed top-8 right-8 z-40 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col gap-2 animate-fade-in">
        <div className="text-lg font-bold text-gray-700 dark:text-gray-200">Clues</div>
        <div className="font-mono text-base text-gray-600 dark:text-gray-300">
          Price: <span className="font-bold">${current.price.toLocaleString()}</span>
        </div>
        <div className="font-mono text-base text-gray-600 dark:text-gray-300">
          City: <span className="font-bold">{current.address.city}</span>
        </div>
        <div className="font-mono text-base text-gray-600 dark:text-gray-300">
          State: <span className="font-bold">{current.address.state}</span>
        </div>
      </div>
    </>
  );
};

export default CluesOverlay;
