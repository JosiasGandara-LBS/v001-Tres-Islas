export interface CartItem {
	id: string;
	image: string;
	name: string;
	category: string;
	description: string;
	price: number;
	quantity: number;
	additionalInstructions: string;
	discounted?: number;
}