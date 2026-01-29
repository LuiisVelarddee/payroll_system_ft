import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id?: number;
  employeeNumber: string;
  password?: string;
  attempts?: number;
  isBlock?: boolean;
  changePass?: boolean;
  is_admin?: boolean;
  userCreation?: string;
  dateCreation?: string;
  userUpdate?: string;
  dateUpdate?: string;
  statusUser?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.api + '/users';

  constructor(private http: HttpClient) { }

  getUsers(statusUser?: boolean, paginate: boolean = false): Observable<any> {
    let params = new HttpParams();
    
    if (statusUser !== undefined) {
      params = params.set('statusUser', statusUser.toString());
    }
    
    if (!paginate) {
      params = params.set('paginate', 'false');
    }
    
    return this.http.get<any>(this.apiUrl, { params });
  }

  getUser(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createUser(user: User): Observable<any> {
    return this.http.post<any>(this.apiUrl, user);
  }

  updateUser(id: number, user: User): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number, userUpdate?: string): Observable<any> {
    const body = userUpdate ? { userUpdate } : {};
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { body });
  }

  restoreUser(id: number, userUpdate?: string): Observable<any> {
    const body = userUpdate ? { userUpdate } : {};
    return this.http.put<any>(`${this.apiUrl}/${id}/restore`, body);
  }

  toggleBlock(id: number, userUpdate?: string): Observable<any> {
    const body = userUpdate ? { userUpdate } : {};
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle-block`, body);
  }

  changePassword(id: number, newPassword: string, userUpdate?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/change-password`, {
      newPassword,
      userUpdate
    });
  }

  resetAttempts(id: number, userUpdate?: string): Observable<any> {
    const body = userUpdate ? { userUpdate } : {};
    return this.http.put<any>(`${this.apiUrl}/${id}/reset-attempts`, body);
  }
}
