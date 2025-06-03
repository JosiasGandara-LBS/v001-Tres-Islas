import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { processPaymentURL, checkpagostatus } from 'src/environment/functions.config';
import { openpayConfig } from 'src/environment/openpay.config';

@Injectable({
  	providedIn: 'root'
})

export class PagoService {

  	constructor(private http: HttpClient) { }

	processPayment(tokenID: string, deviceSessionID: string, orderID: string, amount: number, description: string, customer: any): Observable<any> {
		const data = {
		  	tokenID,
		  	deviceSessionID,
			orderID,
		  	amount,
		  	description,
			customer
		};
		return this.http.post(processPaymentURL, data);
	}

	checkPaymentStatus(transactionID: string) {
		// "charge_pending", "completed"
		const url = `${checkpagostatus}?transactionID=${encodeURIComponent(transactionID)}`;
		return this.http.get(url);
	}
}
