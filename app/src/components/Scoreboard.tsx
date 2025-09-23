import React from 'react';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface ScoreboardProps {
  multiplayer: boolean;
  round: number;
  score: number;
  players: Player[];
  playerId?: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ multiplayer, round, score, players, playerId }) => (
  <>
    {multiplayer ? (
      <div className="fixed top-0 left-0 w-full flex justify-between z-50 p-8 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="text-4xl font-semibold bg-white/80 dark:bg-gray-900/90 dark:text-gray-100 rounded-2xl px-12 py-6 shadow border border-blue-100 dark:border-blue-900">
            Round: <span className="text-blue-500 dark:text-blue-300 font-bold">{round}</span>
          </div>
          <div className="flex gap-4 mt-2">
            {players.map(p => (
              <div key={p.id} className={"text-2xl font-bold px-6 py-2 rounded-xl " + (p.id === playerId ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200')}>
                {p.name} <span className="text-lg font-mono">({p.score} pts)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="fixed top-0 left-0 w-full flex justify-between z-50 p-8 pointer-events-none">
        <div className="text-4xl font-semibold bg-white/80 dark:bg-gray-900/90 dark:text-gray-100 rounded-2xl px-12 py-6 shadow border border-blue-100 dark:border-blue-900 pointer-events-auto">
          Round: <span className="text-blue-500 dark:text-blue-300 font-bold">{round}</span>
        </div>
        <div className="text-4xl font-semibold bg-white/80 dark:bg-gray-900/90 dark:text-gray-100 rounded-2xl px-12 py-6 shadow border border-green-100 dark:border-green-900 pointer-events-auto">
          Lifepoints: <span className="text-green-500 dark:text-green-300 font-bold">{score}</span> <span className="text-lg font-normal">(higher is better)</span>
        </div>
      </div>
    )}
  </>
);

export default Scoreboard;
