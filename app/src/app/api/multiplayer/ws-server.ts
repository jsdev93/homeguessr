
import { WebSocketServer, WebSocket } from 'ws';

import { getSession } from './sessionStore';
import { setWSS } from './ws-broadcast';



const wss = new WebSocketServer({ port: 3002 });
const wsSessionMap = new Map<WebSocket, { sessionId: string, playerId: string }>();
setWSS(wss, wsSessionMap);

// ws is type WebSocket from 'ws' package, not the browser type
wss.on('connection', (ws: WebSocket) => {
  console.log('[WS] New client connected');
  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse((message as Buffer).toString());
      console.log('[WS] Received message:', data);
      if (data.type === 'subscribe' && data.sessionId) {
        wsSessionMap.set(ws, { sessionId: data.sessionId, playerId: data.playerId });
        console.log(`[WS] Client subscribed to session ${data.sessionId}, player ${data.playerId}`);
        getSession(data.sessionId).then(session => {
          if (session) {
            console.log(`[WS] Broadcasting session state for subscribe to session ${data.sessionId}`);
            wss.clients.forEach((client: WebSocket) => {
              const info = wsSessionMap.get(client);
              if (client.readyState === 1 && info && info.sessionId === data.sessionId) {
                client.send(JSON.stringify({ type: 'state', session }));
              }
            });
          } else {
            console.log(`[WS] No session found for subscribe: ${data.sessionId}`);
          }
        });
      }
      // Broadcast session state to all clients in the same session
      if (data.type === 'update' && data.sessionId) {
        console.log(`[WS] Received update for session ${data.sessionId}`);
        getSession(data.sessionId).then(session => {
          if (session) {
            console.log(`[WS] Broadcasting session state for update to session ${data.sessionId}`);
            wss.clients.forEach((client: WebSocket) => {
              const info = wsSessionMap.get(client);
              if (client.readyState === 1 && info && info.sessionId === data.sessionId) {
                client.send(JSON.stringify({ type: 'state', session }));
              }
            });
          } else {
            console.log(`[WS] No session found for update: ${data.sessionId}`);
          }
        });
      }
    } catch (err) {
      console.log('[WS] Error parsing message:', err);
    }
  });
  ws.on('close', () => {
    wsSessionMap.delete(ws);
    console.log('[WS] Client disconnected');
  });
});

export default wss;
