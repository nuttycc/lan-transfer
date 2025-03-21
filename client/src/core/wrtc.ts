import type { FileChunk, FileMetadata } from "../types/file.types";
import { MYINFO } from "../utils/contant";
// import { isValidJson } from "../utils/jsonx";
import { createLeveledLogger } from "../utils/logger";
import { handleDataChannelMessage } from "../utils/wrtc.ts/handler";
// import { displayReceivedFile, updateReceivedMsg } from "./dom";
import { sendMsgViaSocket } from "./ws";

const logger = createLeveledLogger("[wrtc]");
logger.debug("Initializing WebRTC module");

export let peerB = "";

export function setPeerB(id: string) {
	peerB = id;
	logger.info(`Peer B set to: ${peerB}`);
}

// client/src/utils/wrtc.ts
const pc = new RTCPeerConnection({
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
	],
	iceCandidatePoolSize: 10, // Pre-gather ICE candidates
	iceTransportPolicy: "all",
});

let dataChannel: RTCDataChannel | null = pc.createDataChannel(
	"temp-triggering-channel",
);
let isInitiator = false;

// 监听ICE连接状态, 如果连接成功, 则创建新的dataChannel
pc.oniceconnectionstatechange = () => {
	logger.debug(`ICE connection state changed: ${pc.iceConnectionState}`);

	if (pc.iceConnectionState === "connected") {
		if (dataChannel) {
			logger.warn("Closing old data channel");
			dataChannel.close();
		}

		if (isInitiator) {
			dataChannel = createDataChannel();
			logger.info(`I'm the initiator, created a new data channel.`);
		}
	} else if (
		pc.iceConnectionState === "failed" ||
		pc.iceConnectionState === "disconnected"
	) {
		logger.error(
			`ICE connection failed or disconnected: ${pc.iceConnectionState}`,
		);
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
			`ICE candidate generated and sent to peer: ${JSON.stringify(event.candidate)}`,
		);
	} else {
		logger.info("ICE candidate gathering complete");
	}
};

let dataChannelByPeer: RTCDataChannel | null = null;
// 监听对面的 datachannel
pc.ondatachannel = (event) => {
	dataChannelByPeer = event.channel;

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

// Send msg via WebSocket
export async function sendOffer(id: string) {
	isInitiator = true;
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

// Helper function to log the current connection state
function logConnectionState() {
	logger.debug(
		`WebRTC State - Connection: ${pc.connectionState}, ICE: ${pc.iceConnectionState}, ICE Gathering: ${pc.iceGatheringState}, Signaling: ${pc.signalingState}`,
	);
}

export async function setRemoteDescription(offer: RTCSessionDescriptionInit) {
	logger.info(`Setting remote description: ${JSON.stringify(offer)}`);
	await pc.setRemoteDescription(offer);

	// If we're receiving an offer, we should set isInitiator to false
	if (offer.type === "offer") {
		isInitiator = false;
		logger.info("Set as non-initiator (answerer)");
	}
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

export function addIceCandidate(candidate: RTCIceCandidateInit, maxRetry = 10) {
	let retryCount = 0;

	const attemptAdd = async () => {
		if (!pc.remoteDescription) {
			retryCount++;
			if (retryCount < maxRetry) {
				logger.warn(
					`RemoteDescription not set, retrying (${retryCount}/${maxRetry})...`,
				);
				setTimeout(attemptAdd, 1000);
			} else {
				logger.error(
					`Failed to add ICE candidate after ${maxRetry} attempts: RemoteDescription not set`,
				);
			}
			return;
		}

		try {
			await pc.addIceCandidate(candidate);
			logger.debug(`Added ICE candidate: ${JSON.stringify(candidate)}`);
		} catch (error) {
			retryCount++;
			if (retryCount < maxRetry) {
				logger.warn(
					`Failed to add ICE candidate, retrying (${retryCount}/${maxRetry}): ${error}`,
				);
				setTimeout(attemptAdd, 1000);
			} else {
				logger.error(
					`Failed to add ICE candidate after ${maxRetry} attempts: ${error}`,
				);
			}
		}
	};

	attemptAdd();
}

// dataChannel

function createDataChannel() {
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

export function sendDataChannelMessage(message: string) {
	if (isInitiator) {
		if (dataChannel && dataChannel.readyState === "open") {
			dataChannel.send(message);
			logger.info(`Sent message on "${dataChannel.label}":`, message);
		} else {
			logger.warn("No data channel found.");
		}
	} else {
		if (dataChannelByPeer && dataChannelByPeer.readyState === "open") {
			dataChannelByPeer.send(message);
			logger.info(`Sent message on "${dataChannelByPeer.label}":`, message);
		} else {
			logger.warn("No data channel by peer found.");
		}
	}
}

// send file via RTC dataChannel

export function sendFiles(files: FileList | null) {
	if (!files) {
		logger.info("No files selected");
		return;
	}
	for (const file of files) {
		sendFile(file);
	}
}

export function sendFile(file: File | null) {
	if (!file) {
		logger.warn("No file selected for sending");
		return;
	}

	const CHUNK_SIZE = 16384; // 16KB chunks

	// Send file metadata first
	const metadata = {
		type: "file-start",
		metadata: {
			name: file.name,
			size: file.size,
			type: file.type,
		},
	};

	if (dataChannel && dataChannel.readyState === "open") {
		dataChannel.send(JSON.stringify(metadata));
		logger.info(`Sending file metadata for: ${file.name}`);

		// Read and send the file in chunks
		const reader = new FileReader();
		let offset = 0;
		let sequence = 0;

		reader.onload = (e) => {
			if (
				e.target?.result &&
				dataChannel &&
				dataChannel.readyState === "open"
			) {
				// Convert ArrayBuffer to Base64 string
				const arrayBuffer = e.target.result as ArrayBuffer;
				const base64String = btoa(
					String.fromCharCode(...new Uint8Array(arrayBuffer)),
				);

				// Send the chunk
				const chunk = {
					type: "file-chunk",
					data: base64String,
					sequence: sequence++,
				};

				logger.debug(`Sending file chunk sequence: ${chunk.sequence}`);
				dataChannel.send(JSON.stringify(chunk));

				// Read next chunk
				offset += CHUNK_SIZE;
				if (offset < file.size) {
					readSlice(offset);
				} else {
					// Send end message
					const endMessage = {
						type: "file-end",
						name: file.name,
					};
					dataChannel.send(JSON.stringify(endMessage));
					logger.info(`File "${file.name}" transfer completed`);
				}
			} else {
				logger.warn("Failed to send file chunk");
			}
		};

		const readSlice = (o: number) => {
			const slice = file.slice(o, o + CHUNK_SIZE);
			reader.readAsArrayBuffer(slice);
		};

		readSlice(0); // Start reading
	} else {
		logger.warn(`DataChannel is not open for sending file: ${file.name}`);
	}
}

// receive file via RTC dataChannel

export function reassembleFile(
	metadata: FileMetadata,
	chunks: FileChunk[],
): File {
	// Sort chunks by sequence number
	const sortedChunks = chunks.sort((a, b) => a.sequence - b.sequence);

	// Convert Base64 chunks back to ArrayBuffers and combine
	const buffers = sortedChunks.map((chunk) => {
		const binaryString = atob(chunk.data as string);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	});

	// Combine all buffers
	const totalLength = buffers.reduce(
		(total, buffer) => total + buffer.byteLength,
		0,
	);
	const combinedBuffer = new Uint8Array(totalLength);
	let offset = 0;

	for (const buffer of buffers) {
		combinedBuffer.set(new Uint8Array(buffer), offset);
		offset += buffer.byteLength;
	}

	// Create a blob from the combined buffer
	const blob = new Blob([combinedBuffer], { type: metadata.type });

	logger.info(`File "${metadata.name}" reassembled successfully`);

	// Convert blob to file with original metadata
	return new File([blob], metadata.name, {
		type: metadata.type,
		lastModified: Date.now(),
	});
}

// Export a debug function to help with troubleshooting
export function debugWebRTCConnection() {
	logger.info("=== WebRTC Connection Debug ===");
	logger.info(`Current peer: ${peerB}`);
	logger.info(`Is initiator: ${isInitiator}`);
	logger.info(`Connection state: ${pc.connectionState}`);
	logger.info(`ICE connection state: ${pc.iceConnectionState}`);
	logger.info(`ICE gathering state: ${pc.iceGatheringState}`);
	logger.info(`Signaling state: ${pc.signalingState}`);

	if (dataChannel) {
		logger.info(`DataChannel state: ${dataChannel.readyState}`);
		logger.info(`DataChannel label: ${dataChannel.label}`);
	} else {
		logger.info("No data channel exists yet");
	}

	// Check if there are any media transceivers (usually not in data-only connections)
	const transceivers = pc.getTransceivers();
	if (transceivers.length > 0) {
		logger.info(`Found ${transceivers.length} transceivers`);
		transceivers.forEach((t, i) => {
			logger.info(
				`Transceiver ${i}: direction=${t.direction}, currentDirection=${t.currentDirection}`,
			);
		});
	} else {
		logger.info("No transceivers found (normal for data-only connections)");
	}

	return {
		peerB,
		isInitiator,
		connectionState: pc.connectionState,
		iceConnectionState: pc.iceConnectionState,
		iceGatheringState: pc.iceGatheringState,
		signalingState: pc.signalingState,
		dataChannel: dataChannel
			? {
					readyState: dataChannel.readyState,
					label: dataChannel.label,
				}
			: null,
	};
}
