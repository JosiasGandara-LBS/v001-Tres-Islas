import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';
import { MenuItem } from '../../../../core/models/menu-item';
import { CartItem } from '../../../../core/models/cart-item';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-item.component.html',
  styleUrl: './modal-item.component.scss'
})
export class ModalItemComponent implements OnInit, OnDestroy {

	private cartService = inject(CartService);
	private subscription!: Subscription;

	@Input() itemId !: string;
	@Output() cerrar = new EventEmitter<void>();

  	isFadingOut = false;

	item !: MenuItem;
	cartItem !: CartItem;

	quantity !: number;
	additionalInstructions !: string;

	ngOnInit(): void {
		if (this.itemId) {
			this.subscription = this.cartService.getItemById(this.itemId).subscribe((data) => this.item = data);

			const foundCartItem = this.cartService.getCartItemById(this.itemId);
			if (foundCartItem) {
				this.cartItem = foundCartItem;
				this.quantity = this.cartItem.quantity;
				this.additionalInstructions = this.cartItem.additionalInstructions;
			}
		}
	}

	ngOnDestroy(): void {
		if (this.subscription) {
			this.subscription.unsubscribe();
		}
	}

	returnToShoppingCart() {
		this.isFadingOut = true;
		setTimeout(() => this.cerrar.emit(), 400);
	}

	// Llamar a la función de incrementar cantidad
	incrementQuantity(): void {
		this.quantity++;
	}

	// Llamar a la función de decrementar cantidad
	decrementQuantity(): void {
		if(this.quantity > 1) this.quantity--;
	}

	// Método para agregar al carrito
	updateCart(cartItem: any): void {
		cartItem.quantity = this.quantity
		cartItem.additionalInstructions = this.additionalInstructions;

		this.cartService.updateCartItem(cartItem);
		this.returnToShoppingCart();
	}

}
