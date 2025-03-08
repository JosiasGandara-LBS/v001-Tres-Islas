import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagoService {

	private apiUrl = 'https://procesarpago-wjc3vrdlna-uc.a.run.app';

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
