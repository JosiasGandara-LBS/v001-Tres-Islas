import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { OrdersComponent } from '../../orders-waiter/components/orders/orders.component';
import { CommonModule } from '@angular/common';
import { OrdersService } from '@core/services/orders.service';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [OrdersComponent, CommonModule, DividerModule],
  templateUrl: './orders-history.component.html',
  styleUrl: './orders-history.component.scss'
})
export class OrdersHistoryComponent implements OnInit {
	private ordersService = inject(OrdersService)

	private _orders = signal<any[]>([]);
	public orders = computed(() => this._orders());
	public filteredOrders = computed(() => this.orders());

	private _selectedState = signal<number>(0);
	public selectedState = computed(() => this._selectedState());

	statuses = [
		{ n: 2, text: 'Preparando', color: 'yellow-600', icon: 'pi pi-clock', hasChanges: false },
		{ n: 0, text: 'Cancelado', color: 'red-700', icon: 'pi pi-ban', hasChanges: false },
		{ n: 3, text: 'Entregado', color: 'gray-500', icon: 'pi pi-check', hasChanges: false }
	];

	ngOnInit(): void {
		this.getOrders();
	}

	getOrders() {
		this.ordersService.getOrderHistoryByState(this.selectedState()).subscribe((data) => {
			this._orders.set(data);
		});
	}

	changeSelectedState(state: number) {
		this._selectedState.set(state);
		this.getOrders();
	}
}
