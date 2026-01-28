import { Component, OnInit } from '@angular/core';
import { PayrollService, PayrollRecord } from '../../services/payroll.service';
import { EmployeeService } from '../../services/employee.service';

interface EmployeeDelivery {
  employee: any;
  deliveries: number;
  hasExistingRecord: boolean;
}

@Component({
  selector: 'app-payroll',
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.css']
})
export class PayrollComponent implements OnInit {
  payrolls: PayrollRecord[] = [];
  employees: any[] = [];
  employeeDeliveries: EmployeeDelivery[] = [];
  payrollsByMonth: any[] = [];
  showAllMonths = true;
  selectedEmployeeRole: string = '';
  loading = false;
  showForm = false;
  isEditing = false;
  isBulkMode = false;
  successMessage = '';
  errorMessage = '';
  formMonth: string = '';
  formYear: number = new Date().getFullYear();
  
  months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  years: number[] = [];
  selectedMonth: string = '';
  selectedYear: number = new Date().getFullYear();

  payrollForm: PayrollRecord = {
    employeeID: 0,
    month: '',
    year: new Date().getFullYear(),
    deliveries: 0
  };

  constructor(
    private payrollService: PayrollService,
    private employeeService: EmployeeService
  ) {
    // Generate years array (current year - 2 to current year + 1) definimos cantidad de years a mostrar
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    this.selectedMonth = this.months[new Date().getMonth()];
    this.loadEmployees();
    
    // Cargar todos los meses con un pequeño delay para asegurar que el componente esté listo
    setTimeout(() => {
      this.loadAllMonths();
    }, 100);
  }

  loadEmployees(): void {
    this.employeeService.getEmployees(true, false).subscribe({
      next: (response) => {
        if (response && response.success && response.data && Array.isArray(response.data)) { 
          // Filtrar empleados excluyendo roleID = 1 (Admin)
          this.employees = response.data.filter((emp: any) => {
            return emp.roleID !== 1 && emp.roleID !== '1';
          });
        } 
      },
      error: (error) => {
      }
    });
  }

  loadPayrolls(): void {
    this.loading = true;
    this.payrollService.getPayrolls(undefined, this.selectedMonth, this.selectedYear, false).subscribe({
      next: (response) => {
        if (response.success) {
          this.payrolls = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.showError('Error al cargar las nóminas');
        this.loading = false;
      }
    });
  }

  loadAllMonths(): void {
    
    this.loading = true;
    
    // Primero inicializar todos los meses vacíos
    this.groupPayrollsByMonth([]);
    
    this.payrollService.getPayrolls(undefined, undefined, this.selectedYear, false).subscribe({
      next: (response) => {
        if (response.success) {
          // Agrupar por mes con los datos reales
          this.groupPayrollsByMonth(response.data);
        } else {
          // Si falla, al menos mostrar los meses vacíos
          this.groupPayrollsByMonth([]);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('=== ERROR AL CARGAR NÓMINAS ===');
        console.error('Error completo:', error);
        // En caso de error, mostrar los meses vacíos
        this.groupPayrollsByMonth([]);
        this.loading = false;
      }
    });
  }

  groupPayrollsByMonth(payrolls: PayrollRecord[]): void {
    const grouped: any = {};
    
    // Inicializar todos los meses del año
    this.months.forEach(month => {
      grouped[month] = {
        month: month,
        payrolls: [],
        totalNet: 0
      };
    });
    
    // Agregar nóminas a sus respectivos meses (si existen)
    if (payrolls && Array.isArray(payrolls)) {
      payrolls.forEach(payroll => {
        if (grouped[payroll.month]) {
          grouped[payroll.month].payrolls.push(payroll);
          // Asegurar que netSalary sea número
          const netSalary = typeof payroll.netSalary === 'number' 
            ? payroll.netSalary 
            : (payroll.netSalary ? parseFloat(String(payroll.netSalary)) : 0);
          grouped[payroll.month].totalNet += netSalary;
        }
      });
    }
    
    // Convertir a array ordenado por meses
    this.payrollsByMonth = this.months.map(month => grouped[month]);
  }

  isPastPeriod(month: string, year: number): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = this.months[currentDate.getMonth()];
    
    if (year < currentYear) {
      return true;
    }
    
    if (year === currentYear) {
      const monthIndex = this.months.indexOf(month);
      const currentMonthIndex = this.months.indexOf(currentMonth);
      return monthIndex < currentMonthIndex;
    }
    
    return false;
  }

  toggleView(): void {
    this.showAllMonths = !this.showAllMonths;
    if (this.showAllMonths) {
      this.loadAllMonths();
    } else {
      this.loadPayrolls();
    }
  }

  filterByPeriod(): void {
    if (this.showAllMonths) {
      this.loadAllMonths();
    } else {
      this.loadPayrolls();
    }
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.isBulkMode = true;
    this.formMonth = this.selectedMonth;
    this.formYear = this.selectedYear;
    
    // Verificar qué empleados ya tienen registro este mes/año
    this.payrollService.getPayrolls(undefined, this.formMonth, this.formYear, false).subscribe({
      next: (response) => {
        const existingRecords = response.success ? response.data : [];
        
        // Preparar array de empleados con sus entregas
        this.employeeDeliveries = this.employees.map(emp => {
          const existing = existingRecords.find((record: any) => record.employeeID === emp.id);
          return {
            employee: emp,
            deliveries: 0,
            hasExistingRecord: !!existing
          };
        });
        
        this.showForm = true;
        this.clearMessages();
      },
      error: (error) => {
        console.error('Error al verificar registros existentes:', error);
        this.showError('Error al cargar información');
      }
    });
  }

  onEmployeeChange(): void {
    
    // Convertir a número por si acaso viene como string
    const employeeId = Number(this.payrollForm.employeeID);
    const selectedEmployee = this.employees.find(emp => emp.id === employeeId);
    
    
    if (selectedEmployee) {
      if (selectedEmployee.role && selectedEmployee.role.nameRole) {
        this.selectedEmployeeRole = selectedEmployee.role.nameRole;
      } else {
        this.selectedEmployeeRole = 'Rol no disponible';
      }
    } else {
      this.selectedEmployeeRole = '';
    }
  }

  openEditForm(payroll: PayrollRecord): void {
    this.isEditing = true;
    this.isBulkMode = false;
    this.payrollForm = { ...payroll };
    this.showForm = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showForm = false;
    this.isBulkMode = false;
    this.employeeDeliveries = [];
    this.payrollForm = {
      employeeID: 0,
      month: '',
      year: new Date().getFullYear(),
      deliveries: 0
    };
  }

  savePayroll(): void {
    if (this.isBulkMode) {
      this.saveBulkPayroll();
    } else {
      this.saveSinglePayroll();
    }
  }

  saveBulkPayroll(): void {
    // Filtrar solo empleados con entregas > 0 y sin registro existente
    const employeesToCreate = this.employeeDeliveries.filter(
      ed => ed.deliveries > 0 && !ed.hasExistingRecord
    );

    if (employeesToCreate.length === 0) {
      this.showError('No hay registros para crear. Ingrese al menos una cantidad de entregas.');
      return;
    }

    this.loading = true;
    const userAction = 'admin';
    let createdCount = 0;
    let errorCount = 0;

    // Crear cada nómina secuencialmente
    employeesToCreate.forEach((empDelivery, index) => {
      const createData = {
        employeeID: empDelivery.employee.id,
        month: this.formMonth,
        year: this.formYear,
        deliveries: empDelivery.deliveries,
        userCreation: userAction
      };

      this.payrollService.createPayroll(createData).subscribe({
        next: (response) => {
          if (response.success) {
            createdCount++;
          }
          
          // Si es el último registro
          if (index === employeesToCreate.length - 1) {
            this.loading = false;
            if (createdCount > 0) {
              this.showSuccess(`Se crearon ${createdCount} registro(s) de nómina exitosamente`);
              this.loadPayrolls();
              this.closeForm();
            }
            if (errorCount > 0) {
              this.showError(`Hubo ${errorCount} error(es) al crear algunas nóminas`);
            }
          }
        },
        error: (error) => {
          errorCount++;
          console.error('Error al crear nómina:', error);
          
          // Si es el último registro
          if (index === employeesToCreate.length - 1) {
            this.loading = false;
            if (createdCount > 0) {
              this.showSuccess(`Se crearon ${createdCount} registro(s) de nómina`);
              this.loadPayrolls();
              this.closeForm();
            }
            this.showError(`Hubo ${errorCount} error(es) al crear algunas nóminas`);
          }
        }
      });
    });
  }

  saveSinglePayroll(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    if (this.isEditing && this.payrollForm.id) {
      const updateData = {
        deliveries: this.payrollForm.deliveries,
        userUpdate: userAction
      };
      
      this.payrollService.updatePayroll(this.payrollForm.id, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Nómina actualizada exitosamente');
            this.loadPayrolls();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar nómina:', error);
          this.showError(error.error?.message || 'Error al actualizar la nómina');
          this.loading = false;
        }
      });
    } else {
      // Verificar si ya existe un registro para este empleado en este mes/año
      this.payrollService.getPayrolls(undefined, this.payrollForm.month, this.payrollForm.year, false).subscribe({
        next: (checkResponse) => {
          if (checkResponse.success) {
            // Buscar si ya existe un registro para este empleado
            const existingRecord = checkResponse.data.find((record: any) => 
              record.employeeID === this.payrollForm.employeeID
            );
            
            if (existingRecord) {
              this.showError(`Ya existe un registro de nómina para este empleado en ${this.payrollForm.month} ${this.payrollForm.year}`);
              this.loading = false;
              return;
            }
            
            // Si no existe, crear el nuevo registro
            this.createNewPayroll(userAction);
          }
        },
        error: (error) => {
          console.error('Error al verificar duplicados:', error);
          this.showError('Error al verificar registros existentes');
          this.loading = false;
        }
      });
    }
  }
  
  private createNewPayroll(userAction: string): void {
    const createData = {
      ...this.payrollForm,
      userCreation: userAction
    };
    
    this.payrollService.createPayroll(createData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Nómina creada exitosamente');
          this.loadPayrolls();
          this.closeForm();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al crear nómina:', error);
        this.showError(error.error?.message || 'Error al crear la nómina');
        this.loading = false;
      }
    });
  }

  deletePayroll(payroll: PayrollRecord): void {
    if (!confirm(`¿Estás seguro de desactivar la nómina de ${payroll.employee?.nameEmployee}?`)) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.payrollService.deletePayroll(payroll.id!, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Nómina desactivada exitosamente');
          this.loadPayrolls();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al desactivar nómina:', error);
        this.showError('Error al desactivar la nómina');
        this.loading = false;
      }
    });
  }

  restorePayroll(payroll: PayrollRecord): void {
    if (!confirm(`¿Estás seguro de restaurar la nómina de ${payroll.employee?.nameEmployee}?`)) {
      return;
    }

    this.loading = true;
    const userAction = 'admin';

    this.payrollService.restorePayroll(payroll.id!, userAction).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Nómina restaurada exitosamente');
          this.loadPayrolls();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al restaurar nómina:', error);
        this.showError('Error al restaurar la nómina');
        this.loading = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.payrollForm.employeeID || this.payrollForm.employeeID === 0) {
      this.showError('Debe seleccionar un empleado');
      return false;
    }

    if (!this.payrollForm.month?.trim()) {
      this.showError('Debe seleccionar un mes');
      return false;
    }

    if (!this.payrollForm.year) {
      this.showError('Debe seleccionar un año');
      return false;
    }

    if (this.payrollForm.deliveries < 0) {
      this.showError('La cantidad de entregas no puede ser negativa');
      return false;
    }

    return true;
  }

  getEmployeeName(employeeID: number): string {
    const employee = this.employees.find(e => e.id === employeeID);
    return employee ? employee.nameEmployee : 'N/A';
  }

  getEmployeeNumber(employeeID: number): string {
    const employee = this.employees.find(e => e.id === employeeID);
    return employee ? employee.employeeNumber : 'N/A';
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
