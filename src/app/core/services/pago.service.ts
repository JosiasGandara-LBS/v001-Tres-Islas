import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagoService {

	private apiUrl = 'https://procesarpago-wjc3vrdlna-uc.a.run.app';
	private apiKey = 'sk_cf030af358ea459984ed87e8fb92daf2';
	private merchantId = 'mheinovbagqf3nzxctrx';
	private apiSandboxUrl = `https://sandbox-api.openpay.mx/v1/MERCHANT_ID/checkouts`;

  	constructor(private http: HttpClient) { }

	procesarPago(tokenId: string, deviceSessionId: string, amount: number, description: string, customer: any): Observable<any> {
		const data = {
		  	tokenId,
		  	deviceSessionId,
		  	amount,
		  	description,
			customer
		};
		return this.http.post(this.apiUrl, data);
	}
}
