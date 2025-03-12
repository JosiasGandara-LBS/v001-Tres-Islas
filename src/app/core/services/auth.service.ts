import { Role } from '@shared/interfaces/employee.interface';
import { inject, Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { getAuth, signInWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private user = signal<{ email: string, name: string, role: string } | null>(null);
	private _firestore = inject(Firestore);
	private _router = inject(Router);

	async login(email: string, password: string): Promise<boolean> {
		const auth = getAuth();
		return await signInWithEmailAndPassword(auth, email, password)
			.then(async (userCredential) => {
				try {
					const user = { email: userCredential.user.email, uid: userCredential.user.uid, role: '' };
					const token = await userCredential.user.getIdToken();
					localStorage.setItem('accessToken', token);
					const userDoc = doc(this._firestore, `employees/${user.uid}`);
					if (!userDoc) {
						Swal.fire({
							icon: 'error',
							title: 'Inicio de sesión incorrecto',
							text: 'Usuario o contraseña incorrectos',
							showConfirmButton: false,
							timer: 1500
						});
						return false;
					}
					const userDocData = await getDoc(userDoc);
					this.user.set({ email: user.email!, name: userDocData.get('name'),role: userDocData.get('role') });
					Swal.fire({
						icon: 'success',
						title: 'Inicio de sesión correcto',
						text: 'Bienvenido',
						showConfirmButton: false,
						timer: 1500
					});
					await new Promise(resolve => setTimeout(resolve, 1000));
					if (this.user()?.role === 'ADMIN' || this.user()?.role === 'TI') {
						this._router.navigate(['/admin']);
					}
					else {
						this._router.navigate(['/orders-waiter']);
					}
					return true;
				} catch (error) {
					console.error("Error getting user data:", error);
					Swal.fire({
						icon: 'error',
						title: 'Inicio de sesión incorrecto',
						text: 'Usuario o contraseña incorrectos',
						showConfirmButton: false,
						timer: 1500
					});
					return false;
				}
			})
			.catch((error) => {
				console.error("Authentication failed:", error);
				Swal.fire({
					icon: 'error',
					title: 'Inicio de sesión incorrecto',
					text: 'Usuario o contraseña incorrectos',
					showConfirmButton: false,
					timer: 1500
				});
				return false;
			});
	}

	logout() {
		this.user.set(null);
		localStorage.removeItem('accessToken');
		this._router.navigate(['/login']);
	}

	getRole(): Role | null {
		return this.user()?.role as Role;
	}

	getNavItems() {
		if (this.getRole() === 'ADMIN' || this.getRole() === 'TI') {
			return [
				{ name: 'Pedidos', route: 'orders-waiter', icon: 'pi-list' },
				{ name: 'Productos', route: 'products', icon: 'pi-box' },
				{ name: 'Usuarios', route: 'employees', icon: 'pi-user' },
			];
		} else if (this.getRole() === 'CAJA') {
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
		// if (payload.exp < Date.now() / 1000) {
		// 	localStorage.removeItem('accessToken');
		// 	this._router.navigate(['/login']);
		// 	return false;
		// }
		const userDoc = await doc(this._firestore, `employees/${payload.user_id}`);
		if (!userDoc) {
			localStorage.removeItem('accessToken');
			this._router.navigate(['/login']);
			return false;
		}
		const userDocData = await getDoc(userDoc);
		this.user.set({ email: payload.email, name: userDocData.get('name'), role: userDocData.get('role') });
		return true;
	}

	private decodeToken(token: string) {
		var base64Url = token.split('.')[1];
		var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));

		return JSON.parse(jsonPayload);
	}
}