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

	subscription!: Subscription;
	showModal: boolean = false;
	selectedOrder: any = null;

	statuses: { [key: number] : { text: string; color: string } } = {
		0: { text: 'Cancelado', color: 'red-700'},
		1: { text: 'Por pagar', color: 'blue-700'},
		2: { text: 'Preparando', color: 'yellow-600'},
		3: { text: 'Entregado', color: 'gray-500'}
	};

	constructor(private _ordersService: OrdersService) {}

	async openOrderDetail(orderID: any) {
		try {
		  	const order = await this._ordersService.getOrderById(orderID);
		  	this.selectedOrder = order;
		  	this.showModal = true;
			this._ordersService.setOrderAsChecked(orderID);
		} catch (error) {
		  	console.error('Error al obtener la orden:', error);
		}
	}

	closeModal() {
		this.showModal = false;
		this.selectedOrder = null;
	}

}
