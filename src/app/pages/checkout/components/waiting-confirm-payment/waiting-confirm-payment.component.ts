import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrdersService } from '@core/services/orders.service';
import { PagoService } from '@core/services/pago.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-waiting-confirm-payment',
  standalone: true,
  imports: [LoadingSpinnerComponent, CommonModule],
  templateUrl: './waiting-confirm-payment.component.html',
  styleUrl: './waiting-confirm-payment.component.scss'
})
export class WaitingConfirmPaymentComponent implements OnInit {
	constructor() {}
	private router = inject(Router);
	private ordersService = inject(OrdersService);
	private pagoService = inject(PagoService);

	ngOnInit(): void {
		const urlTree = this.router.parseUrl(this.router.url);

		const orderId = urlTree.queryParams['order_id'];
		const transactionID = urlTree.queryParams['id'];

		if (!orderId) {
			Swal.fire({
				title: 'Error',
				text: 'No se pudo encontrar la orden.',
				icon: 'error',
				confirmButtonText: 'Aceptar'
			}).then(() => {
				this.router.navigate(['/home']);
			});
			return;
		}
		if (!transactionID) {
			Swal.fire({
				title: 'Error',
				text: 'No se pudo encontrar el ID de la transacción.',
				icon: 'error',
				confirmButtonText: 'Aceptar'
			}).then(() => {
				this.router.navigate(['/home']);
			});
			return;
		}
		this.checkPaymentStatus(orderId, transactionID);
	}

	goHome() {
		this.router.navigate(['/home']);
	}

	checkPaymentStatus(orderId: string, transactionID: string) {
		this.ordersService.getOrderById(orderId).then(order => {
			if(order) {
				if (order.transactionID !== transactionID) {
					Swal.fire({
						title: 'Transacción no válida',
						text: 'La transacción proporcionada no coincide con la orden. Por favor, verifique los detalles de su pago.',
						icon: 'error',
						confirmButtonText: 'Aceptar'
					}).then(() => {
						this.router.navigate(['/home']);
					});
					return;
				}
				if (!order.transactionID) {
					Swal.fire({
						title: 'No existe transacción de pago',
						text: 'No se ha encontrado una transacción de pago para esta orden. Por favor, verifique que su pago haya sido con tarjeta. Si es así, favor de contactarse con soporte.',
						icon: 'warning',
						confirmButtonText: 'Aceptar'
					}).then(() => {
						this.router.navigate(['/home']);
					});
					return;
				}
				if (order.pendingPayment === false) {
					Swal.fire({
						title: 'Pago confirmado',
						text: 'Su pago ya ha sido confirmado. Gracias por su compra.',
						icon: 'success',
						confirmButtonText: 'Aceptar'
					}).then(() => {
						this.router.navigate(['/home']);
					});
					return;
				} else {
					this.pagoService.checkPaymentStatus(transactionID).subscribe((response: any) => {
						if (response.status === 'completed') {
							this.ordersService.updateOrderPaymentStatus(orderId, false).then(() => {
								Swal.fire({
									title: 'Pago confirmado',
									text: 'Su pago ha sido confirmado exitosamente. Gracias por su compra.',
									icon: 'success',
									confirmButtonText: 'Aceptar'
								}).then(() => {
									this.ordersService.setOrderAsPaid(orderId).then(() => {
										localStorage.removeItem('cartItems');
										this.router.navigate(['/home']);
									});
								});
							});
						} else if (
							response.status === 'failed' ||
							response.status === 'cancelled' ||
							response.status === 'expired' ||
							response.status === 'refunded' ||
							response.status === 'chargeback'
						) {
							Swal.fire({
								title: 'Pago no realizado',
								text: 'El pago no se pudo completar. Por favor, intente nuevamente o contacte a soporte.',
								icon: 'error',
								confirmButtonText: 'Aceptar'
							}).then(() => {
								this.router.navigate(['/home']);
							});
						} else if (
							response.status === 'in_progress' ||
							response.status === 'charge_pending'
						) {}
						else {
							Swal.fire({
								title: 'Estado de pago desconocido',
								text: 'El estado del pago es desconocido. Por favor, intente nuevamente más tarde o contacte a soporte.',
								icon: 'warning',
								confirmButtonText: 'Aceptar'
							}).then(() => {
								this.router.navigate(['/home']);
								return;
							});
						}
					});
				}
			}
		}).catch(error => {
			Swal.fire({
				title: 'Error al verificar el pago',
				text: 'Ocurrió un error al intentar verificar el estado del pago. Por favor, intente nuevamente más tarde.',
				icon: 'error',
				confirmButtonText: 'Aceptar'
			}).then(() => {
				this.router.navigate(['/home']);
			});
		});
	}

}
