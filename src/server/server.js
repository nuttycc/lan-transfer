import fs from "node:fs";
import { faker } from "@faker-js/faker";
import cookie from "cookie";
import { CLIENTS } from "./src/utils/clients.js";
import { isValidJson } from "./src/utils/jsonx.js";
import { logHealthCheck, logWebSocketEvent } from "./src/utils/logger.js";

const server = Bun.serve({
	port: 3000,
	fetch(req, server) {
		const url = new URL(req.url);

		// 记录所有HTTP请求
		logWebSocketEvent("http-request", `${req.method} ${url.pathname}`, {
			headers: Object.fromEntries(
				[...req.headers.entries()].filter(
					([key]) => !["cookie", "authorization"].includes(key.toLowerCase()),
				),
			),
			query: Object.fromEntries(url.searchParams),
			method: req.method,
		});

		// 获取升级头信息
		const upgradeHeader = req.headers.get("upgrade") || "";
		const isWebSocketRequest = upgradeHeader.toLowerCase() === "websocket";

		// 健康检查端点
		if (url.pathname === "/health") {
			const isHealthy = CLIENTS.size >= 0; // 简单检查，可以根据需要扩展
			logHealthCheck(isHealthy, { clientsCount: CLIENTS.size });

			return new Response(
				JSON.stringify({
					status: isHealthy ? "healthy" : "unhealthy",
					timestamp: new Date().toISOString(),
					clientsCount: CLIENTS.size,
				}),
				{
					status: isHealthy ? 200 : 503,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// 如果请求包含WebSocket升级头，无论路径如何都处理WebSocket
		if (isWebSocketRequest) {
			const cookies = cookie.parse(req.headers.get("cookie") || "");
			const id = faker.lorem.word();
			const clientInfo = {
				id,
				username: faker.internet.username(),
				createAt: Date.now(),
				ip: req.headers.get("x-forwarded-for") || "unknown",
				url: req.url,
			};

			logWebSocketEvent(
				"upgrade-request",
				`Attempting upgrade for client on ${url.pathname}`,
				{ clientInfo },
			);

			// upgrade the request to a WebSocket
			try {
				const success = server.upgrade(req, {
					headers: {
						"Set-Cookie": `test='${id}'`,
					},
					data: clientInfo,
				});

				if (!success) {
					logWebSocketEvent("upgrade-fail", "Connection not accepted", {
						clientInfo,
					});
					return new Response("WebSocket upgrade failed", { status: 400 });
				}
				logWebSocketEvent(
					"upgrade-success",
					`Client ${id} connected from ${url.pathname}`,
					{ clientInfo },
				);
				return undefined;
			} catch (error) {
				logWebSocketEvent("error", error.message, {
					clientInfo,
					stack: error.stack,
				});
				return new Response(`WebSocket upgrade error: ${error.message}`, {
					status: 500,
				});
			}
		}

		// 处理普通HTTP请求 - 只有当不是WebSocket请求时才提供HTML
		if (url.pathname === "/" && !isWebSocketRequest) {
			return new Response(
				`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebSocket Test Client</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        #messages { border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: auto; margin-bottom: 10px; }
        #status { color: #666; margin-bottom: 10px; }
    </style>
</head>
<body>
    <h1>WebSocket Test Client</h1>
    <div id="status">Disconnected</div>
    <div id="messages"></div>
    <button id="connect">Connect</button>
    <button id="disconnect" disabled>Disconnect</button>
    <script>
        const statusEl = document.getElementById('status');
        const messagesEl = document.getElementById('messages');
        const connectBtn = document.getElementById('connect');
        const disconnectBtn = document.getElementById('disconnect');
        let ws = null;

        function log(message) {
            const item = document.createElement('div');
            item.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            messagesEl.appendChild(item);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function connect() {
            if (ws) {
                ws.close();
                ws = null;
            }

            log('Connecting to WebSocket server...');
            // 直接连接到根路径，无需指定/ws
            ws = new WebSocket(\`ws://\${window.location.host}\`);
            
            ws.onopen = () => {
                log('Connected to server');
                statusEl.textContent = 'Connected';
                statusEl.style.color = 'green';
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    log(\`Received: \${JSON.stringify(data, null, 2)}\`);
                } catch (e) {
                    log(\`Received: \${event.data}\`);
                }
            };
            
            ws.onclose = () => {
                log('Disconnected from server');
                statusEl.textContent = 'Disconnected';
                statusEl.style.color = '#666';
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                ws = null;
            };
            
            ws.onerror = (error) => {
                log(\`Error: \${error.message}\`);
                statusEl.textContent = 'Error';
                statusEl.style.color = 'red';
            };
        }

        connectBtn.addEventListener('click', connect);
        disconnectBtn.addEventListener('click', () => {
            if (ws) {
                ws.close();
            }
        });
    </script>
</body>
</html>
`,
				{
					headers: {
						"Content-Type": "text/html",
					},
				},
			);
		}

		// 处理favicon请求
		if (url.pathname === "/favicon.ico") {
			return new Response(null, { status: 204 });
		}

		// 其他路径
		return new Response("Not Found", { status: 404 });
	},
	websocket: {
		message(ws, message) {
			// server.publish('test-chat', `Echo from server: ${message}`)
			logWebSocketEvent("message", `From ${ws.data.id}`, {
				size: message.length,
			});

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
						logWebSocketEvent("message", `Forwarded to ${msg.to}`, {
							type: msg.type,
						});
					} else {
						logWebSocketEvent("error", `Target client ${msg.to} not found`);
					}
				}
			}
		},
		open(ws) {
			CLIENTS.set(ws.data.id, ws);
			logWebSocketEvent("connect", `Client ${ws.data.id} connected`, {
				total: CLIENTS.size,
				clientInfo: ws.data,
			});

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
			logWebSocketEvent("close", `Client ${ws.data.id} disconnected`, {
				code,
				message,
				total: CLIENTS.size - 1,
			});

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
			logWebSocketEvent("drain", `Client ${ws.data.id} buffer drained`);
			ws.send("Server Drain!");
		},
	},
});

console.log(`Listening on ${server.hostname}:${server.port}...`);
