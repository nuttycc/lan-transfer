import { pc, setIsInitiator } from "../../core/wrtc";
import { createLeveledLogger } from "../logger";

const logger = createLeveledLogger("[wrtc-signal]");

export async function setRemoteDescription(offer: RTCSessionDescriptionInit) {
	logger.info(`Setting remote description: ${JSON.stringify(offer)}`);
	await pc.setRemoteDescription(offer);

	// If we're receiving an offer, we should set isInitiator to false
	if (offer.type === "offer") {
		setIsInitiator(false);
		logger.info("Set as non-initiator (answerer)");
	}
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
