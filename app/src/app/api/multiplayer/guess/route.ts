import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from '../sessionStore';

// POST /api/multiplayer/guess
// Body: { sessionId: string, playerId: string, zip: string }
export async function POST(req: NextRequest) {
  const { sessionId, playerId, zip } = await req.json();
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  session.guesses[playerId] = zip;
  await setSession(sessionId, session);
  return NextResponse.json({ ok: true });
}
