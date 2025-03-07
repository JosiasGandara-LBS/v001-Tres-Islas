import { Component, Input } from '@angular/core';
import { NavBarItemComponent } from '../nav-bar-item/nav-bar-item.component';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'admin-nav',
  standalone: true,
  imports: [NavBarItemComponent, CommonModule, ButtonModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {

	public isCollapsed = false;

	public navItems = [
		{ name: 'Productos', route: 'products', icon: 'pi-box' },
		{ name: 'Usuarios', route: 'employees', icon: 'pi-user' },
		{ name: 'Pedidos', route: '/orders-waiter', icon: 'pi-list' },
	];

	constructor() {}

	toggleNav() {
		this.isCollapsed = !this.isCollapsed;
	}
}
