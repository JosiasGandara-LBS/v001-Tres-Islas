import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const cashierGuard: CanActivateFn = async () => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const accessToken = localStorage.getItem('accessToken');
	if (accessToken) {
		const res = await authService.validateToken(accessToken);
		if (!res) {
			localStorage.removeItem('accessToken');
			router.navigate(['/login']);
			return false;
		}
	}

	const userRole = authService.getRole();
	if (!userRole) {
		router.navigate(['/login']);
		return false;
	}
	if (userRole === 'CAJA' || userRole === 'ADMIN' || userRole === 'TI') {
		return true;
	} else {
		router.navigate(['/admin/orders-waiter']);
		return false;
	}
};
