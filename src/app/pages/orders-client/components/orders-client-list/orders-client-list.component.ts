import { CommonModule } from '@angular/common';
import { Component, computed, inject, Signal, signal } from '@angular/core';
import { OrdersService } from '@core/services/orders.service';
import { DataViewModule } from 'primeng/dataview';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { StatusToTextPipe } from '@shared/pipes/status-to-text.pipe';
import { Router } from '@angular/router';


@Component({
  selector: 'app-orders-client-list',
  standalone: true,
  imports: [CommonModule, DataViewModule, ButtonModule, DividerModule, CardModule, StatusToTextPipe],
  templateUrl: './orders-client-list.component.html',
  styleUrl: './orders-client-list.component.scss'
})
export class OrdersClientListComponent {

	private ordersService = inject(OrdersService);
	private router = inject(Router);

	private _orders = signal<any[]>([]);
	public orders = computed(() => this._orders());

	ngOnInit(): void {
		this._orders.set([
			{
				id: 1,
				name: 'Order 1',
				total: 500,
				status: 'pending',
				time_estimate: '12:35',
				items: [{ name: 'veggie', qty: 2 }],
			},
			{
				id: 2,
				name: 'Order 2',
				total: 1200,
				status: 'payment-pending',
				time_estimate: '12:05',
				items: [{ name: 'pasta', qty: 2 }],
			},
			{
				id: 3,
				name: 'Order 3',
				total: 800,
				status: 'delivered',
				time_estimate: '11:15',
				items: [{ name: 'pizza', qty: 2 }],
			}
		]);
	}

	public viewOrder(orderId: number): void {
		this.router.navigate(['/orders-client/', orderId]);
	}

}
