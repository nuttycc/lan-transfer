import { displayReceivedFile } from "../../core/dom";
import { updateReceivedMsg } from "../../core/dom";
import {
	isInitiator,
	pc,
	peerB,
	setIsInitiator,
	setPeerB,
} from "../../core/wrtc";
import { whiteList } from "../../core/ws";
import type { FileChunk, FileMetadata } from "../../types/file.types";
import { MYINFO } from "../contant";
import { isValidJson } from "../jsonx";
import { logger } from "../logger";
import { sendMsgViaSocket } from "../ws/msg";
import { logConnectionState } from "./debug";
import { reassembleFile } from "./file";
import { setRemoteDescription } from "./signal";

let fileMetadata: FileMetadata | null = null;
const fileChunks: FileChunk[] = [];
const files: File[] = [];

export function handleDataChannelMessage(message: string) {
	if (isValidJson(message)) {
		const json = JSON.parse(message);
		switch (json.type) {
			case "file-start":
				fileMetadata = json.metadata;
				logger.info(
					`Received file start with metadata: ${JSON.stringify(fileMetadata)}`,
				);
				break;
			case "file-chunk":
				fileChunks.push(json);
				logger.debug(`Received file chunk sequence: ${json.sequence}`);
				break;
			case "file-end":
				if (fileMetadata) {
					logger.info(`Received file end for: ${fileMetadata.name}`);
					const receivedFile = reassembleFile(fileMetadata, fileChunks);
					files.push(receivedFile);
					// Display the received file in the UI
					displayReceivedFile(receivedFile);
					fileMetadata = null;
					fileChunks.length = 0;
				} else {
					logger.warn("No file metadata found for file end");
				}
				break;
			default:
				updateReceivedMsg(message);
		}
	} else {
		logger.warn(`Received invalid JSON from remote peer: ${message}`);
		updateReceivedMsg(message);
	}
}

// Send msg via WebSocket
export async function sendOffer(id: string) {
	// isInitiator = true;
	setIsInitiator(true);
	logger.debug("[isInitiator]", isInitiator);
	setPeerB(id);

	// Create a temporary data channel to trigger ICE gathering
	// const tempChannel = pc.createDataChannel('temp-triggering-channel');

	// Force gathering ICE candidates
	const offerOptions = {
		offerToReceiveAudio: false,
		offerToReceiveVideo: false,
		iceRestart: true,
	};

	const offer = await pc.createOffer(offerOptions);
	await pc.setLocalDescription(offer);

	// Wait a moment to allow some ICE candidates to gather before sending offer
	setTimeout(() => {
		// Only send the offer if we still have a connection
		if (pc.connectionState !== "failed" && pc.connectionState !== "closed") {
			sendMsgViaSocket(
				JSON.stringify({
					type: "offer",
					from: MYINFO.id,
					to: peerB,
					data: pc.localDescription || offer,
				}),
			);

			logger.info(`Sending offer to peer:|${peerB}|`);
			logger.debug(`ICE gathering state: ${pc.iceGatheringState}`);

			// Log connection state
			logConnectionState();
		}
	}, 500);
}

export async function sendAnswer() {
	const answer = await pc.createAnswer();
	await pc.setLocalDescription(answer);

	// Wait a moment to allow some ICE candidates to gather before sending the answer
	setTimeout(() => {
		// Only send the answer if we still have a connection
		if (pc.connectionState !== "failed" && pc.connectionState !== "closed") {
			sendMsgViaSocket(
				JSON.stringify({
					type: "answer",
					from: MYINFO.id,
					to: peerB,
					data: pc.localDescription || answer,
				}),
			);

			logger.info(`Sending answer to peer: ${peerB}`);
			logger.debug(`ICE gathering state: ${pc.iceGatheringState}`);

			// Log connection state
			logConnectionState();
		}
	}, 500);
}

// received off: reject or accept

export function handleOffer(from: string, offer: RTCSessionDescriptionInit) {
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

// dataChannel

export function createDataChannel() {
	const channel = pc.createDataChannel(`${MYINFO.id}<->${peerB}`);

	logger.debug(`Creating data channel with label: |${MYINFO.id}<->${peerB}|`);

	channel.onmessage = (event) => {
		logger.debug(
			`Received message on data channel "${channel.label}":`,
			event.data,
		);
		handleDataChannelMessage(event.data);
	};

	channel.onopen = () => {
		logger.info(`Data channel "${channel.label}" is open`);
	};

	channel.onclose = () => {
		logger.info(`Data channel "${channel.label}" is closed`);
	};

	channel.onerror = (error) => {
		logger.error(`Data channel "${channel.label}" error:`, error);
	};

	return channel;
}
