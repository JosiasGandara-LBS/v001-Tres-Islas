import { computed, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { addDoc, collection, collectionData, doc, docData, Firestore, getDoc, onSnapshot, or, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';

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
			return;
		})
		.catch(error => {
			console.error('Error actualizando el campo:', error);
		});
	}

	async setOrderAsChecked(IDOrder: string): Promise<void> {
		const orderDocRef = doc(this._firestore, `orders/${IDOrder}`);
		return updateDoc(orderDocRef, { isChecked: 1 })
		.then(() => {
			return;
		})
		.catch(error => {
			console.error('Error actualizando el campo:', error);
		});
	}

	async cancelOrder(IDOrder: string): Promise<void> {
		const orderDocRef = doc(this._firestore, `orders/${IDOrder}`);
		return updateDoc(orderDocRef, { status: 0 })
		.then(() => {
			return;
		})
		.catch(error => {
			console.error('Error cancelando el pedido:', error);
		});
	}

	async setOrderAsPaid(IDOrder: string): Promise<void> {
		const orderDocRef = doc(this._firestore, `orders/${IDOrder}`);
		return updateDoc(orderDocRef, { pendingPayment: false })
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

	// Método para verificar si un ID existe en la colección
	validateCurrentOrdersIds(ids: string[]): Observable<string[]> {
		const ordersCollection = collection(this._firestore, 'orders');

		// Consulta Firestore para obtener documentos cuyo ID esté en la lista de 'ids'
		const ordersQuery = query(
			ordersCollection,
			where('id', 'in', ids)
		);

		// Realiza la consulta y retorna los IDs válidos encontrados en la base de datos
		return collectionData(ordersQuery, { idField: 'id' }).pipe(
			map((orders: any[]) => {
				return orders.map(order => order.id); // Solo devolver los IDs que existen
			})
		);
	}

	// Método para escuchar en tiempo real los cambios en la colección "orders"
	listenForOrdersChanges(): Observable<any[]> {
		const ordersCollection = collection(this._firestore, 'orders');
		const ordersQuery = query(ordersCollection, orderBy('createdDate', 'asc'));

		return new Observable<any[]>((observer) => {
			const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
				const orders: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
				observer.next(orders);
			});

			// Devolver la función de limpieza
			return () => unsubscribe();
		});
	}
}
