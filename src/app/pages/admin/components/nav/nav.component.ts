import { Component, inject, Input, OnInit, computed } from '@angular/core';
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
export class NavComponent implements OnInit {

	public isCollapsed = true;

	private authService = inject(AuthService);

	// Hacer reactivo para que se actualice si cambia el rol del usuario
	public navItems = computed(() => {
		try {
			return this.authService.getNavItems() || [];
		} catch (error) {
			console.warn('Error getting navigation items:', error);
			return [];
		}
	});

	constructor() {}

	ngOnInit() {
		// Asegurar que tenemos los items de navegación
		const items = this.navItems();
		if (!items || items.length === 0) {
			console.warn('No navigation items available for current user role');
		}
	}

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
