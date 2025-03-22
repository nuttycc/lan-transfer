// send file via RTC dataChannel

import { isInitiator, pc, peerB } from "../../core/wrtc";
import { dataChannel } from "../../core/wrtc";
import type { FileChunk, FileMetadata } from "../../types/file.types";
import { createLeveledLogger } from "../logger";

const logger = createLeveledLogger("[wrtc-file]");

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
