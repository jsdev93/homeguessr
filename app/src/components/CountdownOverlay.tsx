import React from 'react';

import { HomeItem } from '../types';

interface CountdownOverlayProps {
  guessedZip: string | null;
  countdown: number | null;
  roundTimer: number;
  current: HomeItem | null;
}

const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ guessedZip, countdown, roundTimer, current }) => {
  if (guessedZip && countdown !== null && roundTimer === 0 && current) {
    return (
      <div className="fixed bottom-8 right-8 z-50 px-12 py-8 bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 rounded-2xl shadow-lg text-4xl font-bold animate-fade-in flex flex-col items-end gap-4">
        <div>
          Time&apos;s up! The correct location was <span className="font-mono text-red-600 dark:text-red-300">{current.address.zipcode}</span>.
        </div>
        <div>
          Next round in {countdown}...
        </div>
      </div>
    );
  }
  if (guessedZip && countdown !== null) {
    return (
      <div className="fixed bottom-8 right-8 z-50 px-12 py-8 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded-2xl shadow-lg text-4xl font-bold animate-fade-in">
        Next round in {countdown}...
      </div>
    );
  }
  return null;
};

export default CountdownOverlay;
