import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { Session } from './sessions';
import { setSession } from './sessionStore';
import { broadcastSessionState } from './ws-broadcast';

// POST /api/multiplayer/create
// Body: { playerName: string }
export async function POST(req: NextRequest) {
  const { playerName } = await req.json();
  const sessionId = uuidv4();
  const playerId = uuidv4();
  const session: Session = {
    players: [{ id: playerId, name: playerName, score: 0 }],
    state: 'waiting',
    round: 1,
    homes: [],
    guesses: {},
  };
  await setSession(sessionId, session);
  broadcastSessionState(sessionId);
  return NextResponse.json({ sessionId, playerId });
}
