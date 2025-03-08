import { CommonModule } from '@angular/common';
import { Component, computed, inject, Signal, signal } from '@angular/core';
import { OrdersService } from '@core/services/orders.service';

import { DataViewModule } from 'primeng/dataview';

@Component({
  selector: 'app-orders-client-list',
  standalone: true,
  imports: [CommonModule, DataViewModule],
  templateUrl: './orders-client-list.component.html',
  styleUrl: './orders-client-list.component.scss'
})
export class OrdersClientListComponent {

	private ordersService = inject(OrdersService);

	private _orders: Signal<any[]> = signal([]);
	public orders = computed(() => this._orders());

}
