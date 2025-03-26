import { Component, computed, OnInit, signal } from '@angular/core';
import { OrdersComponent } from '../../orders-waiter/components/orders/orders.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [OrdersComponent, CommonModule],
  templateUrl: './orders-history.component.html',
  styleUrl: './orders-history.component.scss'
})
export class OrdersHistoryComponent implements OnInit {
	private _orders = signal<any[]>([]);
	public orders = computed(() => this._orders());
	public filteredOrders = computed(() => this.orders());

	private _selectedOrder = signal<number>(0);
	public selectedOrder = computed(() => this._selectedOrder());

	ngOnInit(): void {
		
	}

}
