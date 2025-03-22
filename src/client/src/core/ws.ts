import { createLeveledLogger } from "../utils/logger";
import { connectWebSocket } from "../utils/ws/connector";

const logger = createLeveledLogger("[ws]");

logger.debug("Initializing WebSocket module...");

export const socket: WebSocket = connectWebSocket();
export const whiteList = ["test", "all"];
