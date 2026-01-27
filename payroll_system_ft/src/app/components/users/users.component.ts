import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  showForm = false;
  showPasswordModal = false;
  isEditing = false;
  successMessage = '';
  errorMessage = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedUserId: number = 0;
  newPassword: string = '';

  userForm: User = {
    employeeNumber: '',
    password: '',
    is_admin: false,
    changePass: false
  };

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers(undefined, false).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.showError('Error al cargar los usuarios');
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.userForm = {
      employeeNumber: '',
      password: '',
      is_admin: false,
      changePass: false
    };
    this.showForm = true;
    this.clearMessages();
  }

  openEditForm(user: User): void {
    this.isEditing = true;
    this.userForm = { 
      ...user,
      password: '' // Don't populate password for edit
    };
    this.showForm = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showForm = false;
    this.userForm = {
      employeeNumber: '',
      password: '',
      is_admin: false,
      changePass: false
    };
  }

  saveUser(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    if (this.isEditing && this.userForm.id) {
      const updateData = {
        ...this.userForm,
        userUpdate: userAction
      };
      
      // Remove password if empty
      if (!updateData.password) {
        delete updateData.password;
      }
      
      this.userService.updateUser(this.userForm.id, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Usuario actualizado exitosamente');
            this.loadUsers();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          this.showError(error.error?.message || 'Error al actualizar el usuario');
          this.loading = false;
        }
      });
    } else {
      const createData = {
        ...this.userForm,
        userCreation: userAction
      };
      
      this.userService.createUser(createData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Usuario creado exitosamente');
            this.loadUsers();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          this.showError(error.error?.message || 'Error al crear el usuario');
          this.loading = false;
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (!confirm(`¿Estás seguro de desactivar al usuario ${user.employeeNumber}?`)) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.userService.deleteUser(user.id!, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Usuario desactivado exitosamente');
          this.loadUsers();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al desactivar usuario:', error);
        this.showError('Error al desactivar el usuario');
        this.loading = false;
      }
    });
  }

  restoreUser(user: User): void {
    if (!confirm(`¿Estás seguro de restaurar al usuario ${user.employeeNumber}?`)) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.userService.restoreUser(user.id!, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Usuario restaurado exitosamente');
          this.loadUsers();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al restaurar usuario:', error);
        this.showError('Error al restaurar el usuario');
        this.loading = false;
      }
    });
  }

  toggleBlock(user: User): void {
    const action = user.isBlock ? 'desbloquear' : 'bloquear';
    if (!confirm(`¿Estás seguro de ${action} al usuario ${user.employeeNumber}?`)) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.userService.toggleBlock(user.id!, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(response.message);
          this.loadUsers();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cambiar estado de bloqueo:', error);
        this.showError('Error al cambiar estado de bloqueo');
        this.loading = false;
      }
    });
  }

  openPasswordModal(user: User): void {
    this.selectedUserId = user.id!;
    this.newPassword = '';
    this.showPasswordModal = true;
    this.clearMessages();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.selectedUserId = 0;
    this.newPassword = '';
  }

  changePassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.userService.changePassword(this.selectedUserId, this.newPassword, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Contraseña actualizada exitosamente');
          this.loadUsers();
          this.closePasswordModal();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        this.showError('Error al cambiar la contraseña');
        this.loading = false;
      }
    });
  }

  resetAttempts(user: User): void {
    if (!confirm(`¿Reiniciar intentos de inicio de sesión para ${user.employeeNumber}?`)) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.userService.resetAttempts(user.id!, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Intentos reiniciados exitosamente');
          this.loadUsers();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al reiniciar intentos:', error);
        this.showError('Error al reiniciar intentos');
        this.loading = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.userForm.employeeNumber?.trim()) {
      this.showError('El número de empleado es requerido');
      return false;
    }

    if (!this.isEditing && !this.userForm.password?.trim()) {
      this.showError('La contraseña es requerida');
      return false;
    }

    if (!this.isEditing && this.userForm.password && this.userForm.password.length < 6) {
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

    this.users.sort((a: any, b: any) => {
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
