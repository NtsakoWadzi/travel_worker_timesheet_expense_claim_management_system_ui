import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { Claim, ClaimCalculationResponse, ClaimImageResponse, ClaimStatusSummary, ReceiptAnalysisResponse, UserClaimCountResponse } from '../Model/claim.model';

@Injectable({
  providedIn: 'root',
})
export class ClaimsService {
  private baseUrl = 'http://localhost:8080';
  private claimStatusSummarySubject = new BehaviorSubject<ClaimStatusSummary>({
    claims: [],
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    hasLoaded: false,
  });
  claimStatusSummary$ = this.claimStatusSummarySubject.asObservable();

  constructor(private http: HttpClient) {}

  submitClaim(claim: Claim): Observable<Claim> {
    const formData = new FormData();
    const claimPayload = {
      userId: claim.userId,
      claimDate: claim.ClaimDate,
      categories: Array.isArray(claim.categories) ? claim.categories.join(', ') : claim.categories,
      status: true,
    };

    formData.append(
      'claim',
      new Blob([JSON.stringify(claimPayload)], { type: 'application/json' })
    );
    formData.append('details', JSON.stringify(claim.claimDetails || []));

    (claim.claimImages as any[]).forEach((fileHandle) => {
      formData.append('files', fileHandle.file, fileHandle.file.name);
    });

    return this.http.post<Claim>(`${this.baseUrl}/claims/save`, formData, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap((savedClaim) => {
        if (savedClaim.userId) {
          this.refreshClaimStatus(savedClaim.userId).subscribe();
        }
      })
    );
  }

  getClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.baseUrl}/claims`, {
      headers: this.getAuthHeaders(),
    });
  }

  getClaimsByUserId(userId: number): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.baseUrl}/claims/user/${userId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserClaimCount(userId: number): Observable<UserClaimCountResponse> {
    return this.http.get<UserClaimCountResponse>(`${this.baseUrl}/claims/user/${userId}/count`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateClaimStatus(claimId: number, status: string): Observable<Claim> {
    return this.http.put<Claim>(
      `${this.baseUrl}/claims/${claimId}/status`,
      { status },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap((updatedClaim) => {
        if (updatedClaim.userId) {
          this.refreshClaimStatus(updatedClaim.userId).subscribe();
        }
      })
    );
  }

  refreshClaimStatus(userId: number): Observable<ClaimStatusSummary> {
    return forkJoin({
      userClaims: this.getClaimsByUserId(userId).pipe(timeout(10000), catchError(() => of([] as Claim[]))),
      allClaims: this.getClaims().pipe(timeout(10000), catchError(() => of([] as Claim[]))),
      count: this.getUserClaimCount(userId).pipe(timeout(10000), catchError(() => of({ userSubmissionCount: 0 }))),
    }).pipe(
      map(({ userClaims, allClaims, count }) => {
        const fallbackClaims = allClaims.filter((claim) => Number(claim.userId) === Number(userId));
        const claims = this.mergeClaims(userClaims, fallbackClaims);
        const submittedCount = Math.max(
          Number(count.userSubmissionCount || 0),
          claims.length,
          ...claims.map((claim) => Number(claim.userSubmissionCount || 0))
        );

        return {
          claims,
          submittedCount,
          approvedCount: claims.filter((claim) => this.getStatusValue(claim.status) === 'approved').length,
          rejectedCount: claims.filter((claim) => this.getStatusValue(claim.status) === 'rejected').length,
          hasLoaded: true,
        };
      }),
      tap((summary) => this.claimStatusSummarySubject.next(summary))
    );
  }

  clearClaimStatus(): void {
    this.claimStatusSummarySubject.next({
      claims: [],
      submittedCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      hasLoaded: false,
    });
  }

  getClaimImages(claimId: number): Observable<ClaimImageResponse[]> {
    return this.http.get<ClaimImageResponse[]>(`${this.baseUrl}/claims/${claimId}/images`, {
      headers: this.getAuthHeaders(),
    });
  }

  getClaimImageBlob(imageUrl: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${imageUrl}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
    });
  }

  calculateClaimTotal(claimId: number): Observable<ClaimCalculationResponse> {
    return this.http.get<ClaimCalculationResponse>(`${this.baseUrl}/claims/${claimId}/calculate`, {
      headers: this.getAuthHeaders(),
    });
  }

  analyzeReceipt(file: File, category: string): Observable<ReceiptAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('category', category);

    return this.http.post<ReceiptAnalysisResponse>(`${this.baseUrl}/claims/vision/analyze-receipt`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private mergeClaims(primaryClaims: Claim[], fallbackClaims: Claim[]): Claim[] {
    const claimsById = new Map<number, Claim>();

    [...fallbackClaims, ...primaryClaims].forEach((claim) => {
      if (claim.claimId) {
        claimsById.set(claim.claimId, claim);
      }
    });

    return Array.from(claimsById.values()).sort((a, b) => {
      const firstDate = new Date(a.claimDate || a.ClaimDate || 0).getTime();
      const secondDate = new Date(b.claimDate || b.ClaimDate || 0).getTime();
      return secondDate - firstDate;
    });
  }

  private getStatusValue(status: boolean | string | undefined): string {
    if (status === true || !status) {
      return 'submitted';
    }

    return String(status).trim().toLowerCase();
  }
}
