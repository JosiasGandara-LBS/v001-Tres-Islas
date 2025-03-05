import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
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
	if (userRole === 'TI' || userRole === 'ADMIN') {
		return true;
	} else {
		router.navigate(['/admin/products']);
		return false;
	}
};
