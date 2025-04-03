import { Component, inject, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { CheckoutComponent } from '../checkout/checkout.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { CartItemsComponent } from './components/cart-items/cart-items.component';
import { CommonModule } from '@angular/common';
import { ModalItemComponent } from './components/modal-item/modal-item.component';
import { KitchenStatusService } from '@core/services/kitchen-status.service';
import { computed } from '@angular/core';
@Component({
	selector: 'app-shopping-cart',
	standalone: true,
	imports: [CommonModule, CartItemsComponent],
	templateUrl: './shopping-cart.component.html',
	styleUrl: './shopping-cart.component.scss',
})
export class ShoppingCartComponent implements OnInit {

	title = 'Carrito de compra'

	totalPriceSignal = inject(CartService).getTotalPriceSignal();
	cartItemsCount = inject(CartService).getCartItemsCount();
	kitchenStatusService = inject(KitchenStatusService);
	isKitchenOpen = computed(() => this.kitchenStatusService.isKitchenOpen());

	@ViewChild(CheckoutComponent) checkoutComponent?: CheckoutComponent;

	constructor( private route: ActivatedRoute, private router : Router, private injector : Injector) {}


	ngOnInit(): void {}

	goToHome() { this.router.navigate(['/home']) }

	goToCheckout() {
		if(this.totalPriceSignal() > 0) {
			this.router.navigate(['/checkout'])
		}
	}

}
