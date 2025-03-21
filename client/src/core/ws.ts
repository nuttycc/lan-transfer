import { DiscoveredList, MYINFO } from "../utils/contant";
import { isValidJson } from "../utils/jsonx";
import { createLeveledLogger } from "../utils/logger";
import { updateDiscoveredList } from "./dom";
import {
	addIceCandidate,
	peerB,
	sendAnswer,
	setPeerB,
	setRemoteDescription,
} from "./wrtc";

const logger = createLeveledLogger("[ws]");

logger.debug("Initializing WebSocket module...");

let socket: WebSocket;
const whiteList = ["test", "all"];

try {
	socket = connectWebSocket();
} catch (error) {
	logger.error("Error connecting to WebSocket server:", error);
}

function connectWebSocket() {
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

// send message via websocket
export const sendMsgViaSocket = (message: string) => {
	logger.debug("Sending message via WebSocket:", message);
	socket.send(message);
};

// received off: reject or accept

function handleOffer(from: string, offer: RTCSessionDescriptionInit) {
	if (whiteList && (whiteList.includes(from) || whiteList.includes("all"))) {
		logger.info("Offer accepted from (WhiteList):", from);
	} else {
		const ok = confirm(
			`Received offer from ${peerB}. Do you want to accept it?`,
		);
		if (!ok) {
			logger.info("Offer rejected from:", from);
			return false;
		}
	}

	setRemoteDescription(offer);
	setPeerB(from);
	sendAnswer();
	logger.info("Offer accepted from:", from);
	return true;
}
