import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { OrdersService } from '@core/services/orders.service';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { KeysLengthPipe } from '@shared/pipes/keys-length.pipe';
import { CommonModule } from '@angular/common';

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
	@Output() close = new EventEmitter<void>();

	statuses: { [key: number]: { text: string; color: string, textToChangeStatus: string} } = {
		0 : { text: 'Cancelado', color: 'red-700', textToChangeStatus: 'Pedido cancelado'},
		1 : { text: 'Por pagar', color: 'blue-800', textToChangeStatus: 'Pasar a preparación'},
		2 : { text: 'Preparando', color: 'yellow-600', textToChangeStatus: 'Listo para entregar'},
		3 : { text: 'Listo para entregar', color: 'green-700', textToChangeStatus: 'Entregado!'},
		4 : { text: 'Entregado', color: 'gray-500', textToChangeStatus: 'Pedido entregado'}
	};

	constructor(private _ordersService : OrdersService) {}

	ngOnInit(): void {}

	updateStatus(orderID : string) {
		this._ordersService.updateOrderStatusField(orderID, 'status', this.orderStatus + 1).then(() => {
			console.log('Status actualizado correctamente');
			this.closeModal();
		}).catch((err) => {
			console.log('Error: ', err);
		});
	}

	closeModal() {
		this.close.emit();
	}

}
