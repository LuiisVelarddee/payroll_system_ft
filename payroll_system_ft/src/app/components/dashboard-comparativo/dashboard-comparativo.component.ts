import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-comparativo',
  templateUrl: './dashboard-comparativo.component.html',
  styleUrls: ['./dashboard-comparativo.component.css']
})
export class DashboardComparativoComponent implements OnInit {
  // Current period stats
  currentStats: any = {
    totalPayroll: 0,
    totalDeliveries: 0,
    totalBonuses: 0,
    totalDeductions: 0
  };

  // Previous period stats
  previousStats: any = {
    totalPayroll: 0,
    totalDeliveries: 0,
    totalBonuses: 0,
    totalDeductions: 0
  };

  // Comparison percentages
  payrollDiff: number = 0;
  deliveriesDiff: number = 0;
  bonusesDiff: number = 0;
  deductionsDiff: number = 0;

  // Employee comparison
  currentEmployeeDetails: any[] = [];
  previousEmployeeDetails: any[] = [];

  // Chart
  comparisonChart: any;

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
    this.selectedMonth = this.months[new Date().getMonth()];
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
          this.loadComparativeData();
        } else {
          // Si no hay años con datos, usar el año actual
          this.years = [new Date().getFullYear()];
          this.loadComparativeData();
        }
      },
      error: (error) => {
        console.error('Error al cargar años disponibles:', error);
        // En caso de error, usar el año actual
        this.years = [new Date().getFullYear()];
        this.loadComparativeData();
      }
    });
  }

  loadComparativeData(): void {
    this.loading = true;
    this.loadCurrentStats();
    this.loadPreviousStats();
    this.loadCurrentEmployeeDetails();
    this.loadPreviousEmployeeDetails();
  }

  loadCurrentStats(): void {
    this.dashboardService.getStats(this.selectedMonth, this.selectedYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentStats = response.data;
          this.calculateDifferences();
          this.prepareComparisonChart();
        }
      },
      error: (error) => {
        console.error('Error al cargar estadísticas actuales:', error);
      }
    });
  }

  loadPreviousStats(): void {
    const previousYear = this.selectedYear - 1;
    this.dashboardService.getStats(this.selectedMonth, previousYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.previousStats = response.data;
          this.calculateDifferences();
          this.prepareComparisonChart();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas anteriores:', error);
        this.loading = false;
      }
    });
  }

  loadCurrentEmployeeDetails(): void {
    this.dashboardService.getEmployeeDetails(this.selectedMonth, this.selectedYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentEmployeeDetails = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar detalles actuales:', error);
      }
    });
  }

  loadPreviousEmployeeDetails(): void {
    const previousYear = this.selectedYear - 1;
    this.dashboardService.getEmployeeDetails(this.selectedMonth, previousYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.previousEmployeeDetails = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar detalles anteriores:', error);
      }
    });
  }

  calculateDifferences(): void {
    this.payrollDiff = this.calculatePercentageDiff(this.previousStats.totalPayroll, this.currentStats.totalPayroll);
    this.deliveriesDiff = this.calculatePercentageDiff(this.previousStats.totalDeliveries, this.currentStats.totalDeliveries);
    this.bonusesDiff = this.calculatePercentageDiff(this.previousStats.totalBonuses, this.currentStats.totalBonuses);
    this.deductionsDiff = this.calculatePercentageDiff(this.previousStats.totalDeductions, this.currentStats.totalDeductions);
  }

  calculatePercentageDiff(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  prepareComparisonChart(): void {
    if (this.comparisonChart) {
      this.comparisonChart.destroy();
    }

    const ctx = document.getElementById('comparisonChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Gasto Total', 'Entregas', 'Bonos', 'Retenciones'],
        datasets: [
          {
            label: `${this.selectedMonth} ${this.selectedYear - 1}`,
            data: [
              this.previousStats.totalPayroll,
              this.previousStats.totalDeliveries * 5, // Multiply by 5 to show monetary value
              this.previousStats.totalBonuses,
              this.previousStats.totalDeductions
            ],
            backgroundColor: '#95a5a6'
          },
          {
            label: `${this.selectedMonth} ${this.selectedYear}`,
            data: [
              this.currentStats.totalPayroll,
              this.currentStats.totalDeliveries * 5,
              this.currentStats.totalBonuses,
              this.currentStats.totalDeductions
            ],
            backgroundColor: '#3498db'
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
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += '$' + context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                return label;
              }
            }
          }
        }
      },
      plugins: [{
        id: 'barValuePlugin',
        afterDatasetsDraw: (chart: any) => {
          const ctx = chart.ctx;
          chart.data.datasets.forEach((dataset: any, i: number) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
              meta.data.forEach((bar: any, index: number) => {
                const data = dataset.data[index];
                if (data > 0) {
                  ctx.fillStyle = '#2c3e50';
                  ctx.font = 'bold 11px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'bottom';
                  
                  const text = '$' + data.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                  ctx.fillText(text, bar.x, bar.y - 5);
                }
              });
            }
          });
        }
      }]
    });
  }

  onFilterChange(): void {
    this.loadComparativeData();
  }

  getEmployeeDifference(employeeNumber: string): any {
    const current = this.currentEmployeeDetails.find(e => e.employeeNumber === employeeNumber);
    const previous = this.previousEmployeeDetails.find(e => e.employeeNumber === employeeNumber);

    if (!current || !previous) return null;

    return {
      current: current,
      previous: previous,
      diff: this.calculatePercentageDiff(previous.totalNet, current.totalNet)
    };
  }

  getAllEmployeeNumbers(): string[] {
    const currentNumbers = this.currentEmployeeDetails.map(e => e.employeeNumber);
    const previousNumbers = this.previousEmployeeDetails.map(e => e.employeeNumber);
    return Array.from(new Set([...currentNumbers, ...previousNumbers]));
  }
}
