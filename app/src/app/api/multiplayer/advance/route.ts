import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from '../sessionStore';
import redis from '../redis';
import { broadcastSessionState } from '../ws-broadcast';
import itemsRaw from '../../../../../data/items.json';

const items: any[] = Array.isArray(itemsRaw) ? itemsRaw : (itemsRaw.default || []);

// POST /api/multiplayer/advance
// Body: { sessionId: string }
// Simple Redis lock helper
async function acquireLock(lockKey: string, ttl = 2000): Promise<boolean> {
  const result = await redis.set(lockKey, 'locked', 'NX', 'PX', ttl);
  return result === 'OK';
}
async function releaseLock(lockKey: string) {
  await redis.del(lockKey);
}

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  const lockKey = `advance-lock:${sessionId}`;
  const gotLock = await acquireLock(lockKey, 2000);
  if (!gotLock) {
    // Could not acquire lock, just return the last home
    const session = await getSession(sessionId);
    const lastHome = session && session.homes.length > 0 ? session.homes[session.homes.length - 1] : null;
    return NextResponse.json({ home: lastHome });
  }
  try {
    const session = await getSession(sessionId);
    if (!session) {
      await releaseLock(lockKey);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.homes.length === 0 || (session.homes.length > 0 && Object.keys(session.guesses).length === 0)) {
      // Advance to next round
      const randomIdx = Math.floor(Math.random() * items.length);
      const home = items[randomIdx];
      session.homes.push(home);
      session.round = session.homes.length;
      session.guesses = {};
      await setSession(sessionId, session);
      broadcastSessionState(sessionId);
      await releaseLock(lockKey);
      return NextResponse.json({ home });
    } else {
      // Not ready to advance, just return the last home
      const lastHome = session.homes[session.homes.length - 1];
      await releaseLock(lockKey);
      return NextResponse.json({ home: lastHome });
    }
  } catch (err) {
    await releaseLock(lockKey);
    throw err;
  }
}
