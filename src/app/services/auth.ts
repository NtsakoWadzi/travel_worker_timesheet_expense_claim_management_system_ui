import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  private baseUrl = 'http://localhost:8080';

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
}