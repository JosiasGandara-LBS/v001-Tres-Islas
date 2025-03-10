import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EmployeesService } from '@core/services/employees.service';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';


@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, ReactiveFormsModule],
  templateUrl: './employees.component.html',
  styleUrls: []
})
export class EmployeesComponent implements OnInit {
    private empService = inject(EmployeesService);
    private fb = inject(FormBuilder);

    private _employees = signal<any[]>([]);
    public employees = computed(() => this._employees());
    public filteredEmployees = signal<any[]>([]);
    private _selectedEmployee = signal<any | null>(null);
    public selectedEmployee = computed(() => this._selectedEmployee());

    public searchForm: FormGroup;

    public loadingEmployees = signal<boolean>(false);


    constructor() {
      this.searchForm = this.fb.group({
        query: ['']
      });
    }

    ngOnInit(): void {
      this.getEmployees();

      this.searchForm.get('query')?.valueChanges.subscribe((searchTerm) => {
        this.filterEmployees(searchTerm);
      });

    }

    getEmployees() {
      this.loadingEmployees.set(true);
      this.empService.getEmployees().subscribe((employees) => {
        this._employees.set(employees);
        this.filteredEmployees.set(employees);
      });
      this.loadingEmployees.set(false);
    }

    filterEmployees(searchTerm: string) {
      const filteredEmployees = this.employees().filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      this.filteredEmployees.set(filteredEmployees);
    }

    openAddEmployeeModal() {
      this.empService.openAddEmployeeModal();
    }

    openEditEmployeeModal(user: any) {
      this.empService.selectedUser.set(user);
      this.empService.openEditEmployeeModal();
    }

    deleteEmployee(user: any) {
      this.empService.deleteEmployee(user.id);
    }
}
