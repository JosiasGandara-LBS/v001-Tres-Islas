export interface OpenPayResponse {
	id:                   string;
	authorization:        string;
	operation_type:       string;
	transaction_type:     string;
	status:               string;
	conciliated:          boolean;
	creation_date:        Date;
	operation_date:       Date;
	description:          string;
	error_message:        null;
	order_id:             null;
	card:                 Card;
	gateway_card_present: string;
	amount:               number;
	customer:             Customer;
	payment_method:       PaymentMethod;
	currency:             string;
	method:               string;
}

export interface Card {
	type:               string;
	brand:              string;
	address:            null;
	card_number:        string;
	holder_name:        string;
	expiration_year:    string;
	expiration_month:   string;
	allows_charges:     boolean;
	allows_payouts:     boolean;
	bank_name:          string;
	card_business_type: null;
	dcc:                null;
	bank_code:          string;
}

export interface Customer {
	name:          string;
	last_name:     null;
	email:         string;
	phone_number:  string;
	address:       null;
	creation_date: Date;
	external_id:   null;
	clabe:         null;
}

export interface PaymentMethod {
	type: string;
	url:  string;
}

