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
import { TransactionData } from '@core/models/transaction-data';

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

	tiempoEstimado !: Observable<number | null>;

	modalVisible = this.cartService.modalVisible;

	statusCashPaymentToGoStatus = this.kitchenStatusService.cashPaymentStatusSignal;

	public isModalVisible = signal(false);
	public configModal !: number;
	public errorsModal !: string;

	paymentMethodDisabled: boolean = false;

	public tables = signal<string[]>([]);

	@ViewChild('cardPaymentModal', { read: ViewContainerRef }) container!: ViewContainerRef;

	constructor(
		private router: Router,
		private fb: FormBuilder,
		private ordersService : OrdersService,
		private ordersClientService : OrdersClientService,
		private cartService : CartService,
		public kitchenStatusService : KitchenStatusService,
		private injector : Injector
	) {
		this.orderDetailForm = this.fb.group({
			client:          ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')]],
			phoneNumber:     ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
			assignedToTable: ['', Validators.required],
			orderToGo:       [null, Validators.required],
			paymentMethod:   [{ value: '', disabled: true }, Validators.required],
			tenderedAmount:  [],
			pendingPayment:  [],
			totalAmount:     [this.totalPriceSignal(), Validators.required],
			createdDate:     ['01/01/1800, 00:00 a.m.'],
			status:          [2]
		});
	}

	ngOnInit() {
		this.tiempoEstimado = this.kitchenStatusService.getOrdersEstimatedTime();

		this.orderDetailForm.get('orderToGo')?.valueChanges.subscribe(value => {
			const assignedToTableControl = this.orderDetailForm.get('assignedToTable');

			if (value !== null && value !== undefined) {
				if(value === 1) {
					assignedToTableControl?.patchValue(null);
				}
				this.orderDetailForm.get('paymentMethod')?.enable();
			} else {
				this.orderDetailForm.get('paymentMethod')?.disable();
			}
			this.orderDetailForm.get('paymentMethod')?.setValue(null);
		});

		this.kitchenStatusService.getTables().subscribe((tables: string[]) => {
			this.tables.set(tables);
			this.orderDetailForm.get('assignedToTable')?.setValue(null);
		});
	}

	get isTableDropdownDisabled(): boolean {
		return (this.orderDetailForm.get('orderToGo')?.value == null || this.orderDetailForm.get('orderToGo')?.value == 1) ? true : false ;
	}

	insertarComponente(phone_number: string): Promise<boolean> {
		return new Promise((resolve) => {
			const componentRef = this.container.createComponent(CardPaymentComponent, { injector: this.injector });
			componentRef.instance.phone_number = phone_number;

			componentRef.instance.isTransactionCompleted.subscribe((valor: TransactionData) => {
				resolve(valor.success);
				if (!valor.success) {
					this.errorsModal = valor.message;
					this.isModalVisible.set(true);
					this.configModal = 4;
				}
				componentRef?.destroy();
			});

			componentRef.instance.cerrar.subscribe(() => {
				resolve(false);
				componentRef?.destroy();
			});
		});
	}

	showModalBeforeOrder(configNumber: number) {

		if (this.kitchenStatusService.isKitchenOpen()) {
			this.isModalVisible.set(true);
			this.configModal = configNumber;
		} else {
			// Si la cocina está cerrada, mostrar un mensaje
			alert('La cocina está cerrada. No puedes hacer el pedido ahora.');
		}

		let errorFields = "";

		if(!this.orderDetailForm.get("client")?.valid) {
			errorFields += "- Nombre del cliente\n";
		}
		if(!this.orderDetailForm.get("phoneNumber")?.valid) {
			errorFields += "- Número de teléfono\n";
		}
		if(!this.orderDetailForm.get("assignedToTable")?.valid) {
			errorFields += "- Número de mesa\n";
		}
		if(!this.orderDetailForm.get("orderToGo")?.valid) {
			errorFields += "- Tipo de orden\n";
		}
		if(!this.orderDetailForm.get("paymentMethod")?.valid) {
			errorFields += "- Método de pago\n";
		}
		if(this.orderDetailForm.get("tenderedAmount")?.value < this.totalPriceSignal() || this.orderDetailForm.get("tenderedAmount")?.value === null) {
			errorFields += "- Tu pago no puede ser menor al total\n"
		}

		this.isModalVisible.set(true);
		this.configModal = configNumber;
		this.errorsModal = errorFields;
	}

	async submitForm() {
		if (!this.kitchenStatusService.isKitchenOpen()) {
			alert('La cocina está cerrada. No puedes hacer el pedido ahora.');
			return;
		}

		this.isModalVisible.set(false);

		const paymentMethod = this.orderDetailForm.get('paymentMethod')?.value;
		const tenderedAmount = this.orderDetailForm.get('tenderedAmount')?.value;
		const totalAmount = this.totalPriceSignal();
		let pendingPayment = true;

		// Validación de pago con tarjeta
		if (paymentMethod === 'Tarjeta débito / crédito') {
			const pagoValido = await this.validarPagoConTarjeta();
			if (!pagoValido) return;
			pendingPayment = false;
		}

		// Validación de pago en efectivo
		if (paymentMethod === 'Dinero en efectivo' && tenderedAmount < totalAmount) {
			this.showModalBeforeOrder(2);
			return;
		}

		if(this.orderDetailForm.get('orderToGo')?.value == 1) {
			this.orderDetailForm.patchValue({
				assignedToTable: 'PARA LLEVAR'
			});
		}

		// Validar formulario antes de proceder
		if (!this.orderDetailForm.valid) {
			this.showModalBeforeOrder(2);
			return;
		}

		// Obtener datos para la orden
		const cartItems = this.cartService.getCartItemsToOrder();
		const estimatedOrdersTime = await firstValueFrom(this.tiempoEstimado);
		if (estimatedOrdersTime == null) return;

		// Formatear fecha actual
		const formattedDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

		// Actualizar valores en el formulario
		this.orderDetailForm.patchValue({ createdDate: formattedDate, totalAmount, pendingPayment });

		// Enviar orden
		this.registrarOrden(cartItems, estimatedOrdersTime!);
	}

	private async validarPagoConTarjeta(): Promise<boolean> {
		const phoneNumber = this.orderDetailForm.get('phoneNumber')?.value;
		return this.insertarComponente(phoneNumber);
	}

	async obtenerTiempoEstimadoOrden(): Promise<number | null> {
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
			this.showModalBeforeOrder(3);
		})
		.catch((error) => console.error("Error al agregar platillo:", error));
	}

	goToShoppingCart() {
		this.closeMessage();
		this.router.navigate(['shopping-cart']);
	}

	returnToHome() {
		this.closeMessage();
		this.router.navigate(["/home"]);
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

	limitDigits(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.value.length > 8) {
		  	input.value = input.value.slice(0, 8);
		}
	}

	closeMessage() {
		this.isModalVisible.set(false);
	}

	cerrar() {
		this.modalVisible.set(false);
	}
}
