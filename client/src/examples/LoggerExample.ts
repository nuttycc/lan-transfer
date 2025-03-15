import { config } from "../utils/config";
import { createLeveledLogger, logger } from "../utils/logger";

/**
 * Example demonstrating how to use the logger utility
 */

// Using the default application logger
export function logWithDefaultLogger(): void {
	// These logs will only appear in development mode
	logger.debug("This is a debug message");
	logger.debug("Debug message with data:", { userId: 123, action: "login" });

	// Info logs are visible in all environments if enabled
	logger.info("This is an info message");
	logger.info("User logged in:", { userId: 123 });

	// Warning logs are visible in all environments if enabled
	logger.warn("This is a warning message");
	logger.warn("Session about to expire:", { timeLeft: "5 minutes" });

	// Error logs are always visible
	logger.error("This is an error message");
	logger.error("Login failed:", { reason: "Invalid credentials" });
}

// Creating a component-specific logger
const componentLogger = createLeveledLogger("component:button");

export function logWithComponentLogger(): void {
	componentLogger.debug("Button rendered");
	componentLogger.info("Button clicked");
	componentLogger.warn("Button clicked multiple times");
	componentLogger.error("Button action failed");
}

// Creating a feature-specific logger
const authLogger = createLeveledLogger("feature:auth");

export function simulateAuthFlow(): void {
	authLogger.debug("Starting authentication flow");

	// Simulate login process
	authLogger.info("User attempting to log in");

	if (Math.random() > 0.7) {
		authLogger.error("Authentication failed", {
			reason: "Invalid credentials",
		});
		return;
	}

	authLogger.info("User authenticated successfully");
	authLogger.debug("Authentication flow completed");
}

// Example of conditional logging based on environment
export function environmentSpecificLogging(): void {
	// This will only run in development
	if (config.isDevelopment) {
		logger.debug("Development-only debug information");
		console.log("Additional development-only console output");
	}

	// This will run in all environments
	logger.info(`Current environment: ${config.environment}`);

	// This will only run in production
	if (config.isProduction) {
		logger.info("Production-specific log message");
	}
}

// Example of logging in try/catch blocks
export function exampleTryCatchLogging(): void {
	try {
		logger.debug("Attempting risky operation");

		// Simulate an error
		if (Math.random() > 0.5) {
			throw new Error("Something went wrong");
		}

		logger.info("Operation completed successfully");
	} catch (error) {
		// Log the error with context
		logger.error("Operation failed", {
			error: error instanceof Error ? error.message : String(error),
			timestamp: new Date().toISOString(),
		});
	}
}
