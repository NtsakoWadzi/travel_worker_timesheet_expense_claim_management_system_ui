import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Claim } from '../Model/claim.model';
import { API_BASE_URL } from './api-config';

export interface AdminUser {
  userId: number;
  userName: string;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
}

export type ReportType = 'claims';

export interface GeneratedReport {
  reportId: number;
  reportType: 'CLAIMS';
  fileName: string;
  generatedByUserId?: number;
  generatedByUserName?: string;
  generatedAt: string;
  recordCount: number;
  contentType: string;
  fileContentBase64: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = `${API_BASE_URL}/admin`;

  constructor(private http: HttpClient) {}

  getClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.baseUrl}/claims`, { headers: this.getAuthHeaders() });
  }

  createClaim(claim: Claim): Observable<Claim> {
    return this.http.post<Claim>(`${this.baseUrl}/claims`, claim, { headers: this.getAuthHeaders() });
  }

  updateClaim(claimId: number, claim: Claim): Observable<Claim> {
    return this.http.put<Claim>(`${this.baseUrl}/claims/${claimId}`, claim, { headers: this.getAuthHeaders() });
  }

  deleteClaim(claimId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/claims/${claimId}`, { headers: this.getAuthHeaders() });
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/users`, { headers: this.getAuthHeaders() });
  }

  getReports(): Observable<GeneratedReport[]> {
    return this.http.get<GeneratedReport[]>(`${this.baseUrl}/reports`, { headers: this.getAuthHeaders() });
  }

  getReport(reportId: number): Observable<GeneratedReport> {
    return this.http.get<GeneratedReport>(`${this.baseUrl}/reports/${reportId}`, { headers: this.getAuthHeaders() });
  }

  generateReport(reportType: ReportType): Observable<GeneratedReport> {
    return this.http.post<GeneratedReport>(`${this.baseUrl}/reports/${reportType}`, null, { headers: this.getAuthHeaders() });
  }

  updateReport(reportId: number, report: GeneratedReport): Observable<GeneratedReport> {
    return this.http.put<GeneratedReport>(`${this.baseUrl}/reports/${reportId}`, report, { headers: this.getAuthHeaders() });
  }

  deleteReport(reportId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reports/${reportId}`, { headers: this.getAuthHeaders() });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
