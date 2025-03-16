import { ChangeDetectionStrategy, Component, Inject, inject, Injector, OnInit, signal, ViewChild, ViewContainerRef } from '@angular/core';
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
import Swal from 'sweetalert2';
import { DropdownTogoComponent } from './components/dropdown-togo/dropdown-togo.component';

@Component({
	selector: 'app-checkout',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, DropdownComponent, DropdownTogoComponent],
	templateUrl: './checkout.component.html',
	styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {

	orderDetailForm: FormGroup;
	savedData: { firstName: string; lastName: string }[] = [];
	totalPriceSignal = inject(CartService).getTotalPriceSignal();
	public isModalVisible = signal(false);

	paymentMethodDisabled: boolean = false;

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
			phoneNumber:     ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
			assignedToTable: ['', Validators.required],
			orderToGo:       [Validators.required],
			paymentMethod:   [{ value: '', disabled: true }, Validators.required],
			tenderedAmount:  [],
			totalAmount:     [this.totalPriceSignal(), Validators.required],
			createdDate:     ['01/01/1800, 00:00 a.m.'],
			status:          [1]
		});
	}

	ngOnInit(): void {
		this.orderDetailForm.get('orderToGo')?.valueChanges.subscribe(value => {
			if (value) {
				this.orderDetailForm.get('paymentMethod')?.enable();
			} else {
				this.orderDetailForm.get('paymentMethod')?.disable();
			}
		});
	}

	insertarComponente(phone_number: string): Promise<boolean> {
		return new Promise((resolve) => {
			const componentRef = this.container.createComponent(CardPaymentComponent, { injector: this.injector });
			componentRef.instance.phone_number = phone_number;

			componentRef.instance.isTransactionCompleted.subscribe((valor: boolean) => {
				resolve(valor);
				componentRef?.destroy();
			});

			componentRef.instance.cerrar.subscribe(() => {
				resolve(false);
				componentRef?.destroy();
			});
		});
	}

	async submitForm() {
		const paymentMethod = this.orderDetailForm.get('paymentMethod')?.value;
		const tenderedAmount = this.orderDetailForm.get('tenderedAmount')?.value;
		const totalAmount = this.totalPriceSignal();

		// Validación de pago con tarjeta
		if (paymentMethod === 'Tarjeta débito / crédito' && !(await this.validarPagoConTarjeta())) {
		  	return;
		}

		// Validación de pago en efectivo
		if (paymentMethod === 'Dinero en efectivo' && tenderedAmount < totalAmount) {
			this.mostrarModalError();
			return;
		}

		// Validar formulario antes de proceder
		if (!this.orderDetailForm.valid) {
			this.mostrarModalError();
			return;
		}

		// Obtener datos para la orden
		const cartItems = this.cartService.getCartItemsToOrder();
		const estimatedOrdersTime = await this.obtenerTiempoEstimadoOrden();
		if (estimatedOrdersTime == null) return;

		// Formatear fecha actual
		const formattedDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

		// Actualizar valores en el formulario
		this.orderDetailForm.patchValue({ createdDate: formattedDate, totalAmount });

		// Enviar orden
		this.registrarOrden(cartItems, estimatedOrdersTime);
	}

	private async validarPagoConTarjeta(): Promise<boolean> {
		const phoneNumber = this.orderDetailForm.get('phoneNumber')?.value;
		return this.insertarComponente(phoneNumber);
	}

	private mostrarModalError() {
		this.isModalVisible.set(true);
		this.orderDetailForm.markAllAsTouched();
	}

	private async obtenerTiempoEstimadoOrden(): Promise<number | null> {
		try {
		  	return await firstValueFrom(this.kitchenStatusService.getOrdersEstimatedTime());
		} catch (error) {
			console.error("Error al obtener tiempo estimado de la orden:", error);
			return null;
		}
	}

	private registrarOrden(cartItems: any[], estimatedOrdersTime: number) {
		this.ordersService.addOrder({
			...this.orderDetailForm.value,
			foodDishes: cartItems,
			estimatedOrdersTime,
			isChecked: 0,
		})
		.then((response) => {
			this.ordersClientService.addOrderIdToLocalStorage(response.id);
			this.cartService.clearCart();
			this.router.navigate(['/home']);
		})
		.catch((error) => console.error("Error al agregar platillo:", error));
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

	closeMessage() {
		this.isModalVisible.set(false);
	}
}
