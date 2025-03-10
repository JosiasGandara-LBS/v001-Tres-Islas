import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { OrdersService } from '@core/services/orders.service';
import { DataViewModule } from 'primeng/dataview';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { StatusToTextPipe } from '@shared/pipes/status-to-text.pipe';
import { Router } from '@angular/router';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';


@Component({
  selector: 'app-orders-client-list',
  standalone: true,
  imports: [CommonModule, DataViewModule, ButtonModule, DividerModule, CardModule, StatusToTextPipe, TruncatePipe],
  templateUrl: './orders-client-list.component.html',
  styleUrl: './orders-client-list.component.scss'
})
export class OrdersClientListComponent implements OnInit {

	private ordersService = inject(OrdersService);
	private router = inject(Router);

	private ordersIds: string[] = [];
	private _orders = signal<any[]>([]);
	public orders = computed(() => this._orders());

	public loadingOrders = signal<boolean>(true);

	ngOnInit(): void {
		this.loadingOrders.set(true);
		const storedOrders = localStorage.getItem('currentOrders');
		if (storedOrders) {
			this.ordersIds = JSON.parse(storedOrders);
			this.getOrders();
		}
		this.loadingOrders.set(false);
	}

	private getOrders(): void {
		for (const orderId of this.ordersIds) {
			this.ordersService.getOrderById(orderId).then(order => {
				this._orders.set([...this._orders(), order]);
			});
		}
		console.log('Orders: ', this.orders());
	}

	public viewOrder(orderId: number): void {
	}

}
