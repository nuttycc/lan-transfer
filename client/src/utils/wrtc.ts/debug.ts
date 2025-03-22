import { pc } from "../../core/wrtc";
import { createLeveledLogger } from "../logger";

const logger = createLeveledLogger("[wrtc-debug]");

// Helper function to log the current connection state
export function logConnectionState() {
	logger.debug(
		`WebRTC State - Connection: ${pc.connectionState}, ICE: ${pc.iceConnectionState}, ICE Gathering: ${pc.iceGatheringState}, Signaling: ${pc.signalingState}`,
	);
}
