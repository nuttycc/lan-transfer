import { createLeveledLogger } from "./logger";

const logger = createLeveledLogger("check");
logger.debug("Hello from check.ts");

// 检查是否是移动平台
export function isMobile() {
	const userAgent = navigator.userAgent;
	logger.debug("userAgent: %s", userAgent);
	const isMobileAgent =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			userAgent,
		);
	// const isMobileWidth = window.matchMedia("(max-width: 767px)").matches;
	return isMobileAgent;
}
