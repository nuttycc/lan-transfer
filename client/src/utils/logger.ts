import debug from "debug";
import { config } from "./config";

/**
 * Logger utility that wraps the debug module
 * Only prints detailed logs in development environment
 */

// Namespace for the application
const APP_NAMESPACE = "lan-transfer";

// Check if we're in a browser environment
const isBrowser =
	typeof window !== "undefined" && typeof window.document !== "undefined";

// Initialize debug based on environment
const initializeDebug = (): void => {
	try {
		// Force colors to be enabled (only in Node.js environment)
		if (!isBrowser && typeof process !== "undefined" && process.env) {
			process.env.DEBUG_COLORS = "true";
		}

		if (config.isDevelopment) {
			// Enable all debug logs in development
			debug.enable(`${APP_NAMESPACE}:*`);

			// Also try to set localStorage for browser persistence if available
			if (isBrowser && typeof localStorage !== "undefined") {
				localStorage.setItem("debug", `${APP_NAMESPACE}:*`);
			}
		} else {
			// Disable debug logs in production unless explicitly enabled
			if (
				isBrowser &&
				typeof localStorage !== "undefined" &&
				!localStorage.getItem("debug")
			) {
				localStorage.setItem("debug", "");
			}

			// In production, only enable error logs by default
			debug.enable(`${APP_NAMESPACE}:*:error`);
		}
	} catch (error) {
		// Fallback if localStorage is not available or causes issues
		console.warn("Failed to initialize debug settings:", error);

		// Set debug level directly
		if (config.isDevelopment) {
			debug.enable(`${APP_NAMESPACE}:*`);
		} else {
			debug.enable(`${APP_NAMESPACE}:*:error`);
		}
	}
};

// Initialize debug settings
initializeDebug();

/**
 * Create a namespaced logger
 * @param namespace - The namespace for the logger
 * @returns A debug instance for the specified namespace
 */
export const createLogger = (namespace: string): debug.Debugger => {
	const fullNamespace = `${APP_NAMESPACE}:${namespace}`;
	const logger = debug(fullNamespace);

	// In development, we'll use the standard debug output
	// In production, we'll only log if explicitly enabled
	return logger;
};

/**
 * Logger interface with different log levels
 */
export interface Logger {
	debug: (message: string, ...args: unknown[]) => void;
	info: (message: string, ...args: unknown[]) => void;
	warn: (message: string, ...args: unknown[]) => void;
	error: (message: string, ...args: unknown[]) => void;
}

/**
 * Create a logger with different log levels
 * @param namespace - The namespace for the logger
 * @returns A logger object with different log levels
 */
export const createLeveledLogger = (namespace: string): Logger => {
	const debugLogger = createLogger(`${namespace}:debug`);
	const infoLogger = createLogger(`${namespace}:info`);
	const warnLogger = createLogger(`${namespace}:warn`);
	const errorLogger = createLogger(`${namespace}:error`);

	// Note: debug module automatically assigns colors based on namespace
	// We don't need to manually set colors with debugLogger.color

	return {
		debug: (message: string, ...args: unknown[]): void => {
			// Only log debug messages in development
			if (config.isDevelopment) {
				debugLogger(message, ...args);
			}
		},
		info: (message: string, ...args: unknown[]): void => {
			infoLogger(message, ...args);
		},
		warn: (message: string, ...args: unknown[]): void => {
			warnLogger(message, ...args);
		},
		error: (message: string, ...args: unknown[]): void => {
			// Always log errors
			errorLogger(message, ...args);

			// In development, we might want to add additional error handling
			if (config.isDevelopment && config.enableDebugTools) {
				console.trace("Error trace:");
			}
		},
	};
};

// Default logger for the application
export const logger = createLeveledLogger("app");

// Export the debug module for advanced usage
export { debug };

export default logger;
