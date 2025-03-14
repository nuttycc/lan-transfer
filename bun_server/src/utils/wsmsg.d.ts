export interface WsMsg {
	type: string;
	from: string;
	to: string;
	data: any;
}
