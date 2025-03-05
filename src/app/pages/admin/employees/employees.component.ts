import { Component, Inject, OnInit } from '@angular/core';
import { EmployeesService } from '@core/services/employees.service';

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './employees.component.html',
  styleUrls: []
})
export class EmployeesComponent implements OnInit {
  private empService = Inject(EmployeesService);
  users: any[] = [];
  filteredUsers: any[] = [];
  isModalOpen = false;

  ngOnInit() {
    this.empService.getUsers().subscribe((data: unknown) => {
      this.users = data as any[];
      this.filteredUsers = this.users;
    });
  }

  filterUsers(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredUsers = this.users.filter(user => user.name.toLowerCase().includes(query));
  }

  openAddUserModal() {
    this.isModalOpen = true;
  }

  openEditUserModal(user: any) {
    this.isModalOpen = true;
    // Load user data into modal
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
