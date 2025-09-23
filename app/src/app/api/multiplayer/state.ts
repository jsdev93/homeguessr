import { NextRequest, NextResponse } from 'next/server';

import { getSession } from './sessionStore';

// POST /api/multiplayer/state
// Body: { sessionId: string }
export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  return NextResponse.json(session);
}
