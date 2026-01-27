import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employee {
  id?: number;
  employeeNumber: string;
  nameEmployee: string;
  roleID: number;
  userID?: number;
  userCreation?: string;
  dateCreation?: string;
  userUpdate?: string;
  dateUpdate?: string;
  statusEmployee?: boolean;
  role?: any;
  user?: any;
  password?: string;
  is_admin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:8000/api/employees';

  constructor(private http: HttpClient) { }

  getEmployees(statusEmployee?: boolean, paginate: boolean = false): Observable<any> {
    let params = new HttpParams();
    
    if (statusEmployee !== undefined) {
      params = params.set('statusEmployee', statusEmployee.toString());
    }
    
    if (!paginate) {
      params = params.set('paginate', 'false');
    }
    
    return this.http.get<any>(this.apiUrl, { params });
  }

  getEmployee(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employee: Employee): Observable<any> {
    return this.http.post<any>(this.apiUrl, employee);
  }

  updateEmployee(id: number, employee: Employee): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, employee);
  }

  deleteEmployee(id: number, userUpdate?: string): Observable<any> {
    const body = userUpdate ? { userUpdate } : {};
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { body });
  }

  restoreEmployee(id: number, userUpdate?: string): Observable<any> {
    const body = userUpdate ? { userUpdate } : {};
    return this.http.put<any>(`${this.apiUrl}/${id}/restore`, body);
  }
}
