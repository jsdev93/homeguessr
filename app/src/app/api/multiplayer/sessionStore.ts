import redis from './redis';
import { Player, Session } from './sessions';

const SESSION_PREFIX = 'session:';

export async function getSession(sessionId: string): Promise<Session | null> {
  const data = await redis.get(SESSION_PREFIX + sessionId);
  return data ? JSON.parse(data) : null;
}

export async function setSession(sessionId: string, session: Session): Promise<void> {
  await redis.set(SESSION_PREFIX + sessionId, JSON.stringify(session));
}

export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(SESSION_PREFIX + sessionId);
}
