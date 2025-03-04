import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { CommonModule } from '@angular/common';
import { DropdownComponent } from './components/dropdown/dropdown.component';

@Component({
	selector: 'app-checkout',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, DropdownComponent],
	templateUrl: './checkout.component.html',
	styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {

	form: FormGroup;
	savedData: { firstName: string; lastName: string }[] = [];
	totalPriceSignal = inject(CartService).getTotalPriceSignal();

	constructor(
		private router: Router,
		private fb: FormBuilder,
		private ordersService : OrdersService,
		private cartService : CartService
	) {
		// Configuración del formulario reactivo
		this.form = this.fb.group({
			client: ['', Validators.required],
			phoneNumber: ['', Validators.required],
			assignedToTable: ['', Validators.required],
			paymentMethod: ['', Validators.required],
			totalAmount: [0, Validators.required],
			createdDate: ['01/01/1800, 00:00 a.m.'],
			status: [1]
		});
	}

	submitForm() {
		if (this.form.valid) {

			// Obtener solo los campos necesarios del carrito
			const cartItems = this.cartService.getCartItemsToOrder();
			console.log(cartItems);

			// Añadir datos derivados como fecha y precio total
			const now = new Date();
			const formattedDate = new Intl.DateTimeFormat('es-MX', {
				dateStyle: 'short',
				timeStyle: 'short',
			}).format(now);

			// Actualizar valores en el formulario
			this.form.patchValue({
				createdDate: formattedDate,
				totalAmount: this.totalPriceSignal(),
			});

			this.ordersService.addOrder({...this.form.value, foodDishes: cartItems})
			.then(() => {
				console.log('Platillo agregado con exito');
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
}
