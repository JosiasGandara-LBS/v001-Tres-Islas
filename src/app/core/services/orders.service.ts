import { computed, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { addDoc, collection, collectionData, doc, docData, Firestore, getDoc, onSnapshot, or, orderBy, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import Swal from 'sweetalert2';

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

	addOrder(order: any) {
		const ordersCollection = collection(this._firestore, 'orders');
		return addDoc(ordersCollection, order);
	}

	setOrderWithID(id: string, order: any) {
		const ordersCollection = collection(this._firestore, 'orders');
		const docRef = doc(ordersCollection, id);
		return setDoc(docRef, order);
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

	updateOrderPaymentStatus(orderId: string, pendingPayment: boolean): Promise<void> {
		const orderDocRef = doc(this._firestore, `orders/${orderId}`);
		return updateDoc(orderDocRef, { pendingPayment })
	}

	exportOrdersToExcel() {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		const todayString = `${yyyy}-${mm}-${dd}`;

		const statusMap: Record<number, string> = {
			1: 'Recibido',
			2: 'Preparando',
			0: 'Cancelado',
			3: 'Entregado'
		};

		const ordersCollection = collection(this._firestore, 'orders');
		const ordersQuery = query(ordersCollection, orderBy('createdDate', 'asc'));

		collectionData(ordersQuery, { idField: 'id' }).subscribe(async (orders: any[]) => {
			// Filtrar órdenes de tarjeta no confirmadas
			orders = orders.filter(order => {
				if (
					order.paymentMethod?.toLowerCase().includes('tarjeta') &&
					order.pendingPayment === true
				) {
					return false;
				}
				return true;
			});

			if (!orders.length) {
				Swal.fire({
					title: 'No hay órdenes para exportar',
					text: 'No se encontraron órdenes en el día.',
					icon: 'info',
					confirmButtonText: 'Aceptar'
				});
				return;
			}

			orders.sort((a, b) => {
				const dateA = a.createdDate?.seconds ? a.createdDate.seconds * 1000 : a.createdDate;
				const dateB = b.createdDate?.seconds ? b.createdDate.seconds * 1000 : b.createdDate;
				return dateA - dateB;
			});

			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('Órdenes');
			worksheet.columns = [
				{ header: 'Cliente', key: 'cliente', width: 25 },
				{ header: 'Mesa/Para llevar', key: 'mesa', width: 18 },
				{ header: 'Fecha y hora', key: 'fecha', width: 22 },
				{ header: 'Total sin propina', key: 'totalSinPropina', width: 18 },
				{ header: 'Propina', key: 'propina', width: 10 },
				{ header: 'Total con propina', key: 'totalConPropina', width: 18 },
				{ header: 'Método de pago', key: 'metodoPago', width: 20 },
				{ header: 'Status', key: 'status', width: 15 },
				{ header: 'Teléfono', key: 'telefono', width: 15 },
				{ header: 'Para llevar', key: 'paraLlevar', width: 12 },
				{ header: 'Items', key: 'items', width: 40 },
			];

			orders.forEach(order => {
				const createdDate = order.createdDate;
				let fechaHora = '';

				if (createdDate) {
					if (typeof createdDate === 'string') {
						// Si es string, intenta parsear con Date
						const parsed = new Date(createdDate);
						fechaHora = isNaN(parsed.getTime()) ? createdDate : parsed.toLocaleString();
					} else if (createdDate.seconds) {
						// Si es timestamp de Firestore
						fechaHora = new Date(createdDate.seconds * 1000).toLocaleString();
					} else {
						// Otro formato (por si acaso)
						const parsed = new Date(createdDate);
						fechaHora = isNaN(parsed.getTime()) ? '' : parsed.toLocaleString();
					}
				}

				const totalSinPropina = order.totalAmount ?? '';
				const propina = order.tip ?? 0;
				const totalConPropina = (order.totalAmount ?? 0) + (order.tip ?? 0);
				const metodoPago = order.paymentMethod ?? '';
				const status = statusMap[order.status] ?? order.status;
				const telefono = order.phoneNumber ?? '';
				const paraLlevar = order.orderToGo === 1 ? 'Sí' : 'No';
				const mesa = order.assignedToTable ?? (order.orderToGo === 1 ? 'PARA LLEVAR' : '');
				const items = Array.isArray(order.foodDishes)
					? order.foodDishes.map((item: any) =>
						`${item.quantity}x ${item.name}${item.additionalInstructions ? ' (' + item.additionalInstructions + ')' : ''}`
					).join(', ')
					: '';

				worksheet.addRow({
					cliente: order.client ?? order.customerName ?? '',
					mesa,
					fecha: fechaHora,
					totalSinPropina,
					propina,
					totalConPropina,
					metodoPago,
					status,
					telefono,
					paraLlevar,
					items,
				});
			});

			const buffer = await workbook.xlsx.writeBuffer();
			saveAs(
				new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
				`CORTE_ORDENES_${todayString}.xlsx`
			);
		});
	}
}
