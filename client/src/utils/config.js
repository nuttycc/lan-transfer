// JavaScript version of the config utility

/**
 * Application configuration based on the current environment
 */

// These are injected by Vite based on the define config
// For JavaScript version, we'll use default values if not defined
const __APP_ENV__ =
	typeof window !== "undefined"
		? window.__APP_ENV__ || "development"
		: process.env.NODE_ENV || "development";
const __API_URL__ =
	typeof window !== "undefined"
		? window.__API_URL__ || "http://localhost:8080"
		: "http://localhost:8080";

// Environment type
const validEnvironments = ["development", "production", "test"];

// Create and export the configuration
export const config = {
	appName:
		typeof import.meta !== "undefined"
			? import.meta.env?.VITE_APP_NAME
			: "LAN Transfer",
	appVersion:
		typeof import.meta !== "undefined"
			? import.meta.env?.VITE_APP_VERSION
			: "1.0.0",
	apiUrl: __API_URL__,
	apiEndpoint:
		typeof import.meta !== "undefined"
			? import.meta.env?.VITE_API_ENDPOINT
			: "http://localhost:8080/api",
	environment: validEnvironments.includes(__APP_ENV__)
		? __APP_ENV__
		: "development",
	isDevelopment: __APP_ENV__ === "development",
	isProduction: __APP_ENV__ === "production",
	isTest: __APP_ENV__ === "test",
	debug:
		typeof import.meta !== "undefined"
			? import.meta.env?.DEBUG === "true"
			: true,
	enableAnalytics:
		typeof import.meta !== "undefined"
			? import.meta.env?.VITE_ENABLE_ANALYTICS === "true"
			: false,
	enableDebugTools:
		typeof import.meta !== "undefined"
			? import.meta.env?.VITE_DEBUG_TOOLS === "true"
			: true,
};

// Helper function to log configuration in development
if (config.isDevelopment) {
	console.log("App Configuration:", config);
}

export default config;
