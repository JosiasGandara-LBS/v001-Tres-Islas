import { computed, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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

	async setOrderAsChecked(IDOrder: string): Promise<void> {
		const orderDocRef = doc(this._firestore, `orders/${IDOrder}`);
		return updateDoc(orderDocRef, { isChecked: 1 })
		.then(() => {
			console.log('Campo actualizado con éxito');
		})
		.catch(error => {
			console.error('Error actualizando el campo:', error);
		});
	}

	async cancelOrder(IDOrder: string): Promise<void> {
		const orderDocRef = doc(this._firestore, `orders/${IDOrder}`);
		return updateDoc(orderDocRef, { status: 0 })
		.then(() => {
			console.log('Pedido cancelado con éxito');
		})
		.catch(error => {
			console.error('Error cancelando el pedido:', error);
		});
	}

	async setOrderAsPaid(IDOrder: string): Promise<void> {
		const orderDocRef = doc(this._firestore, `orders/${IDOrder}`);
		return updateDoc(orderDocRef, { PaymentPending: false })
			.then(() => {
			})
			.catch(error => {
				console.error('Error pagando el pedido:', error);
			});
	}

	getOrderHistoryByState(state: number) {
	  // No code changes needed; ensure a composite index for status + createdDate in Firestore
	  const ordersCollection = collection(this._firestore, 'orderHistory');
	  const queryByState = query(
		ordersCollection,
		where('status', '==', state),
		orderBy('createdDate', 'asc')
	  );
	  return collectionData(queryByState, { idField: 'id' }) as Observable<any[]>;
	}

	async getOrderByIdHistory(id: string) {
		const orderDoc = doc(this._firestore, `orderHistory/${id}`);
		const docSnap = await getDoc(orderDoc);
		if (docSnap.exists()) {
		  	return { id, ...docSnap.data() };
		} else {
		  	throw new Error('No such document!');
		}
	}

	setOrderAsCheckedHistory(IDOrder: string) {
		const orderDocRef = doc(this._firestore, `orderHistory/${IDOrder}`);
		return updateDoc(orderDocRef, { isChecked: 1 })
		.then(() => {
		})
		.catch(error => {
			console.error('Error actualizando el campo:', error);
		});
	}
}
