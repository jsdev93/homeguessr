import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from '../sessionStore';
import { broadcastSessionState } from '../ws-broadcast';

// POST /api/multiplayer/leave
// Body: { sessionId: string, playerId: string }
export async function POST(req: NextRequest) {
  const { sessionId, playerId } = await req.json();
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  // Remove player from session
  session.players = session.players.filter((p: any) => p.id !== playerId);
  // Optionally: clear guesses for this player
  if (session.guesses) delete session.guesses[playerId];
  // Optionally: end session if no players left
  if (session.players.length === 0) {
    session.state = 'finished';
  }
  await setSession(sessionId, session);
  broadcastSessionState(sessionId);
  return NextResponse.json({ ok: true });
}
