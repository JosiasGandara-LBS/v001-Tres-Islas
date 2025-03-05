import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'app-login',
	standalone: true,
	imports:[ReactiveFormsModule, CommonModule, InputTextModule, PasswordModule, ButtonModule, RouterModule],
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent {
	private router    		= inject(Router);
	private authService 	= inject(AuthService);
	private fb         		= inject(FormBuilder);

	public emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$";
	public isLoading: boolean = false;

	public loginForm: FormGroup = this.fb.group({
		email:    ['', [Validators.required, Validators.pattern(this.emailPattern)]],
		password: ['', [Validators.required, Validators.minLength(6)]],
	  });

	async login() {
		this.isLoading = true;
		const email = this.loginForm.value.email ?? '';
		const password = this.loginForm.value.password ?? '';
		if (!email || !password) {
			Swal.fire({
				icon: 'error',
				title: 'Inicio de sesión incorrecto',
				text: 'Usuario o contraseña incorrectos',
				showConfirmButton: false,
				timer: 1500
			});
			this.isLoading = false;
			return;
		}
		const res = await this.authService.login(email, password);
		this.isLoading = false;
		if (res) {
			if (this.authService.getRole() === 'ADMIN' || this.authService.getRole() === 'TI') {
				this.router.navigate(['/admin']);
			}
			else {
				this.router.navigate(['/orders-waiter']);
			}
		}
	}
}
