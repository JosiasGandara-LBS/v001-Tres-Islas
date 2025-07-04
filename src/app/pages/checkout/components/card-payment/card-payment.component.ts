import { OpenPayResponse } from './../../../../shared/interfaces/open-pay-response.interface';
import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionData } from '@core/models/transaction-data';
import { CartService } from '@core/services/cart.service';
import { PagoService } from '@core/services/pago.service';
import { CreditCardFormatPipe } from '@shared/pipes/credit-card-format.pipe';
import { ExpirationDateFormatPipe } from '@shared/pipes/expiration-date-format.pipe';
import { firstValueFrom } from 'rxjs';

import { openpayConfig } from 'src/environment/openpay.config';

declare var OpenPay: any;

@Component({
	selector: 'app-card-payment',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, CreditCardFormatPipe, ExpirationDateFormatPipe],
	templateUrl: './card-payment.component.html',
	styleUrl: './card-payment.component.scss'
})

export class CardPaymentComponent implements OnInit {

	@Input() phone_number !: string;
	@Input() orderID !: string;
	@Output() cerrar = new EventEmitter<void>();
	@Output() isTransactionCompleted = new EventEmitter<TransactionData>();

	totalPriceSignal = inject(CartService).getTotalPriceSignal();

	tip = signal<number>(0);
	customTip = signal<number>(0);

	readonly totalWithTip = computed(() => {
		return this.totalPriceSignal() + (this.tip() || 0);
	});

	cardPaymentForm: FormGroup;

	holderName: string = '';
	cardNumber: string = '';
	expirationDate: string = '';
	cvv2: string = '';
	deviceSessionID: string = '';
	transactionID: string = '';
	redirectURL: string = '';

	isFadingOut: boolean = false;
	showing: boolean = false;
	loadingTransaction: boolean = false;
	transactionSuccess: boolean = false;
	transactionError: boolean = false;
	errorMessage: string = '';

	isDropdownOpen = false;
	selectedOption: any = null;

	options = [
		{ name: '10%', value: 0.10 },
		{ name: '15%', value: 0.15 },
		{ name: '20%', value: 0.20 },
		{ name: 'Otra cantidad', value: 1 },
	];

	private onChange = (value: any) => {};
	private onTouched = () => {};

	constructor(
		private pagoService: PagoService,
		private fb: FormBuilder,
		private router: Router
	) {
		this.cardPaymentForm = this.fb.group({
			holder_name : [Validators.required],
			card_number : [Validators.required],
			expiration_date : [Validators.required],
			cvv2 : [Validators.required],
		});
	}

	ngOnInit() {
		OpenPay.setId(openpayConfig.OPENPAY_MERCHANT_ID);
		OpenPay.setApiKey(openpayConfig.OPENPAY_PUBLIC_KEY);
		OpenPay.setSandboxMode(openpayConfig.OPENPAY_SANDBOX_MODE);
		this.deviceSessionID = OpenPay.deviceData.setup();
	}

	async onSubmit() {
		if(this.cardPaymentForm.valid) {

			this.showing = true;
			this.loadingTransaction = true;
			this.transactionSuccess = false;
			this.transactionError = false;

			const name = this.holderName.split(" ")[0];
			const lastname = this.holderName.split(" ")[1];
			const amount = this.totalWithTip();

			const cardNumber = this.cardNumber.replace(/\D/g, '').slice(0, 16);
			const expirationMonth = this.expirationDate.split("/")[0];
			const expirationYear = this.expirationDate.split("/")[1];

			if(!OpenPay.card.cardType(cardNumber)) {
				this.setError("Tipo de tarjeta no admitida");
				return;
			}

			if(!OpenPay.card.validateCardNumber(cardNumber)) {
				this.setError("Número de tarjeta no admitido");
				return;
			}

			if(!OpenPay.card.validateCVC(this.cvv2)) {
				this.setError("CVC no admitido");
				return;
			}

			const cardData = {
				card_number: cardNumber,
				holder_name: this.holderName,
				expiration_year: expirationYear,
				expiration_month: expirationMonth,
				cvv2: this.cvv2
			};

			OpenPay.token.create(cardData, (response: any) => {
				const tokenID = response.data.id;

				const customer = {
					name: name,
					lastname: lastname,
					email: `customer@example.com`,
					phone_number: this.phone_number
				};

				this.pagoService.processPayment(tokenID, this.deviceSessionID, this.orderID, amount, 'Pago concepto orden', customer).subscribe(
					(response: OpenPayResponse) => {
						this.transactionID = response.id;
						console.log("Respuesta Openpay: ", response);
						this.loadingTransaction = false;
						this.redirectURL = response.payment_method.url;
						// this.transactionSuccess = true;
						this.returnToHome()
					},
					error => {
						this.setError('Ocurrió un error en tu tarjeta');
						console.log(error);
					}
				);

			}, (error: any) => {
				this.setError('Error al generar el token de pago.');
				console.log(error);
			});
		}
	}

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

	setError(message: string) {
		this.loadingTransaction = false;
		this.transactionSuccess = false;
		this.transactionError = true;
		this.errorMessage = message;
	}

	returnToCheckout() {
		this.closeMessage();
		this.isFadingOut = true;
		setTimeout(() => this.cerrar.emit(), 400);
	}

	returnToCheckoutWithError() {
		this.closeMessage();
		this.isFadingOut = true;
		setTimeout(() => this.cerrar.emit(), 400);
	}

	returnToHome() {
		// this.closeMessage();
		this.isTransactionCompleted.emit({
			success: true,
			message: 'Pago realizado con éxito',
			tip: this.tip(),
			transactionID: this.transactionID,
			redirectURL: this.redirectURL,
		});
	}

	closeMessage() {
		this.transactionError = false;
		this.transactionSuccess = false;
		this.showing = false;
	}

	toggleDropdown() {
		this.isDropdownOpen = !this.isDropdownOpen;
	}

	selectOption(option: any) {
		this.selectedOption = option;
		this.onChange(option.value);
		this.isDropdownOpen = false;

		if (option.value === 1) {
			this.customTip.set(0);
			this.tip.set(0);
		} else {
			const base = this.totalPriceSignal();
			this.tip.set(base * option.value);
		}
	}

	onCustomTipChange(value: number) {
		this.customTip.set(value);
		this.tip.set(value);
	}

	// Métodos necesarios para ControlValueAccessor
	writeValue(value: any): void {
		this.selectedOption = this.options.find(opt => opt.value === value) || null;
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState?(isDisabled: boolean): void {
		// Manejar el estado deshabilitado si es necesario
	}
}
