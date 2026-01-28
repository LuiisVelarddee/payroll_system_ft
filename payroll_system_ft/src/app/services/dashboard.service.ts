import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalPayroll: number;
  totalDeliveries: number;
  totalBonuses: number;
  totalDeductions: number;
}

export interface MonthlyTrend {
  month: string;
  baseSalary: number;
  deliveryBonus: number;
  hourBonus: number;
}

export interface ExpenseDistribution {
  netSalary: number;
  deductions: number;
}

export interface EmployeeDetail {
  employeeNumber: string;
  name: string;
  hoursWorked: number;
  deliveryPayment: number;
  deductions: number;
  foodVouchers: number;
  totalNet: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8000/api/dashboard';

  constructor(private http: HttpClient) { }

  getStats(month?: string, year?: number): Observable<any> {
    let params = new HttpParams();
    
    if (month) {
      params = params.set('month', month);
    }
    
    if (year) {
      params = params.set('year', year.toString());
    }
    
    return this.http.get<any>(`${this.apiUrl}/stats`, { params });
  }

  getMonthlyTrend(year: number): Observable<any> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<any>(`${this.apiUrl}/monthly-trend`, { params });
  }

  getExpenseDistribution(month?: string, year?: number): Observable<any> {
    let params = new HttpParams();
    
    if (month) {
      params = params.set('month', month);
    }
    
    if (year) {
      params = params.set('year', year.toString());
    }
    
    return this.http.get<any>(`${this.apiUrl}/expense-distribution`, { params });
  }

  getEmployeeDetails(month: string, year: number): Observable<any> {
    const params = new HttpParams()
      .set('month', month)
      .set('year', year.toString());
    
    return this.http.get<any>(`${this.apiUrl}/employee-details`, { params });
  }

  getAvailableYears(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/available-years`);
  }
}
