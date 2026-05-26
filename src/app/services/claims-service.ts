import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { Claim, ClaimCalculationResponse, ClaimImageResponse, ClaimStatusSummary, ClaimTimesheet, PaymentResponse, UserClaimCountResponse } from '../Model/claim.model';
import { API_BASE_URL } from './api-config';

export interface SubsistenceTravelClaimFormDraft {
  claimNumber: string;
  capturedBy: string;
  dateCaptured: string;
  advanceTaken: string;
  amount: string;
}

export interface PrivateMotorDraft {
  claimedBy: string;
  departmentOf: string;
  rank: string;
  address: string;
  month: string;
  headquarters: string;
  accountClaimNo: string;
  makeAndModel: string;
  category: string;
  yearOfManufacture: string;
  vehicleType: string;
  registrationNumber: string;
  engineSweptVolumeGroup: string;
}

export interface PrivateMotorJourneyDraft {
  date: string;
  reason: string;
  homeToDestinationKm?: number;
  officeToDestinationKm?: number;
  claimableKm?: number;
  departureFrom: string;
  departureTime: string;
  arrivalAt: string;
  arrivalTime: string;
  speedometerStart?: number;
  speedometerEnd?: number;
  totalTraveled?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClaimsService {
  private baseUrl = API_BASE_URL;
  private readonly pendingReviewStorageKey = 'pendingClaimReviews';
  private readonly pendingPaymentStorageKey = 'pendingClaimPayment';
  private readonly subsistenceTravelClaimFormDraftKey = 'subsistenceTravelClaimFormDraft';
  private readonly localSubmittedClaimsStorageKey = 'localSubmittedClaims';
  private readonly privateMotorDraftKey = 'privateMotorDraft';
  private readonly privateMotorJourneyDraftKey = 'privateMotorJourneyDraft';
  private claimDraft?: Claim;
  private timesheetDraft: ClaimTimesheet[] = [];
  private statusRefreshIntervalId?: number;
  private statusRefreshUserId?: number;
  private claimStatusSummarySubject = new BehaviorSubject<ClaimStatusSummary>({
    claims: [],
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    hasLoaded: false,
  });
  claimStatusSummary$ = this.claimStatusSummarySubject.asObservable();

  constructor(private http: HttpClient) {}

  saveClaimDraft(claim: Claim): void {
    this.claimDraft = {
      ...claim,
      categories: Array.isArray(claim.categories) ? [...claim.categories] : claim.categories,
      claimImages: [...(claim.claimImages || [])],
      claimDetails: [...(claim.claimDetails || [])],
      timesheetDetails: [...(claim.timesheetDetails || this.timesheetDraft || [])],
    };
  }

  getClaimDraft(): Claim | undefined {
    if (!this.claimDraft) {
      return undefined;
    }

    return {
      ...this.claimDraft,
      categories: Array.isArray(this.claimDraft.categories) ? [...this.claimDraft.categories] : this.claimDraft.categories,
      claimImages: [...(this.claimDraft.claimImages || [])],
      claimDetails: [...(this.claimDraft.claimDetails || [])],
      timesheetDetails: [...(this.claimDraft.timesheetDetails || this.timesheetDraft || [])],
    };
  }

  clearClaimDraft(): void {
    this.claimDraft = undefined;
  }

  saveTimesheetDraft(timesheets: ClaimTimesheet[]): void {
    this.timesheetDraft = [...timesheets];
    if (this.claimDraft) {
      this.claimDraft = {
        ...this.claimDraft,
        timesheetDetails: [...timesheets],
      };
    }
  }

  getTimesheetDraft(): ClaimTimesheet[] {
    return [...this.timesheetDraft];
  }

  clearTimesheetDraft(): void {
    this.timesheetDraft = [];
    if (this.claimDraft) {
      this.claimDraft = {
        ...this.claimDraft,
        timesheetDetails: [],
      };
    }
  }

  saveSubsistenceTravelClaimFormDraft(draft: SubsistenceTravelClaimFormDraft): void {
    localStorage.setItem(this.subsistenceTravelClaimFormDraftKey, JSON.stringify(draft));
  }

  getSubsistenceTravelClaimFormDraft(): SubsistenceTravelClaimFormDraft | undefined {
    const value = localStorage.getItem(this.subsistenceTravelClaimFormDraftKey);
    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value) as SubsistenceTravelClaimFormDraft;
    } catch {
      return undefined;
    }
  }

  savePrivateMotorDraft(draft: PrivateMotorDraft): void {
    localStorage.setItem(this.privateMotorDraftKey, JSON.stringify(draft));
  }

  getPrivateMotorDraft(): PrivateMotorDraft | undefined {
    return this.getStoredValue<PrivateMotorDraft>(this.privateMotorDraftKey);
  }

  savePrivateMotorJourneyDraft(draft: PrivateMotorJourneyDraft[]): void {
    localStorage.setItem(this.privateMotorJourneyDraftKey, JSON.stringify(draft));
  }

  getPrivateMotorJourneyDraft(): PrivateMotorJourneyDraft[] {
    return this.getStoredValue<PrivateMotorJourneyDraft[]>(this.privateMotorJourneyDraftKey) || [];
  }

  clearPrivateMotorDrafts(): void {
    localStorage.removeItem(this.privateMotorDraftKey);
    localStorage.removeItem(this.privateMotorJourneyDraftKey);
  }

  saveLocalSubmittedClaim(claim: Claim): Claim {
    const claims = this.getLocalSubmittedClaims().filter((item) => !this.isSameClaim(item, claim));
    const savedClaim: Claim = {
      ...claim,
      localSubmitted: true,
      status: claim.status || 'Submitted',
      claimDate: claim.claimDate || claim.ClaimDate || new Date().toISOString(),
      ClaimDate: claim.ClaimDate || new Date(),
      categories: Array.isArray(claim.categories) ? [...claim.categories] : claim.categories,
      claimImages: [],
      claimDetails: [...(claim.claimDetails || [])],
      timesheetDetails: [...(claim.timesheetDetails || [])],
    };

    claims.unshift(savedClaim);
    localStorage.setItem(this.localSubmittedClaimsStorageKey, JSON.stringify(claims.slice(0, 100)));
    return savedClaim;
  }

  getLocalSubmittedClaims(): Claim[] {
    const value = localStorage.getItem(this.localSubmittedClaimsStorageKey);
    if (!value) {
      return [];
    }

    try {
      return JSON.parse(value) as Claim[];
    } catch {
      return [];
    }
  }

  getManagerClaims(): Observable<Claim[]> {
    const localClaims = this.getLocalManagerClaims();

    return this.getClaims().pipe(
      map((backendClaims) => this.sortClaimsBySubmittedDate(this.mergeManagerClaims(backendClaims || [], localClaims))),
      catchError(() => of(this.sortClaimsBySubmittedDate(localClaims)))
    );
  }

  updateLocalSubmittedClaimStatus(claim: Claim, status: string, managerMessage = ''): Claim {
    const updatedClaim: Claim = {
      ...claim,
      status,
      managerMessage,
    };
    const claims = this.getLocalSubmittedClaims().map((item) => (
      this.isSameClaim(item, updatedClaim) ? updatedClaim : item
    ));
    localStorage.setItem(this.localSubmittedClaimsStorageKey, JSON.stringify(claims));
    return updatedClaim;
  }

  submitClaim(claim: Claim): Observable<Claim> {
    const formData = new FormData();
    const claimPayload = {
      userId: claim.userId,
      claimDate: claim.ClaimDate,
      categories: Array.isArray(claim.categories) ? claim.categories.join(', ') : claim.categories,
      status: true,
      claimDescription: claim.claimDescription,
      departureDate: claim.departureDate,
      arrivalDateTime: claim.arrivalDateTime,
      dateNumberOfDays: claim.dateNumberOfDays,
      departureTime: claim.departureTime,
      arrivalTime: claim.arrivalTime,
      timeNumberOfDays: claim.timeNumberOfDays,
      numberOfHours: claim.numberOfHours,
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
        this.savePendingClaimReview(savedClaim, claim);
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

  updateClaimStatus(claimId: number, status: string, managerMessage = ''): Observable<Claim> {
    return this.http.put<Claim>(
      `${this.baseUrl}/claims/${claimId}/status`,
      { status, managerMessage, statusReason: managerMessage, decisionReason: managerMessage },
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

  startClaimStatusAutoRefresh(userId: number): void {
    if (this.statusRefreshIntervalId && this.statusRefreshUserId === userId) {
      return;
    }

    this.stopClaimStatusAutoRefresh();
    this.statusRefreshUserId = userId;
    this.refreshClaimStatus(userId).subscribe();
    this.statusRefreshIntervalId = window.setInterval(() => {
      this.refreshClaimStatus(userId).subscribe();
    }, 2000);
  }

  stopClaimStatusAutoRefresh(): void {
    if (this.statusRefreshIntervalId) {
      window.clearInterval(this.statusRefreshIntervalId);
    }
    this.statusRefreshIntervalId = undefined;
    this.statusRefreshUserId = undefined;
  }

  clearClaimStatus(): void {
    this.stopClaimStatusAutoRefresh();
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

  payClaim(claimId: number, processedBy: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.baseUrl}/claims/${claimId}/pay`,
      { processedBy },
      { headers: this.getAuthHeaders() }
    );
  }

  getPendingClaimReview(claim: Claim): Partial<Claim> | undefined {
    const reviews = this.getPendingClaimReviews();
    return reviews.find((review) => this.isSameClaim(review, claim));
  }

  clearPendingClaimReview(claim: Claim): void {
    const reviews = this.getPendingClaimReviews().filter((review) => !this.isSameClaim(review, claim));
    localStorage.setItem(this.pendingReviewStorageKey, JSON.stringify(reviews));
  }

  savePendingClaimPayment(calculation: ClaimCalculationResponse, claim?: Claim): void {
    localStorage.setItem(this.pendingPaymentStorageKey, JSON.stringify({ calculation, claim }));
  }

  getPendingClaimPayment(claimId: number): { calculation: ClaimCalculationResponse; claim?: Claim } | undefined {
    const value = localStorage.getItem(this.pendingPaymentStorageKey);
    if (!value) {
      return undefined;
    }

    try {
      const payment = JSON.parse(value) as { calculation: ClaimCalculationResponse; claim?: Claim };
      return Number(payment.calculation?.claimId || payment.claim?.claimId) === Number(claimId) ? payment : undefined;
    } catch {
      return undefined;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private getStoredValue<T>(key: string): T | undefined {
    const value = localStorage.getItem(key);
    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  private savePendingClaimReview(savedClaim: Claim, submittedClaim: Claim): void {
    const review: Partial<Claim> = {
      ...savedClaim,
      claimId: savedClaim.claimId,
      claimReference: savedClaim.claimReference,
      userId: savedClaim.userId || submittedClaim.userId,
      userName: savedClaim.userName || submittedClaim.userName,
      categories: savedClaim.categories || submittedClaim.categories,
      claimDescription: submittedClaim.claimDescription,
      departureDate: submittedClaim.departureDate,
      arrivalDateTime: submittedClaim.arrivalDateTime,
      dateNumberOfDays: submittedClaim.dateNumberOfDays,
      departureTime: submittedClaim.departureTime,
      arrivalTime: submittedClaim.arrivalTime,
      timeNumberOfDays: submittedClaim.timeNumberOfDays,
      numberOfHours: submittedClaim.numberOfHours,
      claimDetails: submittedClaim.claimDetails || [],
      timesheetDetails: submittedClaim.timesheetDetails || this.timesheetDraft || [],
      bankDetails: submittedClaim.bankDetails,
    };

    const reviews = this.getPendingClaimReviews().filter((item) => !this.isSameClaim(item, review));
    reviews.unshift(review);
    localStorage.setItem(this.pendingReviewStorageKey, JSON.stringify(reviews.slice(0, 50)));
  }

  private getPendingClaimReviews(): Partial<Claim>[] {
    const value = localStorage.getItem(this.pendingReviewStorageKey);
    if (!value) {
      return [];
    }

    try {
      return JSON.parse(value) as Partial<Claim>[];
    } catch {
      return [];
    }
  }

  private getLocalManagerClaims(): Claim[] {
    const submittedClaims = this.getLocalSubmittedClaims();
    const pendingReviews = this.getPendingClaimReviews().map((claim) => ({
      ClaimDate: claim.ClaimDate || new Date(),
      claimDate: claim.claimDate || claim.ClaimDate || new Date().toISOString(),
      categories: claim.categories || [],
      claimImages: [],
      status: claim.status || 'Submitted',
      localSubmitted: true,
      ...claim,
    } as Claim));

    return this.sortClaimsBySubmittedDate(this.mergeManagerClaims(submittedClaims, pendingReviews));
  }

  private mergeManagerClaims(backendClaims: Claim[], localClaims: Claim[]): Claim[] {
    const claimsByKey = new Map<string, Claim>();

    [...backendClaims, ...localClaims].forEach((claim) => {
      claimsByKey.set(this.getClaimMergeKey(claim), claim);
    });

    return Array.from(claimsByKey.values());
  }

  private getClaimMergeKey(claim: Partial<Claim>): string {
    if (claim.claimId) {
      return `id:${claim.claimId}`;
    }

    if (claim.claimReference) {
      return `ref:${claim.claimReference}`;
    }

    return `date:${claim.claimDate || claim.ClaimDate || ''}:user:${claim.userId || claim.userName || ''}`;
  }

  private sortClaimsBySubmittedDate(claims: Claim[]): Claim[] {
    return [...claims].sort((first, second) => {
      const firstDate = new Date(first.claimDate || first.ClaimDate || 0).getTime();
      const secondDate = new Date(second.claimDate || second.ClaimDate || 0).getTime();
      return secondDate - firstDate;
    });
  }

  private isSameClaim(first: Partial<Claim>, second: Partial<Claim>): boolean {
    if (first.claimId && second.claimId) {
      return Number(first.claimId) === Number(second.claimId);
    }

    if (first.claimReference && second.claimReference) {
      return first.claimReference === second.claimReference;
    }

    return false;
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
