import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';

export interface JwtRequest {
  userName: string;
  userPassword: string;
}

export interface JwtResponse {
  jwtToken: string;
  user: {
    userId: number;
    userName: string;
    userEmail: string;
    userFirstName: string;
    userLastName: string;
    role: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  login(userName: string, userPassword: string): Observable<JwtResponse> {
    const request: JwtRequest = { userName, userPassword };
    return this.http.post<JwtResponse>(`${this.baseUrl}/authenticate`,request);
  }

  saveToken(token: string): void {
    localStorage.setItem('jwtToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  saveUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
  }


  // auth.service.ts (add these methods)

// Check if the current user has a "manager" role
// auth.service.ts
isManager(): boolean {
  return this.hasRole('Manager');
}

isAdmin(): boolean {
  return this.hasRole('Admin');
}

isFinance(): boolean {
  return this.hasRole('Finance');
}

hasRole(roleName: string): boolean {
  const user = this.getUser();
  if (!user || !user.role || !Array.isArray(user.role)) return false;

  const targetRole = this.normalizeRoleName(roleName);
  return user.role.some((role: any) => this.normalizeRoleName(this.getRoleName(role)) === targetRole);
}

getPrimaryRole(): string {
  const user = this.getUser();
  if (!user || !user.role || user.role.length === 0) return '';
  // Adjust based on your role structure
  return user.role[0]?.authority || user.role[0];
}

private getRoleName(role: any): string {
  if (typeof role === 'string') return role;
  return role?.roleName || role?.authority || role?.name || '';
}

private normalizeRoleName(roleName: string): string {
  return String(roleName || '').replace(/^ROLE_/i, '').trim().toLowerCase();
}
}
