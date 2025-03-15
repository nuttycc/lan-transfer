import { createLeveledLogger, logger } from "../utils/logger";

/**
 * Browser-specific test for logger
 *
 * This file can be imported in a browser environment to test the logger
 */

// Enable debug in localStorage
localStorage.setItem("debug", "lan-transfer:*");

// Test the default logger
export function testBrowserLogger(): void {
	console.log("=== Testing Browser Logger ===");

	// Default logger
	logger.debug("Browser test - DEBUG message");
	logger.info("Browser test - INFO message");
	logger.warn("Browser test - WARNING message");
	logger.error("Browser test - ERROR message");

	// Component logger
	const uiLogger = createLeveledLogger("browser:ui");
	uiLogger.debug("UI component - DEBUG message");
	uiLogger.info("UI component - INFO message");
	uiLogger.warn("UI component - WARNING message");
	uiLogger.error("UI component - ERROR message");

	console.log("=== Browser Logger Test Complete ===");
}

// Auto-run the test when this module is loaded
testBrowserLogger();
