import { updateDiscoveredList } from "../../core/dom";
import { DiscoveredList, MYINFO } from "../contant";
import { isValidJson } from "../jsonx";
import { createLeveledLogger } from "../logger";
import { handleOffer } from "../wrtc.ts/handler";
import { addIceCandidate, setRemoteDescription } from "../wrtc.ts/signal";

const logger = createLeveledLogger("[ws-connector]");

export function connectWebSocket() {
	logger.debug("Initializing WebSocket connection...");
	const socket = new WebSocket("ws://localhost:3000");

	socket.onopen = () => {
		logger.info("Connected to WebSocket server");
	};

	socket.onmessage = (event) => {
		const isJson = isValidJson(event.data);

		if (isJson) {
			const msg = JSON.parse(event.data);
			logger.debug(`Received |${msg.type}| message from |${msg.from}|:`, msg);

			switch (msg.type) {
				case "welcome":
					if (msg.to === "new-user") {
						Object.assign(MYINFO, msg.data);
						for (const clientId of msg.clients) {
							DiscoveredList.add(clientId);
						}
						updateDiscoveredList();
					}

					if (msg.to === "all" && msg.data.id !== MYINFO.id) {
						DiscoveredList.add(msg.data.id);
						updateDiscoveredList();
					}
					break;
				case "leave":
					if (msg.to === "all") {
						DiscoveredList.delete(msg.data.id);
						updateDiscoveredList();
					}
					break;
				case "offer":
					handleOffer(msg.from, msg.data);
					break;
				case "answer":
					setRemoteDescription(msg.data);
					break;
				case "ice":
					addIceCandidate(msg.data);
					break;
				default:
					logger.warn("Unknown message type received:", msg.type);
					break;
			}
		} else {
			logger.warn("Received non-JSON message:", event.data);
		}
	};

	socket.onclose = () => {
		DiscoveredList.delete(MYINFO.id);
		updateDiscoveredList();
		logger.info("Disconnected from WebSocket server");
	};

	socket.onerror = (error) => {
		logger.error("WebSocket error:", error);
	};

	return socket;
}
