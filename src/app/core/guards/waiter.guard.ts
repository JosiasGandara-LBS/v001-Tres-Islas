import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const waiterGuard: CanActivateFn = async () => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const userRole = authService.getRole();
	const accessToken = localStorage.getItem('accessToken');
	if (accessToken) {
		// Renovar token antes de validar
		await authService.renewAccessToken();
		const res = await authService.validateToken(localStorage.getItem('accessToken')!);
		if (!res) {
			localStorage.removeItem('accessToken');
			router.navigate(['/login']);
			return false;
		}
	}

	if (!userRole) {
		router.navigate(['/login']);
		return false;
	}
	if (userRole === 'MESERO'|| userRole === 'CAJA' || userRole === 'ADMIN' || userRole === 'TI') {
		return true;
	} else {
		router.navigate(['/home']);
		return false;
	}
};
