import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-cart-items',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-items.component.html',
  styleUrl: './cart-items.component.scss'
})
export class CartItemsComponent implements OnInit {

	cartItems: any[] = [];

	totalPriceSignal = inject(CartService).getTotalPriceSignal();
	cartItemsCount = inject(CartService).getCartItemsCount();
	_menuService = inject(CartService).getMenu;

	private cartService = inject(CartService);

	constructor(private router : Router) {}

	ngOnInit() {
		// Acceder al Signal a través del getter
		this.cartItems = this.cartService.cartItemsValue;

		// Actualizar las imágenes de los cartItems con el menú
		this.cartService.updateCartItemsWithImage();
	}

	// Llamar a la función de incrementar cantidad
	incrementQuantity(id: string): void {
		this.cartService.incrementQuantity(id);
		this.cartItems = this.cartService.getCartItems();  // Actualizar el carrito después de incrementar
	}

	// Llamar a la función de decrementar cantidad
	decrementQuantity(id: string): void {
		this.cartService.decrementQuantity(id);
		this.cartItems = this.cartService.getCartItems();  // Actualizar el carrito después de decrementar

		if(this.cartItemsCount() < 1) this.router.navigate(['/home']);
	}

}
