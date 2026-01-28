import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RolesComponent } from './components/roles/roles.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { UsersComponent } from './components/users/users.component';
import { PayrollComponent } from './components/payroll/payroll.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardComparativoComponent } from './components/dashboard-comparativo/dashboard-comparativo.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    RolesComponent,
    EmployeesComponent,
    UsersComponent,
    PayrollComponent,
    DashboardComponent,
    DashboardComparativoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
