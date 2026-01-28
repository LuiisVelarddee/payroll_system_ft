import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RolesComponent } from './components/roles/roles.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { UsersComponent } from './components/users/users.component';
import { PayrollComponent } from './components/payroll/payroll.component';

const routes: Routes = [
  { path: '', redirectTo: '/roles', pathMatch: 'full' },
  { path: 'roles', component: RolesComponent },
  { path: 'empleados', component: EmployeesComponent },
  { path: 'usuarios', component: UsersComponent },
  { path: 'nomina', component: PayrollComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
