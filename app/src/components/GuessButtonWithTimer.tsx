import React from 'react';

interface GuessButtonWithTimerProps {
  guessedZip: string | null;
  roundTimer: number;
  handleGuess: () => void;
  selectedZip: string | null;
}

const GuessButtonWithTimer: React.FC<GuessButtonWithTimerProps> = ({ guessedZip, roundTimer, handleGuess, selectedZip }) => (
  !guessedZip && (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <div className="mb-2 px-8 py-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded-2xl shadow text-3xl font-bold animate-fade-in">
        Time left: {roundTimer}s
      </div>
      <button
        className="px-20 py-8 bg-gradient-to-r from-blue-500 to-green-400 dark:from-blue-900 dark:to-green-800 text-white rounded-full hover:from-blue-600 hover:to-green-500 dark:hover:from-blue-800 dark:hover:to-green-700 shadow-lg text-4xl font-semibold transition"
        onClick={handleGuess}
        disabled={!selectedZip || !!guessedZip}
      >
        Submit Guess
      </button>
    </div>
  )
);

export default GuessButtonWithTimer;
