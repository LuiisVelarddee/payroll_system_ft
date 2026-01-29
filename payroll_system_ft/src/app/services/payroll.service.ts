import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PayrollRecord {
  id?: number;
  employeeID: number;
  month: string;
  year: number;
  deliveries: number;
  baseSalary?: number;
  hourBonus?: number;
  deliveryBonus?: number;
  grossSalary?: number;
  isr?: number;
  foodVouchers?: number;
  netSalary?: number;
  userCreation?: string;
  dateCreation?: string;
  userUpdate?: string;
  dateUpdate?: string;
  statusPayroll?: boolean;
  employee?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = environment.api + '/payroll';

  constructor(private http: HttpClient) { }

  getPayrolls(statusPayroll?: boolean, month?: string, year?: number, paginate: boolean = false): Observable<any> {
    let params = new HttpParams();
    
    if (statusPayroll !== undefined) {
      params = params.set('statusPayroll', statusPayroll.toString());
    }
    
    if (month) {
      params = params.set('month', month);
    }
    
    if (year) {
      params = params.set('year', year.toString());
    }
    
    if (!paginate) {
      params = params.set('paginate', 'false');
    }
    
    return this.http.get<any>(this.apiUrl, { params });
  }

  getPayroll(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createPayroll(payroll: PayrollRecord): Observable<any> {
    return this.http.post<any>(this.apiUrl, payroll);
  }

  updatePayroll(id: number, payroll: Partial<PayrollRecord>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payroll);
  }

  deletePayroll(id: number, userUpdate?: string): Observable<any> {
    const body = userUpdate ? { userUpdate } : {};
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { body });
  }

  restorePayroll(id: number, userUpdate?: string): Observable<any> {
    const body = userUpdate ? { userUpdate } : {};
    return this.http.patch<any>(`${this.apiUrl}/${id}/restore`, body);
  }

  getAvailableYears(): Observable<any> {
    return this.http.get<any>('http://localhost:8000/api/dashboard/available-years');
  }
}
