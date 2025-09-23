import React from 'react';
import { ZipMarker } from '../types';

interface MapOverlayProps {
  zipMarkers: ZipMarker[];
  onGuess: (zip: string) => void;
  guessedZip: string | null;
}

const MapOverlay: React.FC<MapOverlayProps> = ({ zipMarkers, onGuess, guessedZip }) => {
  return (
    <div className="fixed bottom-8 left-8 z-40 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 animate-fade-in">
      <div className="text-lg font-bold mb-2 text-gray-700 dark:text-gray-200">Map</div>
      <div className="flex flex-wrap gap-2">
        {zipMarkers.map((marker) => (
          <button
            key={marker.zip}
            className={`px-4 py-2 rounded-lg font-mono text-base border-2 ${guessedZip === marker.zip ? 'border-green-500 bg-green-100 dark:bg-green-900' : 'border-gray-300 bg-gray-100 dark:bg-gray-800'}`}
            onClick={() => onGuess(marker.zip)}
            disabled={!!guessedZip}
          >
            {marker.zip}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapOverlay;
