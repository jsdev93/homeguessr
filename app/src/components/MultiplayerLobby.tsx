"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  name: string;
  score: number;
}
interface SessionState {
  players: Player[];
  state: string;
  round: number;
}

const MultiplayerLobby: React.FC = () => {
  const router = useRouter();
  const [mode, setMode] = useState<'lobby' | 'create' | 'join' | 'waiting' | 'starting'>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState('');
  const [sessionState, setSessionState] = useState<SessionState|null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting'|'connected'|'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket|null>(null);

  // Create a new game session
  const handleCreate = async () => {
    setError('');
    try {
      const res = await fetch('/api/multiplayer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.sessionId);
        setPlayerId(data.playerId);
        // Do not setMode('waiting') here
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch {
      setError('Network error');
    }
  };

  // Join an existing game session
  const handleJoin = async () => {
    setError('');
    try {
      const res = await fetch('/api/multiplayer/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerName }),
      });
      const data = await res.json();
      if (res.ok) {
        setPlayerId(data.playerId);
        // Do not setMode('waiting') here
      } else {
        setError(data.error || 'Failed to join session');
      }
    } catch {
      setError('Network error');
    }
  };

  // Set mode to 'waiting' only after both sessionId and playerId are set
  useEffect(() => {
    if (sessionId && playerId && (mode === 'create' || mode === 'join')) {
      setMode('waiting');
    }
  }, [sessionId, playerId, mode]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (mode !== 'waiting' || !sessionId || !playerId) return;
    setConnectionStatus('connecting');
  const ws = new window.WebSocket('ws://192.168.0.255:3003');
    wsRef.current = ws;
    ws.onopen = () => {
      setConnectionStatus('connected');
      ws.send(JSON.stringify({ type: 'subscribe', sessionId, playerId }));
      // After subscribing, send an 'update' to force a session state broadcast
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'update', sessionId, playerId }));
      }, 100);
    };
    ws.onclose = () => setConnectionStatus('disconnected');
    ws.onerror = () => setConnectionStatus('disconnected');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'state' && msg.session) {
          setSessionState(msg.session);
          if (msg.session.state === 'playing') {
            setMode('starting');
          }
        }
      } catch {}
    };
    return () => { ws.close(); };
  }, [mode, sessionId, playerId]);

  // Show game start indicator and transition
  useEffect(() => {
    if (mode === 'starting') {
      const timeout = setTimeout(() => {
        if (sessionId && playerId && playerName) {
          router.push(`/multiplayer/game?sessionId=${encodeURIComponent(sessionId)}&playerId=${encodeURIComponent(playerId)}&playerName=${encodeURIComponent(playerName)}`);
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [mode, sessionId, playerId, playerName, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {mode === 'lobby' && (
        <div className="flex flex-col gap-8 p-12 bg-white/80 dark:bg-gray-900/90 rounded-2xl shadow-xl">
          <h1 className="text-4xl font-bold mb-4">HomeGuessr Multiplayer</h1>
          <input
            className="px-6 py-4 rounded-lg border text-2xl"
            placeholder="Your Name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
          />
          <div className="flex gap-8 mt-4">
            <button
              className="px-10 py-6 bg-blue-500 text-white rounded-full text-2xl font-semibold hover:bg-blue-600"
              onClick={() => setMode('create')}
              disabled={!playerName}
            >
              Create Game
            </button>
            <button
              className="px-10 py-6 bg-green-500 text-white rounded-full text-2xl font-semibold hover:bg-green-600"
              onClick={() => setMode('join')}
              disabled={!playerName}
            >
              Join Game
            </button>
          </div>
        </div>
      )}
      {mode === 'create' && (
        <div className="flex flex-col gap-8 p-12 bg-white/80 dark:bg-gray-900/90 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Create Game</h2>
          <button
            className="px-10 py-6 bg-blue-500 text-white rounded-full text-2xl font-semibold hover:bg-blue-600"
            onClick={handleCreate}
          >
            Create
          </button>
          <button
            className="text-lg underline text-gray-500 mt-2"
            onClick={() => setMode('lobby')}
          >
            Back
          </button>
          {error && <div className="text-red-500 font-bold">{error}</div>}
        </div>
      )}
      {mode === 'join' && (
        <div className="flex flex-col gap-8 p-12 bg-white/80 dark:bg-gray-900/90 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Join Game</h2>
          <input
            className="px-6 py-4 rounded-lg border text-2xl"
            placeholder="Session ID"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
          />
          <button
            className="px-10 py-6 bg-green-500 text-white rounded-full text-2xl font-semibold hover:bg-green-600"
            onClick={handleJoin}
            disabled={!sessionId}
          >
            Join
          </button>
          <button
            className="text-lg underline text-gray-500 mt-2"
            onClick={() => setMode('lobby')}
          >
            Back
          </button>
          {error && <div className="text-red-500 font-bold">{error}</div>}
        </div>
      )}
      {mode === 'waiting' && (
        <div className="flex flex-col gap-8 p-12 bg-white/80 dark:bg-gray-900/90 rounded-2xl shadow-xl min-w-[350px]">
          <h2 className="text-3xl font-bold mb-4">Waiting for another player...</h2>
          <div className="flex flex-col gap-2 mb-2">
            <div className="text-xl">Share this Session ID:</div>
            <div className="text-3xl font-mono bg-gray-200 dark:bg-gray-800 px-8 py-4 rounded-xl select-all">{sessionId}</div>
            <button
              className="mt-2 px-4 py-2 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-lg text-lg font-mono"
              onClick={() => {navigator.clipboard.writeText(sessionId);}}
            >Copy Session ID</button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-lg font-semibold">Players:</div>
            <ul className="flex flex-col gap-1">
              {sessionState?.players?.map(p => (
                <li key={p.id} className={"flex items-center gap-2 text-xl " + (p.id === playerId ? 'font-bold text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200')}>
                  <span className="inline-block w-2 h-2 rounded-full " style={{background:p.id===playerId?'#3b82f6':'#a3a3a3'}}></span>
                  {p.name} <span className="text-xs text-gray-400">({p.score} pts)</span>
                </li>
              ))}
            </ul>
            <div className="text-sm text-gray-500 mt-2">{sessionState?.players?.length || 1}/2 joined</div>
          </div>
          <div className="flex flex-row gap-4 items-center mt-4">
            <span className="text-gray-500 text-sm">Connection:</span>
            <span className={connectionStatus==='connected' ? 'text-green-600' : connectionStatus==='connecting' ? 'text-yellow-600' : 'text-red-600'}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>
          <div className="text-lg text-gray-500">When both players have joined, the game will start automatically.</div>
        </div>
      )}
      {mode === 'starting' && (
        <div className="flex flex-col gap-8 p-12 bg-white/80 dark:bg-gray-900/90 rounded-2xl shadow-xl min-w-[350px] items-center">
          <h2 className="text-3xl font-bold mb-4 text-green-600 dark:text-green-300 animate-pulse">Game Starting!</h2>
          <div className="text-xl">Good luck, {playerName}!</div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerLobby;
