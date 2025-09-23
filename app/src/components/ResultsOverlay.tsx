import React from 'react';

interface ResultsOverlayProps {
  score: number;
  round: number;
  totalRounds: number;
}

const ResultsOverlay: React.FC<ResultsOverlayProps> = ({ score, round, totalRounds }) => {
  if (round < totalRounds) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-12 text-center flex flex-col gap-6">
        <div className="text-4xl font-bold text-green-700 dark:text-green-300">Game Over!</div>
        <div className="text-2xl font-mono text-gray-800 dark:text-gray-200">Final Score: <span className="font-bold">{score}</span></div>
        <button className="mt-8 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition" onClick={() => window.location.reload()}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export default ResultsOverlay;
