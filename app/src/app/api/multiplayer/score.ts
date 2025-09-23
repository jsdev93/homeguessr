import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from './sessionStore';
import itemsRaw from '../../../../public/items.json';

const items: any[] = Array.isArray(itemsRaw) ? itemsRaw : (itemsRaw.default || []);

// POST /api/multiplayer/score
// Body: { sessionId: string }
export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  // Only score if both players have guessed
  if (session.players.length < 2 || Object.keys(session.guesses).length < 2) {
    return NextResponse.json({ error: 'Not all players have guessed' }, { status: 400 });
  }
  const home = session.homes[session.homes.length - 1];
  const correctZip = home.address.zipcode;
  const correctLat = home.latitude;
  const correctLng = home.longitude;
  // Calculate penalty for each player
  for (const player of session.players) {
    const guessedZip = session.guesses[player.id];
    if (!guessedZip) continue;
    // Find lat/lng for guessed zip
    let guessLat = null, guessLng = null;
    for (const item of items) {
      if (item.address && item.address.zipcode === guessedZip) {
        guessLat = item.latitude;
        guessLng = item.longitude;
        break;
      }
    }
    if (guessLat !== null && guessLng !== null) {
      const dist = getDistanceMiles(guessLat, guessLng, correctLat, correctLng);
      const penalty = Math.round(dist / 5);
      player.score += penalty;
    }
  }
  // Check for game over
  let loser = null;
  for (const player of session.players) {
    if (player.score >= 2000) {
      session.state = 'finished';
      loser = player;
    }
  }
  await setSession(sessionId, session);
  return NextResponse.json({ players: session.players, state: session.state, loser });
}

// Haversine formula for distance in miles
function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
