import { effect, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { addDoc, collection, collectionData, doc, docData, Firestore, getDoc, or, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  	providedIn: 'root'
})
export class OrdersService {

	private _firestore = inject(Firestore);
	private _collectionOrders = collection(this._firestore, 'orders');

	currentOrderIds = signal<string[]>(this.getOrderIdsFromLocalStorage());

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

	addOrderIdToLocalStorage(orderId: string) {
        let currentOrderIds = this.getOrderIdsFromLocalStorage();
        currentOrderIds.push(orderId);
        localStorage.setItem('current_orders', JSON.stringify(currentOrderIds));

        // Actualizamos el Signal para disparar el efecto
        this.currentOrderIds.set([...currentOrderIds]);
    }

	// Obtener solo las órdenes que coinciden con los IDs en `current_orders`
	getOrdersByIds(): Signal<any[]> {
		const ids = this.currentOrderIds();  // Obtener los IDs del `Signal`

		// Si no hay IDs, devolvemos un array vacío
		if (ids.length === 0) {
		  return signal([]);
		}

		// Crear la consulta para filtrar las órdenes por los IDs
		const ordersQuery = query(this._collectionOrders, where('id', 'in', ids));

		// Convertimos la consulta a un Signal
		return toSignal(collectionData(ordersQuery, { idField: 'id' }) as Observable<any[]>, { initialValue: [] });
	}

    // Obtener los IDs del localStorage
    getOrderIdsFromLocalStorage(): string[] {
        return JSON.parse(localStorage.getItem('current_orders') || '[]');
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
}
