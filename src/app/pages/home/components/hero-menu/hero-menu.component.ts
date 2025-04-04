import { Component, computed, effect, inject, Injector, Input, OnChanges, OnDestroy, OnInit, Signal, signal, ViewChild, ViewContainerRef, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalItemComponent } from '../modal-item/modal-item.component';
import { MenuItem } from '../../../../core/models/menu-item';
import { CartService } from '../../../../core/services/cart.service';
import { ButtonModule } from 'primeng/button';
import { KitchenStatusService } from '@core/services/kitchen-status.service';
import { PromotionsService } from '@core/services/promotions.service';
import { Promotions2Service } from '@core/services/promotions2.service';
import { Promotion } from '@shared/interfaces/promotion.interface';
import { OrdersService } from '@core/services/orders.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-hero-menu',
	standalone: true,
	imports: [CommonModule, ButtonModule],
	templateUrl: './hero-menu.component.html',
	styleUrl: './hero-menu.component.scss'
})
export class HeroMenuComponent implements OnInit, OnDestroy {

	modalVisible = this.cartService.modalVisible;

	_menuService = inject(CartService).getMenu;
	cartItemsCount: number = 0;
	buttonClass: string = '';
	promotions: any[] = [];
	kitchenStatusService = inject(KitchenStatusService);
	isKitchenOpen = computed(() => this.kitchenStatusService.isKitchenOpen());

	private ordersSubscription!: Subscription;

	@ViewChild('modalContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

	constructor(
		private router: Router,
		private injector: Injector,
		private cartService: CartService,
		private ordersService: OrdersService,
		private promotions2Service: Promotions2Service
	) {}

	async ngOnInit() {
		this.updateCartItemsCount();

		this.ordersSubscription = this.ordersService.listenForOrdersChanges().subscribe(orders => {
			this.validateLocalStorageIds(orders);
		});

		this.promotions2Service.promotions$.subscribe(promotions => {
			this.promotions = promotions;
		});

		console.log(this.modalVisible());
	}

	ngOnDestroy(): void {
		if (this.ordersSubscription) {
		  this.ordersSubscription.unsubscribe();
		}
	}

	getQuantity(itemId: string): number {
		return this.cartService.getQuantity(itemId);
	}

	insertarComponente(itemId: string) {
		if (this.container.length > 0) this.container.clear();

		const componentRef = this.container.createComponent(ModalItemComponent, { injector: this.injector });
		componentRef.instance.itemId = itemId;
		componentRef.instance.cerrar.subscribe(() => componentRef?.destroy());

	}

	agregarAlCarrito(itemID: string){
		const selectedItem = this._menuService().find(item => item.id === itemID);

		if (selectedItem){
			this.cartService.addToCart(selectedItem.id, selectedItem.name, selectedItem.description, selectedItem.category, selectedItem.price, 1, '');
		}
	}

	// Método para organizar los platillos por categoría
	organizeByCategory(items: MenuItem[]): { [key: string]: MenuItem[] } {
		return items.reduce((acc: { [key: string]: MenuItem[] }, item: MenuItem) => {
			const { category } = item;

			if (!acc[category]) acc[category] = [];

			acc[category].push(item);

			return acc;
		}, {});
	}

	goToOrders() {
		this.router.navigate(['/orders-client']);
	}

	updateCartItemsCount(): void {
		this.cartItemsCount = this.cartService.getTotalItems(); // Llama al servicio para obtener el total de items
	}

	get hasOrders(): boolean{
		return (localStorage.getItem('current_orders') !== null && localStorage.getItem('current_orders') !== '[]');
	}

	scrollToMenu() {
		const menuSection = document.getElementById('menuSection');
		const headerHeight = 64;
		if (menuSection) {
			const menuPosition = menuSection.getBoundingClientRect().top + window.scrollY - headerHeight;
			window.scrollTo({ top: menuPosition, behavior: 'smooth' });
		}
	}

	hasPromotion(category: string): boolean {
		return this.promotions.some(promo =>
			promo.enabled && promo.categories.includes(category)
		);
	}

	getActivePromotions(category: string): Promotion[] {
		return this.promotions.filter(promo =>
			promo.enabled && promo.categories.includes(category)
		);
	}

	validateLocalStorageIds(orders: any[]): void {
		const storedIds: string[] = JSON.parse(localStorage.getItem('current_orders') || '[]');

		// Si hay IDs en el localStorage
		if (storedIds.length > 0) {
		  // Validar contra los pedidos existentes
		  const validIds = orders.map(order => order.id);
		  const updatedIds = storedIds.filter(id => validIds.includes(id));
		  localStorage.setItem('current_orders', JSON.stringify(updatedIds));
		}
	}

	cerrar() {
		this.modalVisible.set(false);
		console.log(this.modalVisible());
	}

}
