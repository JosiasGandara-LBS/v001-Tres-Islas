import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { OrdersService } from '@core/services/orders.service';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { KeysLengthPipe } from '@shared/pipes/keys-length.pipe';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, KeysLengthPipe, TruncatePipe],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {

	@Input() order: any = null;
	@Input() orderStatus: any = 0;
	@Input() isHistory: boolean = false;
	@Output() close = new EventEmitter<void>();

	statuses: { [key: number]: { text: string; color: string, textToChangeStatus: string} } = {
		0 : { text: 'Cancelado', color: 'red-700', textToChangeStatus: 'Pedido cancelado'},
		1 : { text: 'Recibido', color: 'blue-500', textToChangeStatus: 'Preparar pedido'},
		2 : { text: 'Preparando', color: 'yellow-600', textToChangeStatus: 'Entregar pedido'},
		3 : { text: 'Entregado', color: 'gray-500', textToChangeStatus: 'Pedido entregado'}
	};

	constructor(private _ordersService : OrdersService) {}

	ngOnInit(): void {}

	updateStatus(orderID : string) {
		if (this.orderStatus === 3 || this.orderStatus === 0) return;

		if (this.orderStatus === 2 && this.order.pendingPayment) {
			Swal.fire('Acción denegada', 'El pedido no ha sido marcado como pagado', 'warning');
			return;
		}

		this._ordersService.updateOrderStatusField(orderID, 'status', this.orderStatus + 1, this.isHistory).then(() => {
			this.closeModal();
		}).catch((err) => {
			console.error('Error: ', err);
		});
	}

	closeModal() {
		this.close.emit();
	}

	cancelOrder(orderID : string) {
		Swal.fire({
			title: '¿Estás seguro?',
			text: 'El pedido será cancelado',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Sí, cancelar',
			cancelButtonText: 'No, mantener',
			confirmButtonColor: 'red',
			reverseButtons: true
		}).then((result) => {
			if (result.isConfirmed) {
				this.cancelOrderConfirmed(orderID);
			}
		});
	}

	cancelOrderConfirmed(orderID : string) {
		this._ordersService.cancelOrder(orderID, this.isHistory).then(() => {
			Swal.fire('Pedido cancelado', 'El pedido ha sido cancelado', 'success');
			this.closeModal();
		}
		).catch((err: any) => {
			Swal.fire('Error', 'No se pudo cancelar el pedido', 'error');
			console.error('Error: ', err);
		}
		);
	}

	payOrder(orderID : string) {
		Swal.fire({
			title: '¿Estás seguro?',
			text: 'El pedido será marcado como pagado',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Sí, marcar como pagado',
			cancelButtonText: 'No, mantener',
			confirmButtonColor: 'blue',
			reverseButtons: true
		}).then((result) => {
			if (result.isConfirmed) {
				this.payOrderConfirmed(orderID);
			}
		});
	}

	payOrderConfirmed(orderID : string) {
		this._ordersService.setOrderAsPaid(orderID, this.isHistory).then(() => {
			Swal.fire('Pedido pagado', 'El pedido ha sido marcado como pagado', 'success');
			this.closeModal();
		}
		).catch((err: any) => {
			Swal.fire('Error', 'No se pudo marcar como pagado el pedido', 'error');
			console.error('Error: ', err);
		}
		);
	}
}
