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
  totalBaseSalary: number = 0;

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
    
    // Primero cargar los stats y luego la distribución de gastos
    this.dashboardService.getStats(this.selectedMonth, this.selectedYear).subscribe({
      next: (response) => {
        
        if (response.success) {
          this.totalDeliveries = Number(response.data.totalDeliveries) || 0;
          this.totalBonuses = Number(response.data.totalBonuses) || 0;
          this.totalDeductions = Number(response.data.totalDeductions) || 0;
          this.totalBaseSalary = Number(response.data.totalBaseSalary) || 0;
          
          // Calcular el Gasto Total Nómina en el frontend
          this.totalPayroll = this.totalBaseSalary + this.totalBonuses + this.totalDeductions;
          
          // Usar setTimeout para asegurar que los valores se actualicen
          setTimeout(() => {
            this.prepareExpenseChart(null);
          }, 100);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.loading = false;
      }
    });
    
    // Cargar el resto de datos en paralelo
    this.loadMonthlyTrend();
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
    // Forzar conversión a números
    const gastoTotalNomina = Number(this.totalPayroll) || 0;
    const totalSueldoBase = Number(this.totalBaseSalary) || 0;
    const totalBonos = Number(this.totalBonuses) || 0;
    const totalRetenciones = Number(this.totalDeductions) || 0;
    
    // Calcular el total para la gráfica (sin incluir el gasto total)
    const totalGastos = totalSueldoBase + totalBonos + totalRetenciones;
    
    // Calcular porcentajes reales
    let baseSalaryPct = 0;
    let bonusesPct = 0;
    let deductionsPct = 0;
    
    if (totalGastos > 0) {
      baseSalaryPct = (totalSueldoBase / totalGastos) * 100;
      bonusesPct = (totalBonos / totalGastos) * 100;
      deductionsPct = (totalRetenciones / totalGastos) * 100;
    }
    
    // Destruir gráfica anterior si existe
    if (this.expenseChart) {
      this.expenseChart.destroy();
    }

    // Crear nueva gráfica
    const ctx = document.getElementById('expenseChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('No se encontró el canvas expenseChart');
      return;
    }
    
    const centerTextPlugin = {
      id: 'centerText',
      afterDraw: (chart: any) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Texto superior "Gasto Total"
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText('Gasto Total', centerX, centerY - 12);
        
        // Monto del gasto total
        const amount = `$${gastoTotalNomina.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(amount, centerX, centerY + 12);
        
        ctx.restore();
      }
    };
    
    this.expenseChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          `Total Sueldo Base (${baseSalaryPct.toFixed(1)}%)`,
          `Total Bonos (${bonusesPct.toFixed(1)}%)`,
          `Total Retenciones ISR (${deductionsPct.toFixed(1)}%)`
        ],
        datasets: [{
          data: [totalSueldoBase, totalBonos, totalRetenciones],
          backgroundColor: ['#3498db', '#2ecc71', '#e74c3c'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label.split('(')[0].trim()}: $${value.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
              }
            }
          }
        }
      },
      plugins: [centerTextPlugin]
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
