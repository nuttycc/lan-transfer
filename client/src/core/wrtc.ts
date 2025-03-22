import { MYINFO } from "../utils/contant";
import { createLeveledLogger } from "../utils/logger";
import {
	createDataChannel,
	handleDataChannelMessage,
} from "../utils/wrtc.ts/handler";
import { sendMsgViaSocket } from "../utils/ws/msg";

const logger = createLeveledLogger("[wrtc]");
logger.debug("Initializing WebRTC module...");

export let peerB = "";
export let isInitiator = false;
export let dataChannelByPeer: RTCDataChannel | null = null;

// client/src/utils/wrtc.ts
export const pc = new RTCPeerConnection({
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
	],
	iceCandidatePoolSize: 10, // Pre-gather ICE candidates
	iceTransportPolicy: "all",
});

export let dataChannel: RTCDataChannel | null = pc.createDataChannel(
	"temp-triggering-channel",
);

// 监听ICE连接状态, 如果连接成功, 则创建新的dataChannel
pc.oniceconnectionstatechange = () => {
	logger.debug(`ICE connection state changed: ${pc.iceConnectionState}`);

	switch (pc.iceConnectionState) {
		case "connected":
			if (dataChannel) {
				logger.warn("Closing old data channel");
				dataChannel.close();
			}

			logger.debug("[isInitiator]", isInitiator);

			if (isInitiator) {
				dataChannel = createDataChannel();
				logger.info(`I'm the initiator, created a new data channel.`);
			}
			break;
		case "failed":
		case "disconnected":
			logger.error(
				`ICE connection failed or disconnected: ${pc.iceConnectionState}`,
			);
			break;
	}
};

// Also add connection state monitoring
pc.onconnectionstatechange = () => {
	logger.debug(`Connection state changed: ${pc.connectionState}`);

	if (pc.connectionState === "connected") {
		logger.info("Peer connection established successfully");
	} else if (pc.connectionState === "failed") {
		logger.error("Peer connection failed");
	}
};

pc.onicecandidateerror = (event) => {
	logger.error(`ICE candidate error: ${event}`);
};

pc.onicecandidate = (event) => {
	if (event.candidate) {
		sendMsgViaSocket(
			JSON.stringify({
				type: "ice",
				from: MYINFO.id,
				to: peerB,
				data: event.candidate,
			}),
		);

		logger.debug(
			`ICE candidate generated and sent to peer: ${JSON.stringify(
				event.candidate,
			)}`,
		);
	} else {
		logger.info("ICE candidate gathering complete");
	}
};

// 监听对面的 datachannel
pc.ondatachannel = (event) => {
	dataChannelByPeer = event.channel;
	logger.info(`Data channel opened by remote peer: ${dataChannelByPeer.label}`);

	dataChannelByPeer.onmessage = (event) => {
		logger.debug(`Received message from remote peer: ${event.data}`);
		handleDataChannelMessage(event.data);
	};
	dataChannelByPeer.onopen = () => {
		logger.info("Data channel opened by remote peer");
	};
	dataChannelByPeer.onclose = () => {
		logger.info("Data channel closed by remote peer");
	};
	dataChannelByPeer.onerror = (event: Event) => {
		const error = event instanceof RTCErrorEvent ? event.error : event;
		logger.error(`Data channel error: ${error}`);
	};
};

export function setIsInitiator(arg: boolean) {
	isInitiator = arg;
}

export function setPeerB(id: string) {
	peerB = id;
	logger.info(`Peer B set to: ${peerB}`);
}
