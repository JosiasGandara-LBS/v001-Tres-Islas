import { Component } from '@angular/core';
import { NavBarItemComponent } from '../nav-bar-item/nav-bar-item.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'admin-nav',
  standalone: true,
  imports: [NavBarItemComponent, CommonModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {

	public navItems = [
		{ name: 'Productos', route: 'products', icon: 'pi-box' },
		{ name: 'Usuarios', route: 'employees', icon: 'pi-user' },
		{ name: 'Pedidos', route: '/orders-waiter', icon: 'pi-list' },
	];
	constructor() {}
}
