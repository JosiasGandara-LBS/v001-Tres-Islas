import { collectionData, collection, Firestore, doc, deleteDoc, addDoc, updateDoc, setDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { inject, Injectable, signal } from '@angular/core';
import { Employee } from '@shared/interfaces/employee.interface';
import { DialogService } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { EmployeeModalComponent } from 'src/app/pages/admin/components/employee-modal/employee-modal.component';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { agregarUsuarioUrl, eliminarUsuarioUrl } from 'src/environment/functions.config';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  constructor() {}

  private dialogService = inject(DialogService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  private ref: any;

  public selectedUser = signal<Employee | null>(null);

  getEmployees() {
    return collectionData(collection(this.firestore, 'employees'), { idField: 'id' });
  }

  openAddEmployeeModal() {
    this.ref = this.dialogService.open(EmployeeModalComponent, {
      header: 'Agregar usuario',
      modal: true,
      keepInViewport: true,
      width: '80%',
      style: { 'max-height': '80%', 'height': 'auto' },
      contentStyle: { overflow: 'auto' },
    });
  }

  openEditEmployeeModal() {
    this.ref = this.dialogService.open(EmployeeModalComponent, {
      header: 'Editar usuario',
      modal: true,
      keepInViewport: true,
      width: '80%',
      style: { 'max-height': '80%', 'height': 'auto' },
      contentStyle: { overflow: 'auto' },
    });

    this.ref.onClose.subscribe((data: any) => {
      this.selectedUser.set(null);
    });
  }

  closeModal() {
    this.ref.close();
  }

  deleteUserFromFirebaseAuth(userId: string) {

	const url = eliminarUsuarioUrl;
	const body = {
		uid: userId
	}

    const deleteUser = this.http.post(url, body).subscribe(
		Response => {
			if (Response) {
				Swal.fire('Éxito', 'Empleado eliminado correctamente', 'success');
			}
			deleteUser.unsubscribe();
		},
		error => {
			Swal.fire('Error', `Ocurrió un error al eliminar el empleado: ${error.error.error}` , 'error');
			deleteUser.unsubscribe();
		}
	);
  }

	createUserFirebaseAuth(email: string, password: string, role: string, name: string) {
		const url = agregarUsuarioUrl;
		const body = {
			email: email,
			password: password,
			role: role,
			name: name
		}

		const createUser = this.http.post(url, body).subscribe(
			Response => {
				if (Response) {
					Swal.fire('Éxito', 'Empleado agregado correctamente', 'success');
				}
				createUser.unsubscribe();
			},
			error => {
				Swal.fire('Error', `Ocurrió un error al agregar el empleado: ${error.error.error}` , 'error');
				createUser.unsubscribe();
			}

		);
	}

  deleteEmployee(user: any) {
    Swal.fire({
      title: `¿Estás seguro de eliminar el empleado ${user.name}?`,
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        try {
			this.deleteUserFromFirebaseAuth(user.id)
        } catch (error) {
          	Swal.fire('Error', 'Ocurrió un error al eliminar el empleado', 'error');
        }
      }
    });
  }

  addEmployee(employee: Employee, password: string) {
    try {
		this.createUserFirebaseAuth(employee.email, password, employee.role, employee.name);
	} catch (error) {
		Swal.fire('Error', 'Ocurrió un error al agregar el empleado', 'error');
	}
  }

  updateEmployee(employee: Employee) {
    const employeeRef = doc(this.firestore, 'employees', employee.id);
    return updateDoc(employeeRef, { ...employee });
  }
}
