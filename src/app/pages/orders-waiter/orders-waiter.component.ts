import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Inject, OnChanges, OnDestroy, OnInit, signal, SimpleChanges } from '@angular/core';
import { Observable, Subscription, filter } from 'rxjs';
import { OrdersService } from '@core/services/orders.service';
import { KeysLengthPipe } from '../../shared/pipes/keys-length.pipe';
import { OrdersComponent } from './components/orders/orders.component';
import { TabViewModule } from 'primeng/tabview';
import { DividerModule } from 'primeng/divider';
import { EstimatedTimeDialogComponent } from './components/estimated-time-dialog/estimated-time-dialog.component';

@Component({
	selector: 'app-orders-waiter',
	standalone: true,
	imports: [CommonModule, OrdersComponent, TabViewModule, DividerModule, EstimatedTimeDialogComponent],
	templateUrl: './orders-waiter.component.html',
	styleUrl: './orders-waiter.component.scss',
})
export class OrdersWaiterComponent implements OnInit, OnDestroy {

	private _orders = signal<any[]>([]);
	public orders = computed(() => this._orders());
	public filteredOrders = computed(() => this.orders()[this.selectedOrder()]);
	subscriptions: Subscription[] = [];

	statuses = [
		{ n: 2, text: 'Preparando', color: 'yellow-600', icon: 'pi pi-clock', hasChanges: false },
		{ n: 0, text: 'Cancelado', color: 'red-700', icon: 'pi pi-ban', hasChanges: false },
		{ n: 3, text: 'Entregado', color: 'gray-500', icon: 'pi pi-check', hasChanges: false }
	];

	showModal: boolean = false;
	showTimeModal = signal<boolean>(false);
	public selectedOrder = signal<number>(2);


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
			const updatedOrders = [...this._orders()];
			updatedOrders[status] = data;
			this._orders.set(updatedOrders);
			if (data.filter((order: any) => order.isChecked === 0).length > 0) {
				this.statuses.find(s => s.n === status)!.hasChanges = true;
			} else {
				this.statuses.find(s => s.n === status)!.hasChanges = false;
			}
		});
		this.subscriptions.push(subscription);
	}

	openTimeModal(): void {
		this.showTimeModal.set(true);
	}

	closeTimeModal(): void {
		this.showTimeModal.set(false);
	}
}