import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { procesarPagoUrl } from 'src/environment/functions.config';

@Injectable({
  providedIn: 'root'
})
export class PagoService {

	private apiUrl = procesarPagoUrl

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
