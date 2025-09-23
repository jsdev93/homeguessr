import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from './sessionStore';
import { broadcastSessionState } from './ws-broadcast';
import itemsRaw from '../../../../public/items.json';
const items: any[] = Array.isArray(itemsRaw) ? itemsRaw : (itemsRaw.default || []);

// POST /api/multiplayer/advance
// Body: { sessionId: string }
export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  // Pick a random home for the next round
  const randomIdx = Math.floor(Math.random() * items.length);
  const home = items[randomIdx];
  session.homes.push(home);
  session.round += 1;
  session.guesses = {};
  await setSession(sessionId, session);
  broadcastSessionState(sessionId);
  return NextResponse.json({ home });
}
