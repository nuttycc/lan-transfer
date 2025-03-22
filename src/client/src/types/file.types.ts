export interface FileMetadata {
	name: string;
	size: number;
	type: string;
}

export interface FileChunk {
	type: "file-chunk";
	data: string;
	sequence: number;
}
