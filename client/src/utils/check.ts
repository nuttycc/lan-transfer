import debug from "debug";

const logger = debug("lan-transfer:app:debug");
logger("Hello from check.ts");

// 检查是否是移动平台

export function isMobile() {
	const userAgent = navigator.userAgent;
	logger("userAgent", userAgent);
	const isMobileAgent =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			userAgent,
		);
	// const isMobileWidth = window.matchMedia("(max-width: 767px)").matches;
	return isMobileAgent;
}
