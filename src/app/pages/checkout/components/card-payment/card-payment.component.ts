import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionData } from '@core/models/transaction-data';
import { CartService } from '@core/services/cart.service';
import { PagoService } from '@core/services/pago.service';
import { CreditCardFormatPipe } from '@shared/pipes/credit-card-format.pipe';
import { ExpirationDateFormatPipe } from '@shared/pipes/expiration-date-format.pipe';

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
	@Output() cerrar = new EventEmitter<void>();
	@Output() isTransactionCompleted = new EventEmitter<TransactionData>();

	totalPriceSignal = inject(CartService).getTotalPriceSignal();

	cardPaymentForm: FormGroup;

	holderName: string = '';
	cardNumber: string = '';
	expirationDate: string = '';
	cvv2: string = '';
	deviceSessionId: string = '';

	isFadingOut: boolean = false;
	showing: boolean = false;
	loadingTransaction: boolean = false;
	transactionSuccess: boolean = false;
	transactionError: boolean = false;
	errorMessage: string = '';

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
		OpenPay.setId(openpayConfig.openpayId);
		OpenPay.setApiKey(openpayConfig.apiKey);
		OpenPay.setSandboxMode(openpayConfig.sandboxMode);
		this.deviceSessionId = OpenPay.deviceData.setup();
	}

	onSubmit() {
		if(this.cardPaymentForm.valid) {

			this.showing = true;
			this.loadingTransaction = true;
			this.transactionSuccess = false;
			this.transactionError = false;

			const name = this.holderName.split(" ")[0];
			const lastname = this.holderName.split(" ")[1];
			const amount = this.totalPriceSignal();

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
				const tokenId = response.data.id;

				const customer = {
					name: name,
					lastname: lastname,
					email: `${name}_${lastname}@example.com`,
					phone_number: this.phone_number
				};

				this.pagoService.procesarPago(tokenId, this.deviceSessionId, amount, 'Pago concepto orden', customer).subscribe(
					response => {
						this.loadingTransaction = false;
						this.transactionSuccess = true;
					},
					error => {
						this.setError('Ocurrió un error en tu tarjeta');
					}
				);

			}, (error: any) => {
				this.setError('Error al generar el token de pago.');
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
		this.closeMessage();
		this.isTransactionCompleted.emit({
			success: true,
			message: 'Pago realizado con éxito',
		});
		this.router.navigate(["/home"]);
	}

	closeMessage() {
		this.transactionError = false;
		this.transactionSuccess = false;
		this.showing = false;
	}
}
