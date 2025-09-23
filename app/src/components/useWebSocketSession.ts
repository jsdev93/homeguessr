import { useEffect, useRef } from 'react';

import { HomeItem, SessionState, Player } from '../types';

interface WebSocketSessionProps {
  multiplayer: boolean;
  sessionId: string;
  playerId: string;
  setSessionState: (session: SessionState) => void;
  setPlayers: (players: Player[]) => void;
  setRound: (round: number) => void;
  setCurrent: (item: HomeItem) => void;
  setLoading: (loading: boolean) => void;
  setGuessedZip: (zip: string | null) => void;
  setGameOver: (gameOver: boolean) => void;
}

export function useWebSocketSession({ multiplayer, sessionId, playerId, setSessionState, setPlayers, setRound, setCurrent, setLoading, setGuessedZip, setGameOver }: WebSocketSessionProps) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!multiplayer || !sessionId || !playerId) return;
    const ws = new window.WebSocket('ws://192.168.0.255:3003');
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', sessionId, playerId }));
    };
    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'state' && msg.session) {
          setSessionState(msg.session);
          setPlayers(msg.session.players);
          setRound(msg.session.round);
          if ((!msg.session.homes || msg.session.homes.length === 0) && msg.session.players.length === 2 && msg.session.state === 'playing') {
            const res = await fetch('/api/multiplayer/advance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId })
            });
            const data = await res.json().catch(() => ({}));
            if (data && data.home) {
              setCurrent({ ...data.home });
              setLoading(false);
            }
            return;
          }
          if (msg.session.homes && msg.session.homes.length > 0) {
            setCurrent({ ...msg.session.homes[msg.session.homes.length - 1] });
          }
          setLoading(false);
          setGuessedZip(msg.session.guesses[playerId] || null);
          if (msg.session.state === 'finished') setGameOver(true);
        }
      } catch (err) {
        console.error('[WS] Error parsing message:', err, event.data);
      }
    };
    return () => { ws.close(); };
  }, [multiplayer, sessionId, playerId, setSessionState, setPlayers, setRound, setCurrent, setLoading, setGuessedZip, setGameOver]);

  return wsRef;
}
