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
import { v4 as uuidv4 } from 'uuid';

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

	insertarComponente(phoneNumber: string, orderID: string): Promise<TransactionData> {
		return new Promise((resolve) => {
			const componentRef = this.container.createComponent(CardPaymentComponent, { injector: this.injector });
			componentRef.instance.phone_number = phoneNumber;
			componentRef.instance.orderID = orderID;

			componentRef.instance.isTransactionCompleted.subscribe((valor: TransactionData) => {
				resolve(valor);
				if (!valor.success) {
					this.errorsModal = valor.message;
					this.isModalVisible.set(true);
					this.configModal = 4;
				}
				componentRef?.destroy();
			});

			componentRef.instance.cerrar.subscribe(() => {
				resolve({ success: false, message: 'Cancelado por el usuario' });
				componentRef?.destroy();
			});
		});
	}

	showModalBeforeOrder(configNumber: number) {

		if (!this.kitchenStatusService.isKitchenOpen()) {
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
		if(!this.orderDetailForm.get("assignedToTable")?.valid && this.orderDetailForm.get("orderToGo")?.value === 0) {
			errorFields += "- Número de mesa\n";
		}
		if(!this.orderDetailForm.get("orderToGo")?.valid) {
			errorFields += "- Tipo de orden\n";
		}
		if(!this.orderDetailForm.get("paymentMethod")?.valid) {
			errorFields += "- Método de pago\n";
		}
		if(this.orderDetailForm.get("paymentMethod")?.value === "Dinero en efectivo" &&(this.orderDetailForm.get("tenderedAmount")?.value < this.totalPriceSignal() || this.orderDetailForm.get("tenderedAmount")?.value === null)) {
			errorFields += "- Tu pago no puede ser menor al total\n"
		}

		this.isModalVisible.set(true);
		if (errorFields === "") {
			this.configModal = configNumber;
			this.errorsModal = "";
		} else {
			this.configModal = 2;
			this.errorsModal = errorFields;
		}
	}

	async submitForm() {
		// Validar estado de la cocina
		if (!this.kitchenStatusService.isKitchenOpen()) {
			alert('La cocina está cerrada. No puedes hacer el pedido ahora.');
			return;
		}

		this.isModalVisible.set(false);

		const paymentMethod = this.orderDetailForm.get('paymentMethod')?.value;
		const tenderedAmount = this.orderDetailForm.get('tenderedAmount')?.value || 0;
		const totalAmount = this.totalPriceSignal();
		const orderID = uuidv4();
		let transactionID: string | null = null;
		let pendingPayment = true;

		// Validar orden para llevar
		if (this.orderDetailForm.get('orderToGo')?.value === 1) {
			this.orderDetailForm.patchValue({assignedToTable: 'PARA LLEVAR'});
		}

		const cartItems = this.cartService.getCartItemsToOrder();
		const estimatedOrdersTime = await this.obtenerTiempoEstimadoOrden();
		if (estimatedOrdersTime == null) return;

		const formattedDate = new Intl.DateTimeFormat('es-MX', {dateStyle: 'short', timeStyle: 'short'}).format(new Date());

		this.orderDetailForm.patchValue({createdDate: formattedDate, totalAmount, pendingPayment});

		// Validación de pago en efectivo
		if (paymentMethod === 'Dinero en efectivo' && tenderedAmount < totalAmount) {
			this.showModalBeforeOrder(2);
			return;
		}

		// Validación de pago con tarjeta
		if (paymentMethod === 'Tarjeta débito / crédito') {
			const phoneNumber = this.orderDetailForm.get('phoneNumber')?.value;

			const result = await this.validarPagoConTarjeta(phoneNumber, orderID);

			if (!result.success || !result.transactionID || !result.redirectURL) {
				this.showModalBeforeOrder(4);
				return;
			}

			const tip = result.tip || 0;
			transactionID = result.transactionID;
			await this.registrarOrden(cartItems, estimatedOrdersTime, orderID, transactionID, tip);
			this.cartService.clearCart();
			window.open(result.redirectURL, '_parent');
		} else {
			await this.registrarOrden(cartItems, estimatedOrdersTime, orderID, null, 0);
			localStorage.removeItem('cart');
			this.cartService.clearCart();
			this.returnToHome();
		}

	}


	private async validarPagoConTarjeta(phoneNumber: string, orderID: string): Promise<{ success: boolean, transactionID?: string, redirectURL?: string, tip?: number }> {
		return this.insertarComponente(phoneNumber, orderID);
	}

	async obtenerTiempoEstimadoOrden(): Promise<number | null> {
		try {
		  	return await firstValueFrom(this.kitchenStatusService.getOrdersEstimatedTime());
		} catch (error) {
			console.error("Error al obtener tiempo estimado de la orden:", error);
			return null;
		}
	}

	private async registrarOrden(cartItems: any[], estimatedOrdersTime: number, orderID: string, transactionID: string | null, tip: number): Promise<void> {
		try {
			const orderData = {
				...this.orderDetailForm.value,
				foodDishes: cartItems,
				estimatedOrdersTime,
				transactionID: transactionID ?? '',
				tip: tip,
				isChecked: 0
			};

			await this.ordersService.setOrderWithID(orderID, orderData);

			this.ordersClientService.addOrderIdToLocalStorage(orderID);
			// this.cartService.clearCart();
			// this.showModalBeforeOrder(3);

			console.log("Orden registrada con ID:", orderID);
		} catch (error) {
			console.error("Error al registrar la orden:", error);
			throw error;
		}
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
