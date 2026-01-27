import { Component, OnInit } from '@angular/core';
import { RoleService, Role, ApiResponse } from '../../services/role.service';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  selectedRole: Role | null = null;
  isEditing: boolean = false;
  showForm: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  roleForm: Role = {
    nameRole: '',
    salaryBase: 0,
    bonusRole: 0,
    bonusHours: 0,
    bonusDeliveries: 0,
    is_admin: false
  };

  constructor(private roleService: RoleService) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService.getRoles(undefined, false).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success && response.data) {
          this.roles = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.showError('Error al cargar los roles');
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.resetForm();
    this.isEditing = false;
    this.showForm = true;
  }

  openEditForm(role: Role): void {
    this.selectedRole = role;
    this.roleForm = { ...role };
    this.isEditing = true;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.roleForm = {
      nameRole: '',
      salaryBase: 0,
      bonusRole: 0,
      bonusHours: 0,
      bonusDeliveries: 0,
      is_admin: false
    };
    this.selectedRole = null;
    this.errorMessage = '';
  }

  saveRole(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    const roleData = {
      ...this.roleForm,
      userCreation: 'Admin',
      userUpdate: 'Admin'
    };

    if (this.isEditing && this.selectedRole?.id) {
      this.roleService.updateRole(this.selectedRole.id, roleData).subscribe({
        next: (response: ApiResponse<Role>) => {
          if (response.success) {
            this.showSuccess('Role actualizado exitosamente');
            this.loadRoles();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error) => {
          this.showError('Error al actualizar el role');
          this.loading = false;
        }
      });
    } else {
      this.roleService.createRole(roleData).subscribe({
        next: (response: ApiResponse<Role>) => {
          if (response.success) {
            this.showSuccess('Role creado exitosamente');
            this.loadRoles();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error) => {
          this.showError('Error al crear el role');
          this.loading = false;
        }
      });
    }
  }

  deleteRole(role: Role): void {
    if (!role.id) return;
    
    if (confirm(`¿Está seguro de desactivar el role "${role.nameRole}"?`)) {
      this.loading = true;
      this.roleService.deleteRole(role.id, 'Admin').subscribe({
        next: (response: ApiResponse<Role>) => {
          if (response.success) {
            this.showSuccess('Role desactivado exitosamente');
            this.loadRoles();
          }
          this.loading = false;
        },
        error: (error) => {
          this.showError('Error al desactivar el role');
          this.loading = false;
        }
      });
    }
  }

  restoreRole(role: Role): void {
    if (!role.id) return;
    
    this.loading = true;
    this.roleService.restoreRole(role.id, 'Admin').subscribe({
      next: (response: ApiResponse<Role>) => {
        if (response.success) {
          this.showSuccess('Role restaurado exitosamente');
          this.loadRoles();
        }
        this.loading = false;
      },
      error: (error) => {
        this.showError('Error al restaurar el role');
        this.loading = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.roleForm.nameRole || this.roleForm.nameRole.trim() === '') {
      this.showError('El nombre del role es requerido');
      return false;
    }

    const isAdmin = this.roleForm.nameRole.trim().toLowerCase() === 'admin';

    // Si NO es Admin, validar que salarios y bonos sean mayores a 0
    if (!isAdmin) {
      if (this.roleForm.salaryBase <= 0) {
        this.showError('El salario base debe ser mayor a 0 para roles que no son Admin');
        return false;
      }
    }

    return true;
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3000);
  }

  calculateTotalSalary(role: Role): number {
    return (role.salaryBase || 0) + 
           (role.bonusRole || 0) + 
           (role.bonusHours || 0) + 
           (role.bonusDeliveries || 0);
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.roles.sort((a: any, b: any) => {
      let aVal = a[column];
      let bVal = b[column];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }
}
