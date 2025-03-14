import type { ServerWebSocket } from "bun";

export const CLIENTS: Map<string, ServerWebSocket> = new Map();

// export let id = 0;
