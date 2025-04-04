import { Component, computed, inject, Injector, OnInit, ViewChild, ViewContainerRef, Input, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../../core/services/cart.service';
import { ModalItemComponent } from '../modal-item/modal-item.component';
import { Promotions2Service } from '@core/services/promotions2.service';
import { BehaviorSubject } from 'rxjs';
import { Promotion } from '@shared/interfaces/promotion.interface';

@Component({
  selector: 'app-cart-items',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-items.component.html',
  styleUrl: './cart-items.component.scss'
})
export class CartItemsComponent implements OnInit {

	private cartService = inject(CartService);
	totalPriceSignal = this.cartService.getTotalPriceSignal();

	cartItemsCount = inject(CartService).getCartItemsCount();
	_menuService = inject(CartService).getMenu;

	cartItems = computed(() => this.cartService.cartItemsWithDiscount());

	promotions = computed(() => {
		const promos = this.cartService.getPromotionsSignal();
		return promos();
	});

	@ViewChild('modalContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

	@Input() isKitchenOpen: boolean = true; // Añadido el Input

	constructor(private router: Router, private injector: Injector, private promotions2Service: Promotions2Service) {}

	ngOnInit() {
		this.cartService.updateCartItemsWithImage();
	}

	hasPromotion(cartItem: any): boolean {
		return this.promotions().some(promo =>
			promo.enabled && promo.categories.includes(cartItem.category)
		);
	}

	getActivePromotions(cartItem: any): Promotion[] {
		return this.promotions().filter(promo =>
			promo.enabled && promo.categories.includes(cartItem.category)
		);
	}

	insertarComponente(cartItemID: string) {
		if (this.container.length > 0) this.container.clear();

		const componentRef = this.container.createComponent(ModalItemComponent, { injector: this.injector });
		componentRef.instance.itemId = cartItemID;
		componentRef.instance.cerrar.subscribe(() => componentRef?.destroy());
	}

	deleteCartItem(cartItemID: string) {
		this.cartService.deleteCartItem(cartItemID);
	}
}