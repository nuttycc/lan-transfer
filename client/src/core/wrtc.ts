import { MYINFO } from "../utils/contant";
import { isValidJson } from "../utils/jsonx";
import { createLeveledLogger } from "../utils/logger";
import { displayReceivedFile, updateReceivedMsg } from "./dom";
import { sendMsgViaSocket } from "./ws";

const logger = createLeveledLogger("wrtc");
logger.debug("Hello from wrtc.ts");

export let peerB = "";

export function setPeerB(id: string) {
	peerB = id;
	logger.info("Peer B set to:", peerB);
}

// client/src/utils/wrtc.ts
const pc = new RTCPeerConnection({
	iceServers: [],
});

const dataChannel = createDataChannel();
const fileChunks: FileChunk[] = [];
let fileMetadata: FileMetadata | null = null;
// const file: File | null = null;
const files: File[] = [];
// 监听对面的 datachannel
pc.ondatachannel = (event) => {
	const dataChannelByPeer = event.channel;

	dataChannelByPeer.onmessage = (event) => {
		logger.debug("Received message from remote peer:", event.data);
		if (isValidJson(event.data)) {
			const json = JSON.parse(event.data);
			switch (json.type) {
				case "file-start":
					fileMetadata = json.metadata;
					logger.info("Received file start with metadata:", fileMetadata);
					break;
				case "file-chunk":
					fileChunks.push(json);
					logger.debug("Received file chunk:", json);
					break;
				case "file-end":
					if (fileMetadata) {
						logger.info("Received file end for:", fileMetadata.name);
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
					updateReceivedMsg(event.data);
			}
		} else {
			logger.warn("Received invalid JSON from remote peer:", event.data);
			updateReceivedMsg(event.data);
		}
	};
	dataChannelByPeer.onopen = () => {
		logger.info("Data channel opened by remote peer");
	};
	dataChannelByPeer.onclose = () => {
		logger.info("Data channel closed by remote peer");
	};
	dataChannelByPeer.onerror = (error) => {
		logger.error("Data channel error:", error);
	};
};

pc.onicecandidate = (event) => {
	if (event.candidate) {
		logger.debug("ICE candidate generated:", event.candidate);
		sendMsgViaSocket(
			JSON.stringify({
				type: "ice",
				from: MYINFO.id,
				to: peerB,
				data: event.candidate,
			}),
		);
	}
};

pc.oniceconnectionstatechange = (_event) => {
	console.log("ICE connection state changed:", pc.iceConnectionState);
};

pc.onicecandidateerror = (event) => {
	console.log("ICE candidate error:", event);
};

export async function sendOffer(id: string) {
	// 示例：在调用sendOffer前获取媒体流
	// const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
	// stream.getTracks().forEach(track => pc.addTrack(track, stream));

	const offer = await pc.createOffer();
	await pc.setLocalDescription(offer);
	setPeerB(id);
	logger.info("Sending offer to peer:", peerB);
	sendMsgViaSocket(
		JSON.stringify({
			type: "offer",
			from: MYINFO.id,
			to: peerB,
			data: offer,
		}),
	);
}

export async function setRemoteDescription(offer: RTCSessionDescriptionInit) {
	logger.info("Setting remote description:", offer);
	pc.setRemoteDescription(offer);
}

export async function sendAnswer() {
	const answer = await pc.createAnswer();
	await pc.setLocalDescription(answer);
	logger.info("Sending answer to peer:", peerB);
	sendMsgViaSocket(
		JSON.stringify({
			type: "answer",
			from: MYINFO.id,
			to: peerB,
			data: answer,
		}),
	);
}

export async function addIceCandidate(candidate: RTCIceCandidateInit) {
	// check remoteDescription
	if (!pc.remoteDescription) {
		console.log("RemoteDescription is not set, can not add ICE candidate");
		return;
	}

	await pc.addIceCandidate(candidate);
}

// dadaChannel
function createDataChannel() {
	const dataChannel = pc.createDataChannel(`${MYINFO.id}-${peerB}`);
	dataChannel.onopen = () => {
		console.log("Data channel is open");
	};
	dataChannel.onclose = () => {
		console.log("Data channel is closed");
	};
	dataChannel.onmessage = (event) => {
		console.log("Received message from data channel:", event.data);
	};
	dataChannel.onerror = (error) => {
		console.error("Data channel error:", error);
	};

	return dataChannel;
}

export function sendDataChannelMessage(message: string) {
	if (dataChannel.readyState === "open") {
		dataChannel.send(message);
		console.log(`Sent message on "${dataChannel.label}":`, message);
	} else {
		console.log(`DataChannel "${dataChannel.label}" is not open.`);
	}
}

// send file via RTC dataChannel
interface FileMetadata {
	name: string;
	size: number;
	type: string;
}

interface FileChunk {
	type: "file-chunk";
	data: string;
	sequence: number;
}

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

	if (dataChannel.readyState === "open") {
		dataChannel.send(JSON.stringify(metadata));
		logger.info("Sending file metadata for:", file.name);

		// Read and send the file in chunks
		const reader = new FileReader();
		let offset = 0;
		let sequence = 0;

		reader.onload = (e) => {
			if (e.target?.result && dataChannel.readyState === "open") {
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

				logger.debug("Sending file chunk", chunk.sequence);
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
		logger.warn("DataChannel is not open for sending file:", file.name);
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
