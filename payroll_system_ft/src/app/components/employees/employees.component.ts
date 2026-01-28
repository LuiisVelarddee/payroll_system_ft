import { Component, OnInit } from '@angular/core';
import { EmployeeService, Employee } from '../../services/employee.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  roles: any[] = [];
  loading = false;
  showForm = false;
  isEditing = false;
  successMessage = '';
  errorMessage = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  employeeForm: Employee = {
    employeeNumber: '',
    nameEmployee: '',
    roleID: 0,
    password: '',
    is_admin: false
  };

  constructor(
    private employeeService: EmployeeService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadRoles();
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService.getEmployees(undefined, false).subscribe({
      next: (response) => {
        if (response.success) {
          this.employees = response.data;        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.showError('Error al cargar los empleados');
        this.loading = false;
      }
    });
  }

  loadRoles(): void {
    this.roleService.getRoles(true, false).subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
      }
    });
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.employeeForm = {
      employeeNumber: '',
      nameEmployee: '',
      roleID: 0,
      password: '',
      is_admin: false
    };
    this.showForm = true;
    this.clearMessages();
  }

  openEditForm(employee: Employee): void {
    this.isEditing = true;
    this.employeeForm = { 
      ...employee,
      is_admin: employee.user?.is_admin || false
    };
    this.showForm = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showForm = false;
    this.employeeForm = {
      employeeNumber: '',
      nameEmployee: '',
      roleID: 0,
      password: '',
      is_admin: false
    };
  }

  saveEmployee(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    if (this.isEditing && this.employeeForm.id) {
      const updateData = {
        ...this.employeeForm,
        userUpdate: userAction
      };
      
      this.employeeService.updateEmployee(this.employeeForm.id, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Empleado actualizado exitosamente');
            this.loadEmployees();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar empleado:', error);
          this.showError(error.error?.message || 'Error al actualizar el empleado');
          this.loading = false;
        }
      });
    } else {
      const createData = {
        ...this.employeeForm,
        userCreation: userAction
      };
      
      this.employeeService.createEmployee(createData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Empleado creado exitosamente');
            this.loadEmployees();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al crear empleado:', error);
          this.showError(error.error?.message || 'Error al crear el empleado');
          this.loading = false;
        }
      });
    }
  }

  deleteEmployee(employee: Employee): void {
    if (!confirm(`¿Estás seguro de desactivar al empleado ${employee.nameEmployee}?`)) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.employeeService.deleteEmployee(employee.id!, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Empleado desactivado exitosamente');
          this.loadEmployees();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al desactivar empleado:', error);
        this.showError('Error al desactivar el empleado');
        this.loading = false;
      }
    });
  }

  restoreEmployee(employee: Employee): void {
    if (!confirm(`¿Estás seguro de restaurar al empleado ${employee.nameEmployee}?`)) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.employeeService.restoreEmployee(employee.id!, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Empleado restaurado exitosamente');
          this.loadEmployees();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al restaurar empleado:', error);
        this.showError('Error al restaurar el empleado');
        this.loading = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.employeeForm.employeeNumber?.trim()) {
      this.showError('El número de empleado es requerido');
      return false;
    }

    if (!this.employeeForm.nameEmployee?.trim()) {
      this.showError('El nombre del empleado es requerido');
      return false;
    }

    if (!this.employeeForm.roleID || this.employeeForm.roleID === 0) {
      this.showError('Debe seleccionar un rol');
      return false;
    }

    if (!this.isEditing && !this.employeeForm.password?.trim()) {
      this.showError('La contraseña es requerida');
      return false;
    }

    if (!this.isEditing && this.employeeForm.password && this.employeeForm.password.length < 6) {
      this.showError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.employees.sort((a: any, b: any) => {
      let aVal = a[column];
      let bVal = b[column];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  getRoleName(roleID: number): string {
    const role = this.roles.find(r => r.id === roleID || r.idRole === roleID);
    return role ? role.nameRole : 'N/A';
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
