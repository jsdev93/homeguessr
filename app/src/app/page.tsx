import React from "react";
import Game from "../components/Game";

export default function Home() {
  return (
    <div className="font-sans min-h-screen h-screen w-full bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col items-center justify-center px-2 sm:px-0 overflow-hidden">
  <div className="w-full flex justify-center mb-8 flex-shrink-0 pt-8">
        <a
          href="/multiplayer"
          className="px-10 py-5 bg-gradient-to-r from-blue-500 to-green-400 dark:from-blue-900 dark:to-green-800 text-white rounded-full hover:from-blue-600 hover:to-green-500 dark:hover:from-blue-800 dark:hover:to-green-700 shadow-lg text-2xl font-semibold transition"
        >
          Play Multiplayer
        </a>
      </div>
      <h1 className="text-5xl sm:text-6xl font-extrabold mb-8 mt-2 tracking-tight text-center text-blue-700 drop-shadow-lg select-none flex-shrink-0">
        HomeGuessr
      </h1>
      <div className="w-full flex flex-col items-center justify-center gap-6 flex-grow overflow-hidden">
        <Game />
      </div>
    </div>
  );
}
