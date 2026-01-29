import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Role {
  id?: number;
  nameRole: string;
  salaryBase: number;
  bonusRole?: number;
  bonusHours?: number;
  bonusDeliveries?: number;
  is_admin?: boolean;
  statusRole?: boolean;
  userCreation?: string;
  dateCreation?: string;
  userUpdate?: string;
  dateUpdate?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = environment.api + '/roles';

  constructor(private http: HttpClient) { }

  getRoles(statusRole?: boolean, paginate: boolean = true): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (statusRole !== undefined) {
      params = params.set('statusRole', statusRole.toString());
    }
    if (!paginate) {
      params = params.set('paginate', 'false');
    }
    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getRole(id: number): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.apiUrl}/${id}`);
  }

  createRole(role: Role): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.apiUrl, role);
  }

  updateRole(id: number, role: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: number, userUpdate?: string): Observable<ApiResponse<Role>> {
    return this.http.delete<ApiResponse<Role>>(`${this.apiUrl}/${id}`, {
      body: { userUpdate }
    });
  }

  restoreRole(id: number, userUpdate?: string): Observable<ApiResponse<Role>> {
    return this.http.patch<ApiResponse<Role>>(`${this.apiUrl}/${id}/restore`, {
      userUpdate
    });
  }
}
