import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '@core/services/cart.service';
import { PagoService } from '@core/services/pago.service';
import { CreditCardFormatPipe } from '@shared/pipes/credit-card-format.pipe';
import { ExpirationDateFormatPipe } from '@shared/pipes/expiration-date-format.pipe';
import { LoadingTransactionComponent } from '../loading-transaction/loading-transaction.component';

declare var OpenPay: any;

@Component({
	selector: 'app-card-payment',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, CreditCardFormatPipe, ExpirationDateFormatPipe, LoadingTransactionComponent],
	templateUrl: './card-payment.component.html',
	styleUrl: './card-payment.component.scss'
})

export class CardPaymentComponent implements OnInit {

	@Input() phone_number !: string;
	@Output() cerrar = new EventEmitter<void>();

	totalPriceSignal = inject(CartService).getTotalPriceSignal();

	cardPaymentForm: FormGroup;

	holderName: string = '';
	cardNumber: string = '';
	expirationDate: string = '';
	cvv2: string = '';
	deviceSessionId: string = '';

	isFadingOut: boolean = false;
	loadingTransaction: boolean = false;

	constructor(
		private pagoService: PagoService,
		private fb: FormBuilder
	) {
		this.cardPaymentForm = this.fb.group({
			holder_name : [Validators.required],
			card_number : [Validators.required],
			expiration_date : [Validators.required],
			cvv2 : [Validators.required],
		});
	}

	ngOnInit() {
		OpenPay.setId('mheinovbagqf3nzxctrx');
		OpenPay.setApiKey('pk_69ed8461123046469f2338a8419d3d95');
		OpenPay.setSandboxMode(true);
		this.deviceSessionId = OpenPay.deviceData.setup();
	}

	onSubmit() {
		if(this.cardPaymentForm.valid) {

			this.loadingTransaction = true;

			const name = this.holderName.split(" ")[0];
			const lastname = this.holderName.split(" ")[1];
			const amount = this.totalPriceSignal();

			const cardNumber = this.cardNumber.replace(/\D/g, '').slice(0, 16);
			const expirationMonth = this.expirationDate.split("/")[0];
			const expirationYear = this.expirationDate.split("/")[1];

			if(!OpenPay.card.cardType(cardNumber)) {
				console.log("Tipo de tarjeta no admitida");
				return;
			}

			if(!OpenPay.card.validateCardNumber(cardNumber)) {
				console.log("Numero de tarjeta no admitido");
				return;
			}

			if(!OpenPay.card.validateCVC(this.cvv2)) {
				console.log("CVC no admitido");
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
				console.log('Token generado:', tokenId);
				console.log('Device generado: ', this.deviceSessionId);

				// Datos del cliente
				const customer = {
					name: name,
					lastname: lastname,
					email: `${name}_${lastname}@example.com`,
					phone_number: this.phone_number
				};


				this.pagoService.procesarPago(tokenId, this.deviceSessionId, amount, 'Pago concepto orden', customer).subscribe(
					response => {
						console.log('Pago procesado exitosamente:', response);
					},
					error => {
						console.error('Error al procesar el pago:', error);
					}
				);

			}, (error: any) => {
			  	console.error('Error al generar el token:', error);
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

	returnToCheckout() {
		this.isFadingOut = true;
		setTimeout(() => this.cerrar.emit(), 400);
	}
}
