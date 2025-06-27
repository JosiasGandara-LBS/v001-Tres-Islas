import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthBaseGuard } from './auth-base.guard';

export const waiterGuard: CanActivateFn = async () => {
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

	// Permitir acceso a roles que pueden ver pedidos
	if (['MESERO', 'CAJA', 'ADMIN', 'TI'].includes(userRole)) {
		return true;
	} else {
		router.navigate(['/home']);
		return false;
	}
};
