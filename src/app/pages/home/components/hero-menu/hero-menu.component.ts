import { Component, computed, effect, inject, Injector, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalItemComponent } from '../modal-item/modal-item.component';
import { MenuItem } from '../../../../core/models/menu-item';
import { CartService } from '../../../../core/services/cart.service';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'app-hero-menu',
	standalone: true,
	imports: [CommonModule, ButtonModule],
	templateUrl: './hero-menu.component.html',
	styleUrl: './hero-menu.component.scss'
})
export class HeroMenuComponent {

	_menuService = inject(CartService).getMenu;

	cartItemsCount: number = 0;
	buttonClass: string = '';

	@ViewChild('modalContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

	constructor(
		private router: Router,
		private injector: Injector,
		private cartService: CartService
	) {}

	async ngOnInit() {
		this.updateCartItemsCount();
	}

	insertarComponente(itemId: string) {

		const componentRef = this.container.createComponent(ModalItemComponent, {
			injector: this.injector,
		});

		componentRef.instance.itemId = itemId;

		componentRef.instance.cerrar.subscribe(() => componentRef?.destroy());
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
		return localStorage.getItem('currentOrders') !== null;
	}

	scrollToMenu() {
		const menuSection = document.getElementById('menuSection');
		const headerHeight = 64;

		if (menuSection) {
		  const menuPosition = menuSection.getBoundingClientRect().top + window.scrollY - headerHeight;
		  window.scrollTo({ top: menuPosition, behavior: 'smooth' });
		}
	  }

}
