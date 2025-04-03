export interface Promotion {
	id: string;
	enabled: boolean;
	startTime: string;
	endTime: string;
	categories: string[];
	description: string;
}
