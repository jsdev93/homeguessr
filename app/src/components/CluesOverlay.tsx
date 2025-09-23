import React from 'react';
import { HomeItem } from '../types';

interface CluesOverlayProps {
  current: HomeItem | null;
}

const CluesOverlay: React.FC<CluesOverlayProps> = ({ current }) => {
  if (!current) return null;
  return (
    <div className="fixed top-8 right-8 z-40 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col gap-2 animate-fade-in">
      <div className="text-lg font-bold text-gray-700 dark:text-gray-200">Clues</div>
      <div className="font-mono text-base text-gray-600 dark:text-gray-300">
        Year Built: <span className="font-bold">{current.yearBuilt}</span>
      </div>
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
  );
};

export default CluesOverlay;
