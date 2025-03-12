import { ChangeDetectionStrategy, Component, Inject, inject, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { CommonModule } from '@angular/common';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import { CardPaymentComponent } from './components/card-payment/card-payment.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { PagoService } from '@core/services/pago.service';
import { KitchenStatusService } from '@core/services/kitchen-status.service';
import { OrdersClientService } from '@core/services/orders-client.service';

@Component({
	selector: 'app-checkout',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, DropdownComponent],
	templateUrl: './checkout.component.html',
	styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {

	orderDetailForm: FormGroup;
	savedData: { firstName: string; lastName: string }[] = [];
	totalPriceSignal = inject(CartService).getTotalPriceSignal();

	@ViewChild('cardPaymentModal', { read: ViewContainerRef }) container!: ViewContainerRef;

	constructor(
		private router: Router,
		private fb: FormBuilder,
		private ordersService : OrdersService,
		private ordersClientService : OrdersClientService,
		private cartService : CartService,
		private kitchenStatusService : KitchenStatusService,
		private injector : Injector
	) {
		this.orderDetailForm = this.fb.group({
			client:          ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
  			phoneNumber:     ['', [Validators.required, Validators.pattern('^[0-9]{1,10}$')]],
			assignedToTable: ['', Validators.required],
			paymentMethod:   ['', Validators.required],
			moneyChange:     [],
			totalAmount:     [this.totalPriceSignal(), Validators.required],
			createdDate:     ['01/01/1800, 00:00 a.m.'],
			status:          [1]
		});
	}

	insertarComponente(phone_number: string): Promise<boolean> {
		return new Promise((resolve) => {
			const componentRef = this.container.createComponent(CardPaymentComponent, { injector: this.injector });
			componentRef.instance.phone_number = phone_number;

			// Espera la emisión del valor
			componentRef.instance.isTransactionCompleted.subscribe((valor: boolean) => {
				resolve(valor);
				componentRef?.destroy(); // Elimina el componente después de recibir el valor
			});

			// Opcional: Manejo de cierre sin emitir valor
			componentRef.instance.cerrar.subscribe(() => {
				resolve(false); // Considera `false` si se cierra sin emitir
				componentRef?.destroy();
			});
		});
	}

	async submitForm() {
		if (this.orderDetailForm.valid) {

			if(this.orderDetailForm.get('paymentMethod')?.value === 'Tarjeta débito / crédito') {
				const isValidPayment = await this.insertarComponente(this.orderDetailForm.get('phoneNumber')?.value);

				if(!isValidPayment) {
					return;
				}
			}

			// Obtener solo los campos necesarios del carrito
			const cartItems = this.cartService.getCartItemsToOrder();

			// Obtener el tiempo estimado de la orden
			let estimatedOrdersTime = 0;

			try {
				estimatedOrdersTime = await firstValueFrom(this.kitchenStatusService.getOrdersEstimatedTime());
			} catch (error) {
				return;
			}

			if (estimatedOrdersTime == null) return;

			// Añadir datos derivados como fecha y precio total
			const now = new Date();
			const formattedDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(now);

			// Actualizar valores en el formulario
			this.orderDetailForm.patchValue({ createdDate: formattedDate, totalAmount: this.totalPriceSignal() });

			this.ordersService.addOrder({...this.orderDetailForm.value, foodDishes: cartItems, estimatedOrdersTime: estimatedOrdersTime, isChecked: 0})
			.then((response) => {
				this.ordersClientService.addOrderIdToLocalStorage(response.id);
				this.cartService.clearCart();
				this.router.navigate(['/home']);
			}).catch((error) => {
				console.log('Error al agregar platillo: ', error);
			});

		} else {
			console.log('Formulario inválido');
		}
	}

	goToShoppingCart() {
		this.router.navigate(['shopping-cart']);
	}

	// Eventos para Inputs
	onlyLettersAndSpaces(event: KeyboardEvent) {
		const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
		const key = event.key;
		if (!regex.test(key)) {
		  	event.preventDefault();
		}
	}

	onlyNumbers(event: KeyboardEvent) {
		const regex = /^[0-9]+$/;
		if (!regex.test(event.key)) {
		  	event.preventDefault();
		}
	}

	limitPhoneNumberLength() {
		let phoneControl = this.orderDetailForm.get('phoneNumber');
		if (phoneControl?.value.length > 10) {
		  	phoneControl?.setValue(phoneControl.value.slice(0, 10));
		}
	}
}
