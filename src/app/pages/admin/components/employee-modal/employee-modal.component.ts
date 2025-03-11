import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CommonModule } from '@angular/common';
import { EmployeesService } from '@core/services/employees.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-modal',
  standalone: true,
  imports: [CommonModule, DropdownModule, ReactiveFormsModule],
  templateUrl: './employee-modal.component.html',
  styleUrl: './employee-modal.component.scss',
})
export class EmployeeModalComponent implements OnInit {
  employeeForm!: FormGroup;
  roles = [
    { name: 'ADMIN' },
    { name: 'TI' },
    { name: 'CAJA' },
    { name: 'MESERO' },
  ];

  private empService = inject(EmployeesService);

  private _selectedUser = signal<any | null>(null);
  public selectedUser = computed(() => this._selectedUser());

  constructor(
    private fb: FormBuilder,
  ) {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: [''],
    });
  }

  ngOnInit(): void {
    if (this.empService.selectedUser()) {
      this._selectedUser.set(this.empService.selectedUser());
      this.employeeForm.patchValue({...this.empService.selectedUser()});
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.employeeForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (controlName === 'email' && control?.hasError('email')) {
      return 'Email no válido';
    }
    return '';
  }

  saveEmployee(): void {
    if (this.employeeForm.valid) {
      if (this.empService.selectedUser()) {
        this.empService.updateEmployee(this.employeeForm.value);
      } else {
        if (!this.employeeForm.get('password')?.value) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'La contraseña es requerida' });
          return;
        }
        this.empService.addEmployee(this.employeeForm.value, this.employeeForm.get('password')?.value);
      }
      this.empService.closeModal();
    }
  }

  closeModal(): void {
    this.empService.closeModal();
  }
}
