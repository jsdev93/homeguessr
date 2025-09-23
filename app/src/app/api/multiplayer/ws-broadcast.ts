// This module allows API routes to broadcast session state updates to all websocket clients in a session.
import { WebSocketServer, WebSocket } from 'ws';
import { getSession } from './sessionStore';

let wss: WebSocketServer | undefined;
let wsSessionMap: Map<WebSocket, { sessionId: string, playerId: string }> | undefined;

export function setWSS(server: WebSocketServer, map: Map<WebSocket, { sessionId: string, playerId: string }>) {
  wss = server;
  wsSessionMap = map;
}

export function broadcastSessionState(sessionId: string) {
  if (!wss || !wsSessionMap) return;
  getSession(sessionId).then(session => {
    if (!session) return;
    wss!.clients.forEach((client: WebSocket) => {
      const info = wsSessionMap!.get(client);
      if (client.readyState === 1 && info && info.sessionId === sessionId) {
        client.send(JSON.stringify({ type: 'state', session }));
      }
    });
  });
}
