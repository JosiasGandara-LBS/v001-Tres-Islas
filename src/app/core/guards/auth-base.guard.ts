import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthBaseGuard {
  private authService = inject(AuthService);
  private router = inject(Router);
  private lastTokenValidation = 0;
  private lastValidationResult = false;
  private currentTokenCache = '';

  async validateUserAuth(): Promise<boolean> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      this.clearCache(); // Limpiar cache si no hay token
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si el usuario está en estado válido
    const userRole = this.authService.getRole();
    if (userRole === null && this.authService.user() === null) {
      // Usuario en proceso de logout o no autenticado
      this.clearCache();
      this.router.navigate(['/login']);
      return false;
    }

    // Cache inteligente: Si es el mismo token y se validó hace menos de 10 segundos
    const now = Date.now();
    if (
      this.currentTokenCache === accessToken && 
      this.lastValidationResult && 
      (now - this.lastTokenValidation) < 10000
    ) {
      return true;
    }

    // Solo renovar token si han pasado más de 5 minutos desde la última renovación
    if ((now - this.lastTokenValidation) > 300000) {
      await this.authService.renewAccessToken();
      // Actualizar token después de renovación
      const newToken = localStorage.getItem('accessToken');
      if (newToken) {
        this.currentTokenCache = newToken;
      }
    }

    const res = await this.authService.validateToken(localStorage.getItem('accessToken')!);
    if (!res) {
      localStorage.removeItem('accessToken');
      this.clearCache();
      this.router.navigate(['/login']);
      return false;
    }

    // Actualizar cache
    this.lastTokenValidation = now;
    this.lastValidationResult = true;
    this.currentTokenCache = accessToken;

    return true;
  }

  getUserRole(): string | null {
    return this.authService.getRole();
  }

  clearCache(): void {
    this.lastTokenValidation = 0;
    this.lastValidationResult = false;
    this.currentTokenCache = '';
  }
}
