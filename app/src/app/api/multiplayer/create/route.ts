import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { setSession } from '../sessionStore';

// POST /api/multiplayer/create
// Body: { playerName: string }
export async function POST(req: NextRequest) {
  const { playerName } = await req.json();
  const sessionId = uuidv4();
  const playerId = uuidv4();
  const session = {
    players: [{ id: playerId, name: playerName, score: 0 }],
    state: 'waiting' as const,
    round: 1,
    homes: [],
    guesses: {},
  };
  await setSession(sessionId, session);
  return NextResponse.json({ sessionId, playerId });
}
