import { Auth, user } from '@angular/fire/auth';
import { Role } from '@shared/interfaces/employee.interface';
import { inject, Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
	private _firestore = inject(Firestore);
	private _router = inject(Router);
	private Auth = inject(Auth);
	private auth = getAuth();
	user$ = user(this.Auth);
	// Ahora se incluye uid para poder acceder a la información completa del usuario
	public user = signal<{ uid: string, email: string, name: string, role: string } | null | undefined>(undefined);

	constructor() {
		// Se suscribe a los cambios de autenticación para actualizar el estado al recargar la página
		this.Auth.onAuthStateChanged((firebaseUser) => {
		if (firebaseUser) {
			this.actualizarUsuario(firebaseUser);
		} else {
			this.user.set(null);
		}
		});
	}

	async login(email: string, password: string): Promise<boolean> {
		try {
			const userCredential = await signInWithEmailAndPassword(this.Auth, email, password);
			const firebaseUser = userCredential.user;
			const token = await firebaseUser.getIdToken();
			localStorage.setItem('accessToken', token);
			// Actualiza los datos del usuario en la señal
			await this.actualizarUsuario(firebaseUser);
			Swal.fire({
				icon: 'success',
				title: 'Inicio de sesión correcto',
				text: 'Bienvenido',
				showConfirmButton: false,
				timer: 1500
			});
			// Pequeño retardo antes de la navegación
			await new Promise(resolve => setTimeout(resolve, 1000));
			const currentRole = this.user()?.role;
			if (currentRole === 'ADMIN' || currentRole === 'TI') {
				this._router.navigate(['/admin']);
			} else {
				this._router.navigate(['/orders-waiter']);
			}
			return true;
		} catch (error) {
			console.error("Authentication failed:", error);
			Swal.fire({
				icon: 'error',
				title: 'Inicio de sesión incorrecto',
				text: 'Usuario o contraseña incorrectos',
				showConfirmButton: false,
				timer: 1500
			});
			return false;
		}
	}

	logout() {
		this.user.set(null);
		this.auth.signOut();
		localStorage.removeItem('accessToken');
		this._router.navigate(['/login']);
	}

	getRole(): Role | null {
		return this.user()?.role as Role;
	}

	async setRole() {
		const currentUser = this.user();
		if (currentUser) {
		const userDoc = doc(this._firestore, `employees/${currentUser.uid}`);
		const userDocData = await getDoc(userDoc);
		if (userDocData.exists()) {
			this.user.set({
			...currentUser,
			name: userDocData.get('name'),
			role: userDocData.get('role')
			});
		}
		}
	}

	getNavItems() {
		const role = this.getRole();
		if (role === 'ADMIN' || role === 'TI') {
		return [
			{ name: 'Pedidos', route: 'orders-waiter', icon: 'pi-list' },
			{ name: 'Productos', route: 'products', icon: 'pi-box' },
			{ name: 'Usuarios', route: 'employees', icon: 'pi-user' },
			{ name: 'Historial', route: 'history', icon: 'pi-clock' },
		];
		} else if (role === 'CAJA') {
		return [
			{ name: 'Pedidos', route: 'orders-waiter', icon: 'pi-list' },
			{ name: 'Productos', route: 'products', icon: 'pi-box' },
		];
		}
		return [
		{ name: 'Pedidos', route: 'orders-waiter', icon: 'pi-list' },
		];
	}

	async validateToken(token: string) {
		const payload = this.decodeToken(token);
		if (!payload) {
		localStorage.removeItem('accessToken');
		this._router.navigate(['/login']);
		return false;
		}
		// Verifica que el token no haya expirado
		if (payload.exp < Date.now() / 1000) {
		localStorage.removeItem('accessToken');
		this._router.navigate(['/login']);
		return false;
		}
		const userDoc = doc(this._firestore, `employees/${payload.user_id}`);
		const userDocData = await getDoc(userDoc);
		if (!userDocData.exists()) {
		localStorage.removeItem('accessToken');
		this._router.navigate(['/login']);
		return false;
		}
		this.user.set({
		uid: payload.user_id,
		email: payload.email,
		name: userDocData.get('name'),
		role: userDocData.get('role')
		});
		return true;
	}

	private decodeToken(token: string) {
		try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c =>
			'%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
		).join(''));

		return JSON.parse(jsonPayload);
		} catch (error) {
		console.error("Error decoding token:", error);
		return null;
		}
	}

	// Función centralizada para actualizar los datos del usuario desde Firestore
	private async actualizarUsuario(firebaseUser: any) {
		const userDoc = doc(this._firestore, `employees/${firebaseUser.uid}`);
		const userDocData = await getDoc(userDoc);
		if (userDocData.exists()) {
		this.user.set({
			uid: firebaseUser.uid,
			email: firebaseUser.email,
			name: userDocData.get('name'),
			role: userDocData.get('role')
		});
		} else {
		Swal.fire({
			icon: 'error',
			title: 'Error de autenticación',
			text: 'No se encontraron datos de usuario',
			showConfirmButton: false,
			timer: 1500
		});
		this.logout();
		}
	}
}
