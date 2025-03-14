export interface WsMsg {
	type: string;
	from: string;
	to: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: any;
}
