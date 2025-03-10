import { Component, inject, Input } from '@angular/core';
import { NavBarItemComponent } from '../nav-bar-item/nav-bar-item.component';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { AuthService } from '@core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'admin-nav',
  standalone: true,
  imports: [NavBarItemComponent, CommonModule, ButtonModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {

	public isCollapsed = true;

	private authService = inject(AuthService);

	public navItems = [
		{ name: 'Productos', route: 'products', icon: 'pi-box' },
		{ name: 'Usuarios', route: 'employees', icon: 'pi-user' },
		{ name: 'Pedidos', route: '/orders-waiter', icon: 'pi-list' },
	];

	constructor() {}

	toggleNav() {
		this.isCollapsed = !this.isCollapsed;
	}

	logout() {
		Swal.fire({
			title: '¿Estás seguro?',
			text: 'Estás a punto de cerrar sesión',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#aaaaaa',
			confirmButtonText: 'Cerrar sesión',
			cancelButtonText: 'Cancelar',
			reverseButtons: true,
		}).then((result) => {
			if (result.isConfirmed) {
				this.authService.logout();
			}
		});
	}
}
