import { NextRequest, NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';
import { Session } from './sessions';
import { getSession, setSession } from './sessionStore';
import { broadcastSessionState } from './ws-broadcast';

// POST /api/multiplayer/join
// Body: { sessionId: string, playerName: string }
export async function POST(req: NextRequest) {
  const { sessionId, playerName } = await req.json();
  const session: Session | null = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.players.length >= 2) {
    return NextResponse.json({ error: 'Session full' }, { status: 400 });
  }
  const playerId = uuidv4();
  session.players.push({ id: playerId, name: playerName, score: 0 });
  session.state = 'playing';
  await setSession(sessionId, session);
  broadcastSessionState(sessionId);
  return NextResponse.json({ sessionId, playerId });
}
