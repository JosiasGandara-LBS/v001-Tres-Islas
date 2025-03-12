import { computed, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, collectionData, Firestore, query, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

@Injectable({
  	providedIn: 'root'
})

export class OrdersClientService {

	private _firestore = inject(Firestore);
	private _collectionOrders = collection(this._firestore, 'orders');

	// Signal que almacena los IDs de órdenes, leídos desde localStorage
	currentOrderIds = signal<string[]>(this.getOrderIdsFromLocalStorage());

	// Signal que contendrá las órdenes obtenidas de Firestore
	orders = signal<any[]>([]);

	constructor() {
		// Cada vez que currentOrderIds cambie, se actualiza localStorage
		effect(() => {
			localStorage.setItem('current_orders', JSON.stringify(this.currentOrderIds()));
		});

		// Efecto que se ejecuta cada vez que currentOrderIds cambia
		effect(() => {
			const ids = this.currentOrderIds();

			if (!ids || ids.length === 0) {
				this.orders.set([]);
				return;
			}

			// Firebase permite hasta 10 IDs en una consulta "in"
			const validIds = ids.slice(0, 10);

			// Usamos '__name__' para hacer referencia al ID del documento en Firestore
			const ordersQuery = query(this._collectionOrders, where('__name__', 'in', validIds));

			// Obtenemos el observable de la consulta
			const obs = collectionData(ordersQuery, { idField: 'id' }) as Observable<any[]>;

			// Nos suscribimos al observable para actualizar el signal 'orders'
			const subscription = obs.subscribe(data => {
				this.orders.set(data);
			});

			// Al re-ejecutarse el efecto, se limpia la suscripción anterior
			return () => subscription.unsubscribe();
		},
		{ allowSignalWrites: true });
	}

	// Método para agregar un nuevo ID y actualizar el signal
	addOrderIdToLocalStorage(orderId: string) {
		const updatedIds = [...this.currentOrderIds(), orderId];
		this.currentOrderIds.set(updatedIds);
	}

	// Método para leer los IDs almacenados en localStorage
	private getOrderIdsFromLocalStorage(): string[] {
		const data = localStorage.getItem('current_orders');
		return data ? JSON.parse(data) : [];
	}
}
