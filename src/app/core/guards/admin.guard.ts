import { Injectable } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthBaseGuard } from './auth-base.guard';

export const adminGuard: CanActivateFn = async (route, state) => {
	const authBaseGuard = inject(AuthBaseGuard);
	const router = inject(Router);

	// Validar autenticación de forma optimizada
	const isAuthenticated = await authBaseGuard.validateUserAuth();
	if (!isAuthenticated) {
		return false;
	}

	const userRole = authBaseGuard.getUserRole();
	if (!userRole) {
		router.navigate(['/login']);
		return false;
	}

	// Solo ADMIN y TI pueden acceder a rutas administrativas específicas
	if (['TI', 'ADMIN'].includes(userRole)) {
		return true;
	} else {
		// Evitar redirección si ya están en la ruta correcta
		if (state.url.includes('/admin/orders-waiter')) {
			return false; // No redirigir, solo denegar acceso silenciosamente
		}
		// Redirigir a su área autorizada solo si no están ya ahí
		router.navigate(['/admin/orders-waiter']);
		return false;
	}
};
