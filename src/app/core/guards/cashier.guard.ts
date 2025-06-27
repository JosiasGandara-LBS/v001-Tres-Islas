import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthBaseGuard } from './auth-base.guard';

export const cashierGuard: CanActivateFn = async (route, state) => {
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

	// Permitir acceso a roles autorizados
	if (['CAJA', 'ADMIN', 'TI', 'MESERO'].includes(userRole)) {
		// Si es un mesero y está intentando acceder directamente a /admin (no a orders-waiter)
		if (userRole === 'MESERO' && state.url === '/admin') {
			router.navigate(['/admin/orders-waiter']);
			return false;
		}
		return true;
	} else {
		router.navigate(['/home']);
		return false;
	}
};
