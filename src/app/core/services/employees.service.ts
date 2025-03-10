import { collectionData, collection, Firestore, doc, deleteDoc, addDoc, updateDoc, setDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { inject, Injectable, signal } from '@angular/core';
import { Employee } from '@shared/interfaces/employee.interface';
import { DialogService } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { EmployeeModalComponent } from 'src/app/pages/admin/components/employee-modal/employee-modal.component';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  constructor() {}

  private dialogService = inject(DialogService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

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
          const userRef = doc(this.firestore, 'employees', user.id);
          deleteDoc(userRef).then(() => {
            Swal.fire('Eliminado', 'El empleado ha sido eliminado', 'success');
          });
        } catch (error) {
          Swal.fire('Error', 'Ocurrió un error al eliminar el empleado', 'error');
        }
      }
    });
  }

  addEmployee(employee: Employee, password: string) {
    const employeeData = { email: employee.email, name: employee.name, role: employee.role };

    createUserWithEmailAndPassword(this.auth, employeeData.email, password)
      .then((userCredential) => {
        const userId = userCredential.user.uid;
        const employeeRef = doc(this.firestore, 'employees', userId);
        return setDoc(employeeRef, { ...employeeData, id: userId });
      })
      .catch((error) => {
        Swal.fire('Error', 'Ocurrió un error al agregar el empleado', 'error');
      });
  }

  updateEmployee(employee: Employee) {
    const employeeRef = doc(this.firestore, 'employees', employee.id);
    return updateDoc(employeeRef, { ...employee });
  }
}
