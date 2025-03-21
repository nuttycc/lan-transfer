/**
 * Application configuration based on the current environment
 */

// These are injected by Vite based on the define config
declare const __APP_ENV__: string;
declare const __API_URL__: string;

// Add type definitions for Vite's import.meta.env
// interface ImportMetaEnv {
// 	readonly VITE_APP_NAME: string;
// 	readonly VITE_APP_VERSION: string;
// 	readonly VITE_API_ENDPOINT: string;
// 	readonly VITE_ENABLE_ANALYTICS: string;
// 	readonly VITE_DEBUG_TOOLS: string;
// 	readonly DEBUG: string;
// 	// Add more env variables as needed
// }

// interface ImportMeta {
// 	readonly env: ImportMetaEnv;
// }

// Environment type
export type Environment = "development" | "production" | "test";

// Configuration interface
export interface AppConfig {
	appName: string;
	appVersion: string;
	apiUrl: string;
	apiEndpoint: string;
	environment: Environment;
	isDevelopment: boolean;
	isProduction: boolean;
	isTest: boolean;
	debug: boolean;
	enableAnalytics: boolean;
	enableDebugTools: boolean;
}

// Create and export the configuration
export const config: AppConfig = {
	appName: import.meta.env.VITE_APP_NAME,
	appVersion: import.meta.env.VITE_APP_VERSION,
	apiUrl: __API_URL__,
	apiEndpoint: import.meta.env.VITE_API_ENDPOINT,
	environment: __APP_ENV__ as Environment,
	isDevelopment: __APP_ENV__ === "development",
	isProduction: __APP_ENV__ === "production",
	isTest: __APP_ENV__ === "test",
	debug: import.meta.env.DEBUG === "true",
	enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
	enableDebugTools: import.meta.env.VITE_DEBUG_TOOLS === "true",
};

// Helper function to log configuration in development
if (config.isDevelopment) {
	console.log("App Configuration:", config);
}

export default config;
