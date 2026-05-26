import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';

export interface FinanceDashboard {
  totalClaims: number;
  awaitingFinanceReview: number;
  paymentApprovals: number;
  financeApproved: number;
  paidClaims: number;
  paidThisMonth: number;
}

export interface FinanceClaim {
  claimId: number;
  userId: number;
  claimReference: string;
  claimDate: string;
  categories: string;
  status: string;
  total_amount: number;
  userName?: string;
}

export interface FinancePayment {
  paymentId: number;
  claimId: number;
  paymentDate: string;
  reference: string;
  status: boolean;
  processedBy: string;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  private baseUrl = `${API_BASE_URL}/finance`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<FinanceDashboard> {
    return this.http.get<FinanceDashboard>(`${this.baseUrl}/dashboard`, { headers: this.getAuthHeaders() });
  }

  getQueue(): Observable<FinanceClaim[]> {
    return this.http.get<FinanceClaim[]>(`${this.baseUrl}/claims/queue`, { headers: this.getAuthHeaders() });
  }

  getApprovedClaims(): Observable<FinanceClaim[]> {
    return this.http.get<FinanceClaim[]>(`${this.baseUrl}/claims/approved`, { headers: this.getAuthHeaders() });
  }

  getPaidClaims(): Observable<FinanceClaim[]> {
    return this.http.get<FinanceClaim[]>(`${this.baseUrl}/claims/paid`, { headers: this.getAuthHeaders() });
  }

  getPayments(): Observable<FinancePayment[]> {
    return this.http.get<FinancePayment[]>(`${this.baseUrl}/payments`, { headers: this.getAuthHeaders() });
  }

  approveClaim(claimId: number): Observable<FinanceClaim> {
    return this.http.post<FinanceClaim>(`${this.baseUrl}/claims/${claimId}/approve`, null, { headers: this.getAuthHeaders() });
  }

  payClaim(claimId: number): Observable<FinancePayment> {
    return this.http.post<FinancePayment>(`${this.baseUrl}/claims/${claimId}/pay`, null, { headers: this.getAuthHeaders() });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
