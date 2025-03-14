import { DiscoveredList, MYINFO } from "../utils/contant";
import { updateDiscoveredList } from "./dom";
import { isValidJson } from "../utils/jsonx";
import {
	addIceCandidate,
	peerB,
	sendAnswer,
	setPeerB,
	setRemoteDescription,
} from "./wrtc";
import debug from "debug";

const logger = debug("ws");
logger("Hello from ws.ts")


let socket: WebSocket;

try {
	socket = connectWebSocket();
} catch (error) {
	console.error("Error connecting to WebSocket server:", error);
}

function connectWebSocket() {
	const socket = new WebSocket("ws://192.168.31.68:3000");

	socket.onopen = () => {
		console.log("Connected to server");
	};

	socket.onmessage = (event) => {
		const isJson = isValidJson(event.data);

		if (isJson) {
			const msg = JSON.parse(event.data);
			console.log(`Received -${msg.type}- message from -${msg.from}-:`, msg);

			switch (msg.type) {
				case "welcome":
					if (msg.to === "new-user") {
						Object.assign(MYINFO, msg.data);

						for (const k of msg.clients) {
							DiscoveredList.add(k);
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
					console.log("Unknown message type:", msg.type);
					break;
			}
		} else {
			console.log("Received non-JSON message:", event.data);
		}
	};

	socket.onclose = () => {
		DiscoveredList.delete(MYINFO.id);
		updateDiscoveredList();
		console.log("Disconnected from server");
	};

	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	return socket;
}

export const sendMessage = (message: string) => {
	socket.send(message);
};

// received off: reject or accept

function handleOffer(from: string, offer: RTCSessionDescriptionInit) {
	const ok = confirm(`Received offer from ${peerB}. Do you want to accept it?`);
	if (!ok) {
		console.log("Offer rejected");
		return false;
	}

	setRemoteDescription(offer);
	setPeerB(from);
	sendAnswer();
	return true;
}
