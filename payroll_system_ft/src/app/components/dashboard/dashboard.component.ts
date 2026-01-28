import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Stats
  totalPayroll: number = 0;
  totalDeliveries: number = 0;
  totalBonuses: number = 0;
  totalDeductions: number = 0;

  // Monthly Trend Data
  monthlyTrendData: any[] = [];
  trendChart: any;

  // Expense Distribution
  expenseChart: any;

  // Employee Details
  employeeDetails: any[] = [];

  // Filters
  months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  years: number[] = [];
  nextYear: number = new Date().getFullYear() + 1;
  selectedMonth: string = '';
  selectedYear: number = new Date().getFullYear();

  loading = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.selectedMonth = ''; // Iniciar con 'Todo el año'
    this.loadAvailableYears();
  }

  loadAvailableYears(): void {
    this.dashboardService.getAvailableYears().subscribe({
      next: (response) => {
        if (response.success && response.data.length > 0) {
          this.years = response.data;
          // Si el año actual no está en la lista, agregarlo
          const currentYear = new Date().getFullYear();
          if (!this.years.includes(currentYear)) {
            this.years.push(currentYear);
            this.years.sort((a, b) => a - b);
          }
          // Establecer el año más reciente como seleccionado
          this.selectedYear = Math.max(...this.years);
          this.loadDashboardData();
        } else {
          // Si no hay años con datos, usar el año actual
          this.years = [new Date().getFullYear()];
          this.loadDashboardData();
        }
      },
      error: (error) => {
        console.error('Error al cargar años disponibles:', error);
        // En caso de error, usar el año actual
        this.years = [new Date().getFullYear()];
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.loadStats();
    this.loadMonthlyTrend();
    this.loadExpenseDistribution();
    this.loadEmployeeDetails();
  }

  loadStats(): void {
    this.dashboardService.getStats(this.selectedMonth, this.selectedYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalPayroll = response.data.totalPayroll || 0;
          this.totalDeliveries = response.data.totalDeliveries || 0;
          this.totalBonuses = response.data.totalBonuses || 0;
          this.totalDeductions = response.data.totalDeductions || 0;
        }
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  loadMonthlyTrend(): void {
    this.dashboardService.getMonthlyTrend(this.selectedYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.monthlyTrendData = response.data;
          this.prepareTrendChart();
        }
      },
      error: (error) => {
        console.error('Error al cargar tendencia mensual:', error);
      }
    });
  }

  loadExpenseDistribution(): void {
    this.dashboardService.getExpenseDistribution(this.selectedMonth, this.selectedYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.prepareExpenseChart(response.data);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar distribución de gastos:', error);
        this.loading = false;
      }
    });
  }

  loadEmployeeDetails(): void {
    this.dashboardService.getEmployeeDetails(this.selectedMonth, this.selectedYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.employeeDetails = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar detalles de empleados:', error);
      }
    });
  }

  prepareTrendChart(): void {
    const labels = this.monthlyTrendData.map(item => item.month);
    const baseSalaryData = this.monthlyTrendData.map(item => item.baseSalary);
    const deliveryBonusData = this.monthlyTrendData.map(item => item.deliveryBonus);
    const hourBonusData = this.monthlyTrendData.map(item => item.hourBonus);

    // Destroy previous chart if exists
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    // Create new chart
    const ctx = document.getElementById('trendChart') as HTMLCanvasElement;
    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Sueldo Base',
            data: baseSalaryData,
            backgroundColor: '#3498db'
          },
          {
            label: 'Entregas',
            data: deliveryBonusData,
            backgroundColor: '#2ecc71'
          },
          {
            label: 'Bonos',
            data: hourBonusData,
            backgroundColor: '#9b59b6'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  prepareExpenseChart(data: any): void {
    const total = data.netSalary + data.deductions;
    const netPercentage = total > 0 ? ((data.netSalary / total) * 100).toFixed(0) : 0;
    const deductionsPercentage = total > 0 ? ((data.deductions / total) * 100).toFixed(0) : 0;

    // Destroy previous chart if exists
    if (this.expenseChart) {
      this.expenseChart.destroy();
    }

    // Create new chart
    const ctx = document.getElementById('expenseChart') as HTMLCanvasElement;
    this.expenseChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [`Sueldo Neto (${netPercentage}%)`, `Retenciones (${deductionsPercentage}%)`],
        datasets: [{
          data: [data.netSalary, data.deductions],
          backgroundColor: ['#3498db', '#e74c3c']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%'
      }
    });
  }

  onFilterChange(): void {
    this.loadDashboardData();
  }

  getProgressPercentage(hoursWorked: number): number {
    const maxHours = 192; // 8 horas * 6 días * 4 semanas
    return (hoursWorked / maxHours) * 100;
  }
}
