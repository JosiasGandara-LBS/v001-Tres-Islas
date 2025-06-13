import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Inject, OnChanges, OnDestroy, OnInit, signal, SimpleChanges } from '@angular/core';
import { Observable, Subscription, filter } from 'rxjs';
import { OrdersService } from '@core/services/orders.service';
import { KeysLengthPipe } from '../../shared/pipes/keys-length.pipe';
import { OrdersComponent } from './components/orders/orders.component';
import { TabViewModule } from 'primeng/tabview';
import { DividerModule } from 'primeng/divider';
import { EstimatedTimeDialogComponent } from './components/estimated-time-dialog/estimated-time-dialog.component';
import { AuthService } from '@core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
	selector: 'app-orders-waiter',
	standalone: true,
	imports: [CommonModule, OrdersComponent, TabViewModule, DividerModule, EstimatedTimeDialogComponent],
	templateUrl: './orders-waiter.component.html',
	styleUrl: './orders-waiter.component.scss',
})
export class OrdersWaiterComponent implements OnInit, OnDestroy {
	private authService = inject(AuthService);
	public isUserAdmin = computed(() => this.authService.isUserAdmin());

	private _orders = signal<any[]>([]);
	public orders = computed(() => this._orders());
	public filteredOrders = computed(() => {
		const orders = this.orders()[this.selectedOrder()] || [];
		return [...orders].sort((a, b) => {
			// createdDate: "10/06/25, 12:53 p.m."
			const parseDate = (str: string) => {
				// Convierte "10/06/25, 12:53 p.m." a Date
				// Formato: dd/MM/yy, hh:mm a.m./p.m.
				if (!str) return 0;
				const [datePart, timePart] = str.split(', ');
				if (!datePart || !timePart) return 0;
				const [day, month, year] = datePart.split('/').map(Number);
				let [time, meridian] = timePart.split(' ');
				let [hours, minutes] = time.split(':').map(Number);
				if (meridian?.toLowerCase().includes('p') && hours < 12) hours += 12;
				if (meridian?.toLowerCase().includes('a') && hours === 12) hours = 0;
				// Año 20xx
				const fullYear = year < 100 ? 2000 + year : year;
				return new Date(fullYear, month - 1, day, hours, minutes).getTime();
			};
			const dateA = parseDate(a.createdDate);
			const dateB = parseDate(b.createdDate);
			return this.sortDirection() === 'asc' ? dateA - dateB : dateB - dateA;
		});
	});
	subscriptions: Subscription[] = [];

	statuses = [
		{ n: 1, text: 'Recibido', color: 'blue-500', classes: 'border-blue-500 shadow-blue-500/50', icon: 'pi pi-inbox', hasChanges: false },
		{ n: 2, text: 'Preparando', color: 'yellow-600', classes: 'border-yellow-600 shadow-yellow-600/50', icon: 'pi pi-clock', hasChanges: false },
		{ n: 0, text: 'Cancelado', color: 'red-500', classes: 'border-red-500 shadow-red-500/50', icon: 'pi pi-ban', hasChanges: false },
		{ n: 3, text: 'Entregado', color: 'green-800', classes: 'border-green-800 shadow-green-800/50', icon: 'pi pi-check', hasChanges: false }
	];

	showModal: boolean = false;
	showTimeModal = signal<boolean>(false);
	public selectedOrder = signal<number>(1);
	public sortDirection = signal<'asc' | 'desc'>('desc');


	constructor(private _ordersService: OrdersService) {}

	changeTab(status: number): void {
		this.selectedOrder.set(status);
	}

	ngOnInit(): void {
		this.statuses.forEach(status => {
			this.getOrdersForStatus(status.n);
		});
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	getOrdersForStatus(status: number): void {
		const subscription = this._ordersService.getOrdersWithStatus(status).subscribe((data: any) => {
			// Filtrar: excluir órdenes con pago con tarjeta y pago pendiente
			const filteredData = data.filter((order: any) => {
				// Asumiendo que order.paymentMethod === 'tarjeta' y order.paymentStatus === 'pendiente'
				return !(order.paymentMethod === "Tarjeta débito / crédito" && order.pendingPayment === true);
			});
			const updatedOrders = [...this._orders()];
			updatedOrders[status] = filteredData;
			this._orders.set(updatedOrders);
			if (filteredData.filter((order: any) => order.isChecked === 0).length > 0) {
				this.statuses.find(s => s.n === status)!.hasChanges = true;
			} else {
				this.statuses.find(s => s.n === status)!.hasChanges = false;
			}
		});
		this.subscriptions.push(subscription);
	}

	exportToExcel(): void {
		Swal.fire({
			title: 'Exportar órdenes',
			text: '¿Deseas exportar las órdenes a Excel?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Sí, exportar',
			cancelButtonText: 'Cancelar'
		}).then((result) => {
			if (result.isConfirmed) {
				this._ordersService.exportOrdersToExcel();
			}
		});
	}

	openTimeModal(): void {
		this.showTimeModal.set(true);
	}

	closeTimeModal(): void {
		this.showTimeModal.set(false);
	}

	setSortDirection(direction: 'asc' | 'desc') {
		this.sortDirection.set(direction);
	}
}