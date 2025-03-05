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
		const res = await authService.validateToken(accessToken);
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
		console.log('No tienes permisos para acceder a esta página');
		console.log("userRole: ", userRole);
		router.navigate(['/home']);
		return false;
	}
};
