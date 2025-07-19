import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { OrdersService } from '@core/services/orders.service';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { KeysLengthPipe } from '@shared/pipes/keys-length.pipe';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { DropdownActionRequiredComponent } from '../dropdown-action-required/dropdown-action-required.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, KeysLengthPipe, TruncatePipe, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {

	@Input() order: any = null;
	@Input() orderStatus: any = 0;
	@Output() close = new EventEmitter<void>();

	showModal = false;

	statuses: { [key: number]: { text: string; color: string, textToChangeStatus: string} } = {
		0 : { text: 'Cancelado', color: 'red-700', textToChangeStatus: 'Pedido cancelado'},
		1 : { text: 'Recibido', color: 'blue-500', textToChangeStatus: 'Preparar pedido'},
		2 : { text: 'Preparando', color: 'yellow-600', textToChangeStatus: 'Entregar pedido'},
		3 : { text: 'Entregado', color: 'gray-500', textToChangeStatus: 'Pedido entregado'},
		4 : { text: 'Acción requerida', color: 'orange-500', textToChangeStatus: 'Entregar pedido'}
	};

	actionsRequired = [
		{ value: 0, description: 'No se encontró su mesa, favor de pasar a cocina.' },
		{ value: 1, description: 'Cliente se retiró del lugar sin recoger el pedido.' },
		{ value: 2, description: 'Mesa vacía, sin rastro del cliente.' },
	];

	selectedAction: number | null = null;

	constructor(private _ordersService : OrdersService) {}

	ngOnInit(): void {}

	updateStatus(orderID : string) {
		if (this.orderStatus === 3 || this.orderStatus === 0) return;

		if (this.orderStatus === 2 && this.order.pendingPayment) {
			Swal.fire('Acción denegada', 'El pedido no ha sido marcado como pagado', 'warning');
			return;
		}

		if (this.orderStatus === 4 && this.order.pendingPayment) {
			Swal.fire('Acción denegada', 'El pedido no ha sido marcado como pagado', 'warning');
			return;
		}

		(this.orderStatus === 4) ? this.orderStatus-- : this.orderStatus++;

		this._ordersService.updateOrderStatusField(orderID, 'status', this.orderStatus).then(() => {
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
		this._ordersService.cancelOrder(orderID).then(() => {
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
		this._ordersService.setOrderAsPaid(orderID).then(() => {
			Swal.fire('Pedido pagado', 'El pedido ha sido marcado como pagado', 'success');
			this.closeModal();
		}
		).catch((err: any) => {
			Swal.fire('Error', 'No se pudo marcar como pagado el pedido', 'error');
			console.error('Error: ', err);
		}
		);
	}

	chatOnWhatsapp(phoneNumber: string) {
		const message = `Hola, tengo una consulta sobre tu pedido.`;
		const url = `https://wa.me/52${phoneNumber}?text=${encodeURIComponent(message)}`;
		window.open(url, '_blank');
	}

	openModalActionRequired() {
    	this.showModal = true;
	}

	closeModalActionRequired() {
		this.showModal = false;
	}

	async openSweetModal(orderID: string) {

		const optionsHtml = this.actionsRequired.map(
			(a) =>
			`<div class="flex items-center my-2 text-base font-light">
				<input type="radio" name="action" value="${a.value}" id="radio-${a.value}" class="mr-2">
				<label for="radio-${a.value}">${a.description}</label>
			</div>`
		).join('');

		const { isConfirmed } = await Swal.fire({
			title: '¡Acción requerida!',
			icon: 'warning',
			html: `
				<p class="text-lg mb-5 font-medium">¿Cuál acción se ajusta más al problema?</p>
				${optionsHtml}
			`,
			width: '28rem',
			showCancelButton: true,
			cancelButtonText: 'Regresar',
			confirmButtonText: 'Solicitar acción requerida',
			confirmButtonColor: 'orange',
			reverseButtons: true,

			preConfirm: () => {
				const selected = (document.querySelector('input[name="action"]:checked') as HTMLInputElement)?.value;
				if (!selected) Swal.showValidationMessage('Debes seleccionar una opción');
				return selected;
			},
		});

		if (isConfirmed) {
			const selectedValue = (document.querySelector('input[name="action"]:checked') as HTMLInputElement)?.value;

			const selectedNumber = parseInt(selectedValue, 10);
			const selectedAction = this.actionsRequired.find(a => a.value === selectedNumber);
			const description = selectedAction?.description ?? 'Descripción no encontrada';

			this._ordersService.updateOrderStatusAndActionRequiredField(orderID, 4, description).then(() => {
				this.closeModal();
				Swal.fire('Hecho!', 'Se envió la acción requerida.', 'success');
			}).catch((err) => {
				console.error('Error: ', err);
			});

		}
	}
}
