import { Component, computed, inject, Injector, OnInit, ViewChild, ViewContainerRef, Input } from '@angular/core';
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

	cartItems = computed(() => this.cartService.cartItemsValue);

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

	getDiscountedPrice(cartItem: any): { originalPrice: number, discountedPrice: number } {
		const quantity = cartItem.quantity;
		const price = cartItem.price;
		const originalPrice = price * quantity; // Precio original sin descuento

		// Obtener las promociones activas
		const promotions = this.promotions();
		if (!Array.isArray(promotions)) return { originalPrice, discountedPrice: originalPrice };

		// Buscar promociones aplicables a la categoría del producto
		const applicablePromos = promotions.filter(p => p.categories.includes(cartItem.category) && p.enabled);

		// Mapa de estrategias para aplicar descuentos
		const discountStrategies: Record<string, (q: number) => number> = {
			'3X2TYT3A5': (q) => q - Math.floor(q / 3), // 3x2
			'TEST50OFF': (q) => Math.ceil(q * 0.5), // 50% off
			'TEST2X1': (q) => q - Math.floor(q / 2), // 2x1
		};

		// Aplicar todas las promociones que correspondan al producto
		let finalQuantity = quantity;

		applicablePromos.forEach(promo => {
			if (discountStrategies[promo.id]) finalQuantity = discountStrategies[promo.id](finalQuantity);
		});

		const discountedPrice = price * finalQuantity; // Precio después del descuento
		return { originalPrice, discountedPrice };
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