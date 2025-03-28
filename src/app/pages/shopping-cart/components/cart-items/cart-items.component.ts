import { Component, computed, inject, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../../core/services/cart.service';
import { ModalItemComponent } from '../modal-item/modal-item.component';

@Component({
  selector: 'app-cart-items',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-items.component.html',
  styleUrl: './cart-items.component.scss'
})
export class CartItemsComponent implements OnInit {

	private cartService = inject(CartService);

	totalPriceSignal = inject(CartService).getTotalPriceSignal();
	cartItemsCount = inject(CartService).getCartItemsCount();
	_menuService = inject(CartService).getMenu;

	cartItems = computed(() => this.cartService.cartItemsValue);

	@ViewChild('modalContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

	constructor(private router : Router, private injector : Injector) {}

	ngOnInit() {
		this.cartService.updateCartItemsWithImage();
	}

	insertarComponente(cartItemID: string){
		if (this.container.length > 0) this.container.clear();

		const componentRef = this.container.createComponent(ModalItemComponent, { injector: this.injector });
		componentRef.instance.itemId = cartItemID;
		componentRef.instance.cerrar.subscribe(() => componentRef?.destroy());
	}

	deleteCartItem(cartItemID: string) {
		this.cartService.deleteCartItem(cartItemID);
	}

	// Llamar a la función de incrementar cantidad
	incrementQuantity(cartItemID: string): void {
		this.cartService.incrementQuantity(cartItemID);
	}

	// Llamar a la función de decrementar cantidad
	decrementQuantity(cartItemID: string): void {
		this.cartService.decrementQuantity(cartItemID);
		if (this.cartService.getCartItemsCount()() < 1) {
			this.router.navigate(['/home']);
		}
	}

}
