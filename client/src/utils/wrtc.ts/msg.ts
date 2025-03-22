import { isInitiator } from "../../core/wrtc";
import { dataChannel, dataChannelByPeer } from "../../core/wrtc";
import { createLeveledLogger } from "../logger";

const logger = createLeveledLogger("[wrtc-msg]");

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
