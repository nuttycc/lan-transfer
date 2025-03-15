import { config } from "../utils/config";
import { createLeveledLogger } from "../utils/logger";

// Create a logger specific to the API service
const apiLogger = createLeveledLogger("service:api");

/**
 * API Service that uses environment configuration
 */
export class ApiService {
	private baseUrl: string;

	constructor() {
		this.baseUrl = config.apiEndpoint;

		// Log API initialization in development mode
		apiLogger.debug(`API Service initialized with base URL: ${this.baseUrl}`);
	}

	/**
	 * Make a GET request to the API
	 */
	async get<T>(endpoint: string): Promise<T> {
		const url = `${this.baseUrl}/${endpoint}`;

		try {
			// Add debug information in development
			apiLogger.debug(`GET ${url}`);

			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					// Add analytics tracking in production
					...(config.enableAnalytics && { "X-Analytics-Enabled": "true" }),
				},
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();
			apiLogger.debug("GET response:", data);
			return data;
		} catch (error) {
			// Enhanced error logging
			apiLogger.error(`Error fetching ${url}:`, {
				error: error instanceof Error ? error.message : String(error),
				endpoint,
			});
			throw error;
		}
	}

	/**
	 * Make a POST request to the API
	 */
	async post<T, D extends Record<string, unknown>>(
		endpoint: string,
		data: D,
	): Promise<T> {
		const url = `${this.baseUrl}/${endpoint}`;

		try {
			// Add debug information
			apiLogger.debug(`POST ${url}`, data);

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					// Add analytics tracking in production
					...(config.enableAnalytics && { "X-Analytics-Enabled": "true" }),
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const responseData = await response.json();
			apiLogger.debug("POST response:", responseData);
			return responseData;
		} catch (error) {
			// Enhanced error logging
			apiLogger.error(`Error posting to ${url}:`, {
				error: error instanceof Error ? error.message : String(error),
				endpoint,
				requestData: data,
			});
			throw error;
		}
	}
}

// Export a singleton instance
export const api = new ApiService();
