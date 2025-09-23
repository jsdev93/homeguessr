"use client";
import React, { useState } from 'react';
import Game from '../components/Game';

const RULES = [
  'Guess the location of the home based on images and clues.',
  'You have 60 seconds per round.',
  'Score points for accuracy and speed.',
  'Play solo or challenge friends in multiplayer mode.'
];

export default function HomePage() {
  const [playing, setPlaying] = useState(false);
  const handlePlay = () => {
    setPlaying(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-yellow-50">
      {!playing && (
        <>
          <h1 className="text-5xl font-extrabold mb-8 text-blue-700">Homeguessr</h1>
          <div className="bg-white/80 rounded-xl shadow-lg p-8 mb-8 max-w-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Rules</h2>
            <ul className="list-disc pl-6 text-lg text-gray-700">
              {RULES.map((rule, i) => <li key={i}>{rule}</li>)}
            </ul>
          </div>
          <div className="flex gap-6">
            <button
              className="px-8 py-4 bg-blue-600 text-white rounded-xl shadow font-bold text-xl hover:bg-blue-700 transition-all duration-150"
              onClick={handlePlay}
            >
              Play
            </button>
            <a
              href="/multiplayer"
              className="px-8 py-4 bg-green-600 text-white rounded-xl shadow font-bold text-xl hover:bg-green-700 transition-all duration-150"
            >
              Multiplayer
            </a>
          </div>
        </>
      )}
      {playing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <Game />
        </div>
      )}
    </div>
  );
}
