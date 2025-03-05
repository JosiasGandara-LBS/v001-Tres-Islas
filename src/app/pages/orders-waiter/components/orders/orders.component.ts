import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrdersService } from '@core/services/orders.service';
import { CommonModule } from '@angular/common';
import { KeysLengthPipe } from '@shared/pipes/keys-length.pipe';
import { OrderDetailComponent } from '../order-detail/order-detail.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, KeysLengthPipe, OrderDetailComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit, OnChanges {

	@Input() orderStatus: number = 1;

	orders!: any[];
	subscription!: Subscription;
	showModal: boolean = false;
	selectedOrder: any = null;

	statuses: { [key: number] : { text: string; color: string } } = {
		0: { text: 'Cancelado', color: 'red-700'},
		1: { text: 'Por pagar', color: 'blue-800'},
		2: { text: 'Preparando', color: 'yellow-600'},
		3: { text: 'Listo para entregar', color: 'green-700'},
		4: { text: 'Entregado', color: 'gray-500'}
	};

	constructor(private _ordersService: OrdersService) {}

	ngOnInit(): void {
		this.getOrdersForStatus(this.orderStatus);
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['orderStatus'] && !changes['orderStatus'].isFirstChange()) {
			this.getOrdersForStatus(this.orderStatus);
		}
	}

	ngOnDestroy(): void {
		if (this.subscription) this.subscription.unsubscribe();
	}

	getOrdersForStatus(status: number): void {
		if (this.subscription) this.subscription.unsubscribe();

		this.subscription = this._ordersService.getOrdersWithStatus(status).subscribe((data: any) => {
			this.orders = data;
			console.log('Datos actualizados: ', this.orders);
		});
	}

	async openOrderDetail(orderID: any) {
		try {
		  	const order = await this._ordersService.getOrderById(orderID);
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
