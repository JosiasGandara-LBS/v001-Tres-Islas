import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrdersService } from '@core/services/orders.service';
import { CommonModule } from '@angular/common';
import { KeysLengthPipe } from '@shared/pipes/keys-length.pipe';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, KeysLengthPipe, OrderDetailComponent, TruncatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {

	@Input() orders: any[] = [];
	@Input() orderStatus: number = 1;
	@Input() isHistory: boolean = false;

	subscription!: Subscription;
	showModal: boolean = false;
	selectedOrder: any = null;

	statuses: { [key: number] : { text: string; color: string } } = {
		0: { text: 'Cancelado', color: 'red-700'},
		1: { text: 'Recibido', color: 'blue-700'},
		2: { text: 'Preparando', color: 'yellow-600'},
		3: { text: 'Entregado', color: 'gray-500'}
	};

	constructor(private _ordersService: OrdersService) {}

	async openOrderDetail(orderID: any) {
		try {
			let order: any
			if (this.isHistory) {
				order = await this._ordersService.getOrderByIdHistory(orderID);
				if (order.isChecked === 0) {
					this._ordersService.setOrderAsCheckedHistory(orderID);
				}
			}
			else {
				order = await this._ordersService.getOrderById(orderID);
				if (order.isChecked === 0) {
					this._ordersService.setOrderAsChecked(orderID);
				}
			}
		  	this.selectedOrder = order;
		  	this.showModal = true;
		} catch (error) {
		  	console.error('Error al obtener la orden:', error);
		}
	}

	closeModal() {
		this.showModal = false;
		this.selectedOrder = null;
	}

}
