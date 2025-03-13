import { ServerWebSocket } from "bun-types";

Bun.serve({
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    message(ws: ServerWebSocket, message: any) {},
    open(ws: any){},
    close(ws: any, code: any, message: any){},
    drain(ws: any){},
  }, // handlers
});