"use client";
import React, { useEffect, useState, useRef } from 'react';
import { HomeItem, ZipMarker } from '../types';
import Gallery from './Gallery';
import Clues from './Clues';
import Map from './Map';
import { useCountdown } from './useCountdown';


const fetchRandomItem = async (): Promise<HomeItem> => {
  const res = await fetch('/api/random-item');
  if (!res.ok) throw new Error('Failed to fetch item');
  return res.json();
};



interface GameProps {
  sessionId?: string;
  playerId?: string;
  multiplayer?: boolean;
}

const Game: React.FC<GameProps> = ({ sessionId, playerId, multiplayer }) => {
  // State declarations (move all to top)
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(2000);
  const [gameOver, setGameOver] = useState(false);
  const [guessedZip, setGuessedZip] = useState<string | null>(null);
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [current, setCurrent] = useState<HomeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [allZips, setAllZips] = useState<ZipMarker[]>([]);
  const [players, setPlayers] = useState<{id:string,name:string,score:number}[]>([]);
  const [sessionState, setSessionState] = useState<import('../types').SessionState | null>(null);
  const wsRef = useRef<WebSocket|null>(null);
  const [roundTimer, setRoundTimer] = useState<number>(30);
  const [countdown, setCountdown] = useState<number | null>(null);
  // Remove player from session on tab close
  // Start/reset round timer on new round
  useEffect(() => {
    setRoundTimer(30);
  }, [round]);

  // Countdown effect for round timer
  useEffect(() => {
    if (guessedZip || gameOver) return;
    if (roundTimer === 0) {
      // Time's up: subtract 500 lifepoints and auto-next round
      setScore((s) => {
        const newScore = s - 500;
        if (newScore <= 0) setGameOver(true);
        return newScore;
      });
      // Show correct location by setting guessedZip to correct zip
      if (current && current.address && current.address.zipcode) {
        setGuessedZip(current.address.zipcode);
      } else {
        setGuessedZip(''); // fallback
      }
      setCountdown(5); // Show 5s countdown before next round
      return;
    }
    const timer = setTimeout(() => setRoundTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [roundTimer, guessedZip, gameOver, current]);

  // Remove player from session on tab close
  useEffect(() => {
    if (!multiplayer || !sessionId || !playerId) return;
    const handleUnload = () => {
      navigator.sendBeacon('/api/multiplayer/leave', JSON.stringify({ sessionId, playerId }));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [multiplayer, sessionId, playerId]);
  // ...existing code...


  // Load all zips from zips.json and map to lat/lng using items.json
  useEffect(() => {
    Promise.all([
      import('../../data/zips.json'),
      import('../../data/items.json')
    ]).then(([zipsMod, itemsMod]) => {
      const zipsArr = (zipsMod.default || zipsMod) as string[];
  const itemsArr = (itemsMod.default || itemsMod) as import('../types').HomeItem[];
      // Build a lookup for zip -> {lat, lng}
      const zipToLatLng: Record<string, { lat: number, lng: number }> = {};
      for (const item of itemsArr) {
        if (item.address && item.address.zipcode && typeof item.latitude === 'number' && typeof item.longitude === 'number') {
          const zip = item.address.zipcode;
          // Only set if not already set (first occurrence)
          if (!zipToLatLng[zip]) {
            zipToLatLng[zip] = { lat: item.latitude, lng: item.longitude };
          }
        }
      }
      // Map zips to ZipMarker, only if we have lat/lng for that zip
      const zipMarkers = zipsArr
        .map(zip => zipToLatLng[zip] ? { zip, lat: zipToLatLng[zip].lat, lng: zipToLatLng[zip].lng } : null)
        .filter(Boolean) as ZipMarker[];
      setAllZips(zipMarkers);
    });
  }, []);

  // Fetch a random item
  const loadRandomItem = async () => {
    setLoading(true);
    try {
      const item = await fetchRandomItem();
      setCurrent(item);
    } catch {
      setCurrent(null);
    }
    setLoading(false);
  };


  // Multiplayer: connect to websocket and sync state
  useEffect(() => {
    if (!multiplayer || !sessionId || !playerId) {
      loadRandomItem();
      return;
    }
    // Connect to websocket
  const ws = new window.WebSocket('ws://192.168.0.255:3003');
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', sessionId, playerId }));
    };
    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'state' && msg.session) {
          console.log('[WS] Received session:', msg.session);
          console.log('[WS] session.homes:', msg.session.homes);
          setSessionState(msg.session);
          setPlayers(msg.session.players);
          setRound(msg.session.round);
          // If no home yet, trigger first round
          if ((!msg.session.homes || msg.session.homes.length === 0) && msg.session.players.length === 2 && msg.session.state === 'playing') {
            console.log('[WS] Triggering /api/multiplayer/advance for session', sessionId);
            const res = await fetch('/api/multiplayer/advance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId })
            });
            const data = await res.json().catch(() => ({}));
            console.log('[WS] /api/multiplayer/advance response:', res.status, data);
            // Optimistically set current and loading=false if home is returned
            if (data && data.home) {
              setCurrent({ ...data.home });
              setLoading(false);
            }
            return;
          }
          // Debug: log homes before setting current
          console.log('[WS] homes before setCurrent:', msg.session.homes);
          if (msg.session.homes && msg.session.homes.length > 0) {
            // Always set current to a new object reference to force re-render
            setCurrent({ ...msg.session.homes[msg.session.homes.length-1] });
          }
          // Always set loading to false after processing state
          setLoading(false);
          // Set guesses
          setGuessedZip(msg.session.guesses[playerId] || null);
          if (msg.session.state === 'finished') setGameOver(true);
        }
      } catch (err) {
        console.error('[WS] Error parsing message:', err, event.data);
      }
    };
    return () => { ws.close(); };
  }, [multiplayer, sessionId, playerId]);


  // Find ZipMarker by zip
  const getZipMarker = (zip: string | null): ZipMarker | undefined => {
    if (!zip) return undefined;
    return allZips.find(z => z.zip === zip);
  };

  // Haversine formula for distance in miles
  function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }


  // Called when user clicks a pin (selects a zip)
  const handleSelectZip = (zip: string) => {
    if (guessedZip) return;
    setSelectedZip(zip);
  };


  // Called when user clicks submit guess
  const handleGuess = () => {
    if (guessedZip || !current || !selectedZip) return;
    if (multiplayer && sessionId && playerId) {
      // Send guess to backend
      fetch('/api/multiplayer/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerId, zip: selectedZip })
      });
    } else {
      setGuessedZip(selectedZip);
      // Calculate penalty
      const guess = getZipMarker(selectedZip);
      const correct = getZipMarker(current.address.zipcode);
      if (guess && correct) {
        const dist = getDistanceMiles(guess.lat, guess.lng, correct.lat, correct.lng);
        const penalty = Math.round(dist / 5);
        setScore((s) => {
          const newScore = s - penalty;
          if (newScore <= 0) setGameOver(true);
          return newScore;
        });
      }
      // Start countdown for next round
      setCountdown(5);
    }
  };


  // Modular auto-next-round countdown effect
  const nextRound = () => {
    setGuessedZip(null);
    setSelectedZip(null);
    if (multiplayer && sessionId) {
      fetch('/api/multiplayer/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } else {
      setRound((r) => r + 1);
      loadRandomItem();
    }
  };
  useCountdown(countdown, nextRound, setCountdown);

  // Removed unused variable isCorrect

  // Debug: log current before loading check
  console.log('[RENDER] current:', current);
  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full text-4xl text-red-600 dark:text-red-400 font-bold bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        Game Over!<br />
        <span className="mt-4 text-3xl text-gray-700 dark:text-gray-200 font-mono">Round ended: <span className="font-bold">{round}</span></span>
        <button
          className="mt-12 px-16 py-6 bg-gradient-to-r from-blue-500 to-green-400 dark:from-blue-900 dark:to-green-800 text-white rounded-full hover:from-blue-600 hover:to-green-500 dark:hover:from-blue-800 dark:hover:to-green-700 shadow-lg text-3xl font-semibold transition"
          onClick={() => { setScore(2000); setRound(1); setGameOver(false); setGuessedZip(null); loadRandomItem(); }}
        >
          Restart Game
        </button>
      </div>
    );
  }
  if (loading || !current)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-2xl text-gray-400 animate-pulse">
        Loading home...
      </div>
    );

  return (
    <>
      {/* Multiplayer player list and scores */}
      {multiplayer && (
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
      )}
      {/* Single player round/score */}
      {!multiplayer && (
        <div className="fixed top-0 left-0 w-full flex justify-between z-50 p-8 pointer-events-none">
          <div className="text-4xl font-semibold bg-white/80 dark:bg-gray-900/90 dark:text-gray-100 rounded-2xl px-12 py-6 shadow border border-blue-100 dark:border-blue-900 pointer-events-auto">
            Round: <span className="text-blue-500 dark:text-blue-300 font-bold">{round}</span>
          </div>
          <div className="text-4xl font-semibold bg-white/80 dark:bg-gray-900/90 dark:text-gray-100 rounded-2xl px-12 py-6 shadow border border-green-100 dark:border-green-900 pointer-events-auto">
            Lifepoints: <span className="text-green-500 dark:text-green-300 font-bold">{score}</span> <span className="text-lg font-normal">(higher is better)</span>
          </div>
        </div>
      )}
  <div className="relative w-screen h-full bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 overflow-hidden pb-12">
        <div className="absolute inset-0 z-10">
          <Gallery images={current.images} />
          <div className="absolute bottom-8 left-8 z-30 w-[32vw] max-w-xl min-w-[320px]">
            <Map
              zips={allZips}
              onGuess={handleSelectZip}
              guessedZip={guessedZip}
              correctZip={current.address.zipcode}
              homeLat={current.latitude}
              homeLng={current.longitude}
              darkMode={true}
              selectedZip={selectedZip}
              disabled={!!guessedZip}
            />
          </div>
          <div className="absolute top-8 right-8 z-30">
            <Clues yearBuilt={current.yearBuilt} price={current.price} />
          </div>
        </div>
        {/* Overlay guess button above all UI */}
        {/* Timer and guess button */}
        {!guessedZip && (
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
        )}
        {/* Show correct location and countdown after time runs out */}
        {guessedZip && countdown !== null && roundTimer === 0 && current && (
          <div className="fixed bottom-8 right-8 z-50 px-12 py-8 bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 rounded-2xl shadow-lg text-4xl font-bold animate-fade-in flex flex-col items-end gap-4">
            <div>
              Time&apos;s up! The correct location was <span className="font-mono text-red-600 dark:text-red-300">{current.address.zipcode}</span>.
            </div>
            <div>
              Next round in {countdown}...
            </div>
          </div>
        )}
        {/* Show countdown after guess is submitted */}
        {guessedZip && countdown !== null && (
          <div className="fixed bottom-8 right-8 z-50 px-12 py-8 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded-2xl shadow-lg text-4xl font-bold animate-fade-in">
            Next round in {countdown}...
          </div>
        )}


        {/* Multiplayer: waiting for other player message */}
        {multiplayer && guessedZip && sessionState && sessionState.players.length === 2 && Object.keys(sessionState.guesses).length < sessionState.players.length && (
          <div className="absolute bottom-8 right-8 z-40 text-3xl font-bold flex flex-col items-end gap-6 animate-fade-in bg-white/80 dark:bg-gray-900/90 rounded-2xl px-12 py-6 shadow border border-blue-100 dark:border-blue-900">
            Waiting for other player to guess...
          </div>
        )}

        {/* Multiplayer: show results for both players when both have guessed */}
        {multiplayer && guessedZip && sessionState && sessionState.players.length === 2 && Object.keys(sessionState.guesses).length === 2 && (
          <div className="absolute bottom-8 right-8 z-40 text-3xl font-bold flex flex-col items-end gap-6 animate-fade-in bg-white/80 dark:bg-gray-900/90 rounded-2xl px-12 py-6 shadow border border-green-100 dark:border-green-900">
            {sessionState.players.map((p: import('../types').Player) => {
              const playerGuess = sessionState.guesses[p.id];
              const guessMarker = getZipMarker(playerGuess);
              const correctMarker = getZipMarker(current.address.zipcode);
              if (!guessMarker || !correctMarker) return null;
              const dist = getDistanceMiles(guessMarker.lat, guessMarker.lng, correctMarker.lat, correctMarker.lng);
              const penalty = Math.round(dist / 4);
              return (
                <div key={p.id} className={p.id === playerId ? "text-blue-600 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}>
                  {p.name}: {playerGuess} — {dist.toFixed(1)} miles away, +{penalty} pts
                </div>
              );
            })}
            <button
              className="mt-6 px-20 py-8 bg-gradient-to-r from-blue-500 to-green-400 dark:from-blue-900 dark:to-green-800 text-white rounded-full hover:from-blue-600 hover:to-green-500 dark:hover:from-blue-800 dark:hover:to-green-700 shadow-lg text-4xl font-semibold transition"
              onClick={nextRound}
            >
              Next Home
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Game;
