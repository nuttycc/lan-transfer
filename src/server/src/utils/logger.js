import { consola } from "consola";

// 创建一个更好的日志记录器
const logger = consola.create({
	level: process.env.NODE_ENV === "production" ? 4 : 5, // info in prod, debug in dev
	defaults: {
		tag: "ws-server",
	},
});

// 增强的日志格式
export function logWebSocketEvent(event, message, data = {}) {
	switch (event) {
		case "upgrade-success":
			logger.success(`WebSocket upgraded: ${message}`, data);
			break;
		case "upgrade-fail":
			logger.error(`WebSocket upgrade failed: ${message}`, data);
			break;
		case "connect":
			logger.info(`WebSocket connected: ${message}`, data);
			break;
		case "message":
			logger.debug(`WebSocket message: ${message}`, data);
			break;
		case "close":
			logger.warn(`WebSocket closed: ${message}`, data);
			break;
		case "error":
			logger.error(`WebSocket error: ${message}`, data);
			break;
		case "http-request":
			logger.info(`HTTP request: ${message}`, data);
			break;
		case "upgrade-request":
			logger.debug(`Upgrade request: ${message}`, data);
			break;
		default:
			logger.log(message, data);
	}
}

// 添加健康检查日志
export function logHealthCheck(isHealthy, details = {}) {
	if (isHealthy) {
		logger.success("Health check passed", details);
	} else {
		logger.warn("Health check failed", details);
	}
}

export default logger;
