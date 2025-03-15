import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import type { ConfigEnv, UserConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
	// Load env file based on `mode` in the current directory.
	// Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
	const env = loadEnv(mode, process.cwd(), "");

	const isProduction = mode === "production";

	return {
		// Common configuration
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},
		plugins: [tailwindcss()],

		// Environment specific configurations
		server: {
			host: "0.0.0.0",
			port: env.PORT ? Number.parseInt(env.PORT) : 3000,
			// Only enable HMR in development
			hmr: !isProduction,
		},

		// Production specific optimizations
		build: {
			// Minify for production, don't minify for development
			minify: isProduction ? "esbuild" : false,
			// Generate sourcemaps for development only
			sourcemap: !isProduction,
			// Output directory
			outDir: "dist",
			// Empty the output directory before building
			emptyOutDir: true,
			// Chunk size warnings threshold (in kBs)
			chunkSizeWarningLimit: 1000,
		},

		// Define global constants for different environments
		define: {
			__APP_ENV__: JSON.stringify(mode),
			__API_URL__: JSON.stringify(
				isProduction ? "https://api.example.com" : "http://localhost:8080",
			),
		},
	};
});
