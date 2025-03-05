import { inject, Injectable } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query, where } from '@angular/fire/firestore';
import { Employee } from '@shared/interfaces/employee.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
	constructor() {}

	private _firestore = inject(Firestore);


	getEmployees(name : string): Observable<Employee[]> {
		const ordersCollection = collection(this._firestore, 'employees');

		const ordersQuery = query(
		ordersCollection, where('name', '==', name), orderBy('name', 'asc')
		);
		return collectionData(ordersQuery, { idField: 'id' }) as Observable<Employee[]>;
	}
}
