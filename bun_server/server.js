import { faker } from "@faker-js/faker";
import cookie from "cookie";
import { CLIENTS } from "./src/utils/clients";
import { isValidJson } from "./src/utils/jsonx";

const server = Bun.serve({
	port: 3000,
	fetch(req, server) {
		const cookies = cookie.parse(req.headers.get("cookie") || "");
		const id = faker.lorem.word();

		// upgrade the request to a WebSocket
		const success = server.upgrade(req, {
			headers: {
				"Set-Cookie": `test='${id}'`,
			},
			data: {
				id: id,
				username: faker.internet.username(),
				createAt: Date.now(),
			},
		});
		if (!success) {
			console.log("Failed to upgrade to WebSocket");
		}
		return success
			? undefined
			: new Response("Failed to upgrade to WebSocket", { status: 400 });
	},
	websocket: {
		message(ws, message) {
			// server.publish('test-chat', `Echo from server: ${message}`)

			if (isValidJson(message)) {
				const msg = JSON.parse(message);
				if (
					msg.type === "ice" ||
					msg.type === "offer" ||
					msg.type === "answer"
				) {
					const targetWs = CLIENTS.get(msg.to);
					if (targetWs) {
						targetWs.send(message); // 确保存在再发送
					} else {
						console.error(`Target client ${msg.to} not found`);
					}
				}
			}
		},
		open(ws) {
			CLIENTS.set(ws.data.id, ws);

			ws.send(
				JSON.stringify({
					type: "welcome",
					from: "server",
					to: "new-user",
					data: ws.data,
					clients: Array.from(CLIENTS.keys()), //已经存在的 clients
				}),
			);

			ws.subscribe("test-chat");
			server.publish(
				"test-chat",
				JSON.stringify({
					type: "welcome",
					from: "server",
					to: "all",
					data: ws.data,
				}),
			);
		},
		close(ws, code, message) {
			ws.send("Server Closed!");

			ws.unsubscribe("test-chat");
			server.publish(
				"test-chat",
				JSON.stringify({
					type: "leave",
					from: "server",
					to: "all",
					data: ws.data,
				}),
			);

			CLIENTS.delete(ws.data.id);
		},
		drain(ws) {
			ws.send("Server Drain!");
		},
	},
});

console.log(`Listening on ${server.hostname}:${server.port}...`);
