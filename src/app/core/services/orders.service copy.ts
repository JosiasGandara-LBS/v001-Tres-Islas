import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, Firestore, getDoc, or, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  	providedIn: 'root'
})
export class OrdersService {

	private _firestore = inject(Firestore);

	constructor() {}

	// Escucha en tiempo real los cambios en la colección
	getOrdersWithStatus(status : number): Observable<any[]> {
		const ordersCollection = collection(this._firestore, 'orders');
		// Filtrar por status igual a 1 y ordenar por fecha de creación
		const ordersQuery = query(
			ordersCollection, where('status', '==', status), orderBy('createdDate', 'asc')
		);
		return collectionData(ordersQuery, { idField: 'id' }) as Observable<any[]>;
	}

	getOrdersWithAnyParameter(): Observable<any[]> {
		const ordersCollection = collection(this._firestore, 'orders');
		// Filtrar por status igual a 1 y ordenar por fecha de creación
		const ordersQuery = query(
			ordersCollection, orderBy('createdDate', 'asc')
		);
		return collectionData(ordersQuery, { idField: 'id' }) as Observable<any[]>;
	}

	async getOrderById(id: string): Promise<any> {
		const orderDoc = doc(this._firestore, `orders/${id}`);
		const docSnap = await getDoc(orderDoc);
		if (docSnap.exists()) {
		  	return { id, ...docSnap.data() };
		} else {
		  	throw new Error('No such document!');
		}
	}

	addOrder(order : any[]) {
		const ordersCollection = collection(this._firestore, 'orders');
		return addDoc(ordersCollection, order);
	}

	async updateOrderStatusField(IDOrder: string, fieldName: string, newValue: any): Promise<void> {
		const orderDocRef = doc(this._firestore, `orders/${IDOrder}`);
		return updateDoc(orderDocRef, { [fieldName]: newValue })
		.then(() => {
			console.log('Campo actualizado con éxito');
		})
		.catch(error => {
			console.error('Error actualizando el campo:', error);
		});
	}

}
