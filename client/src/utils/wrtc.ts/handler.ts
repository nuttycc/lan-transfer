import { displayReceivedFile } from "../../core/dom";
import { updateReceivedMsg } from "../../core/dom";
import { reassembleFile } from "../../core/wrtc";
import type { FileChunk, FileMetadata } from "../../types/file.types";
import { isValidJson } from "../jsonx";
import { logger } from "../logger";

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
