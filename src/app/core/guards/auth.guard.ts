import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = async () => {
	const router = inject(Router);
	const authService = inject(AuthService);
	const token = localStorage.getItem('accessToken');
	if (token) {
		const isValidToken = await authService.validateToken(token);
		if (!isValidToken) {
			localStorage.removeItem('accessToken');
			return true;
		} else {
			router.navigate(['/orders-waiter']);
			return false;
		}
	}
	return true;
};
