import { socket } from "../../core/ws";
import { createLeveledLogger } from "../logger";

const logger = createLeveledLogger("[ws-msg]");

// send message via websocket
export const sendMsgViaSocket = (message: string) => {
	logger.debug("Sending message via WebSocket:", message);
	socket.send(message);
};
