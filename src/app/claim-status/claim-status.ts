import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { Claim } from '../Model/claim.model';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

type ClaimStatusFilter = 'all' | 'submitted' | 'approved' | 'rejected';
type DateSortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-claim-status',
  standalone: false,
  templateUrl: './claim-status.html',
  styleUrl: './claim-status.css',
})
export class ClaimStatus implements OnInit, OnDestroy {
  claims: Claim[] = [];
  employeeName = 'Employee';
  errorMessage = '';
  isLoading = true;
  isRefreshing = false;
  hasLoadedClaims = false;
  userSubmissionCount = 0;
  statusFilter: ClaimStatusFilter = 'all';
  dateSortDirection: DateSortDirection = 'desc';
  pageSize = 8;
  pageIndex = 0;
  readonly statusFilterOptions: { label: string; value: ClaimStatusFilter }[] = [
    { label: 'All claims', value: 'all' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];
  readonly pageSizeOptions = [5, 8, 10, 20];
  private routerSubscription?: Subscription;
  private summarySubscription?: Subscription;
  private visibilityChangeHandler = () => {
    if (!document.hidden) {
      this.loadClaims(false);
    }
  };
  private focusHandler = () => this.loadClaims(false);

  constructor(
    private claimsService: ClaimsService,
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getUser();
    this.employeeName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Employee';
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadClaims();
    const userId = Number(this.authService.getUser()?.userId);
    if (userId) {
      this.claimsService.startClaimStatusAutoRefresh(userId);
    }
    this.summarySubscription = this.claimsService.claimStatusSummary$.subscribe((summary) => {
      this.claims = summary.claims;
      this.userSubmissionCount = summary.submittedCount;
      this.hasLoadedClaims = summary.hasLoaded;
      this.isLoading = false;
      this.clampPageIndex();
    });
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event.urlAfterRedirects.startsWith('/claim-status')) {
          this.loadClaims(false);
        }
      });
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    window.addEventListener('focus', this.focusHandler);
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.summarySubscription?.unsubscribe();
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    window.removeEventListener('focus', this.focusHandler);
  }

  loadClaims(showLoading = true): void {
    const user = this.authService.getUser();
    if (!user?.userId) {
      this.errorMessage = 'The logged in user could not be identified.';
      return;
    }

    this.isLoading = showLoading && !this.hasLoadedClaims;
    this.isRefreshing = showLoading;
    this.errorMessage = '';

    const userId = Number(user.userId);

    this.claimsService.refreshClaimStatus(userId).pipe(
      finalize(() => {
        this.isLoading = false;
        this.isRefreshing = false;
      })
    ).subscribe({
      error: (error) => {
        this.errorMessage = 'Claim statuses could not be loaded. Please try again.';
        console.error(error);
      },
    });
  }

  get approvedClaims(): Claim[] {
    return this.claims.filter((claim) => this.getStatusValue(claim.status) === 'approved');
  }

  get rejectedClaims(): Claim[] {
    return this.claims.filter((claim) => this.getStatusValue(claim.status) === 'rejected');
  }

  get pendingClaims(): Claim[] {
    return this.claims.filter((claim) => this.getStatusValue(claim.status) === 'submitted');
  }

  get latestDecision(): Claim | undefined {
    return this.sortClaimsByDate(
      this.claims.filter((claim) => ['approved', 'rejected'].includes(this.getStatusValue(claim.status))),
      'desc'
    )[0];
  }

  get filteredClaims(): Claim[] {
    const claims = this.statusFilter === 'all'
      ? this.claims
      : this.claims.filter((claim) => this.getStatusValue(claim.status) === this.statusFilter);

    return this.sortClaimsByDate(claims, this.dateSortDirection);
  }

  get pagedClaims(): Claim[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredClaims.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredClaims.length / this.pageSize));
  }

  get pageStart(): number {
    return this.filteredClaims.length === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.filteredClaims.length);
  }

  formatDate(value: Date | string | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  getStatusIcon(status: boolean | string | undefined): string {
    const statusValue = this.getStatusValue(status);

    if (statusValue === 'approved') {
      return 'verified';
    }

    if (statusValue === 'rejected') {
      return 'cancel';
    }

    return 'hourglass_top';
  }

  getStatusLabel(status: boolean | string | undefined): string {
    const statusValue = this.getStatusValue(status);

    if (statusValue === 'approved') {
      return 'Approved';
    }

    if (statusValue === 'rejected') {
      return 'Rejected';
    }

    return 'Submitted';
  }

  getCategoriesLabel(categories: Claim['categories']): string {
    return Array.isArray(categories) ? categories.join(', ') : categories || '-';
  }

  getManagerDecisionMessage(claim: Claim): string {
    const explicitMessage = [
      claim.managerMessage,
      claim.decisionReason,
      claim.statusReason,
      claim.managerComment,
      claim.managerRemarks,
      claim.approvalReason,
      claim.rejectionReason,
    ].find((message) => typeof message === 'string' && message.trim().length > 0);

    if (explicitMessage) {
      return explicitMessage.trim();
    }

    if (this.isApproved(claim)) {
      return 'Accepted by the manager because the claim passed review and the supporting details were accepted.';
    }

    if (this.isRejected(claim)) {
      return 'Rejected by the manager because the claim requires correction or the supporting details were not accepted.';
    }

    return 'Awaiting manager review.';
  }

  onStatusFilterChanged(): void {
    this.pageIndex = 0;
  }

  onPageSizeChanged(): void {
    this.pageIndex = 0;
    this.clampPageIndex();
  }

  toggleDateSort(): void {
    this.dateSortDirection = this.dateSortDirection === 'desc' ? 'asc' : 'desc';
    this.pageIndex = 0;
  }

  previousPage(): void {
    this.pageIndex = Math.max(0, this.pageIndex - 1);
  }

  nextPage(): void {
    this.pageIndex = Math.min(this.totalPages - 1, this.pageIndex + 1);
  }

  isApproved(claim: Claim): boolean {
    return this.getStatusValue(claim.status) === 'approved';
  }

  isRejected(claim: Claim): boolean {
    return this.getStatusValue(claim.status) === 'rejected';
  }

  private getStatusValue(status: boolean | string | undefined): string {
    if (status === true) {
      return 'submitted';
    }

    if (!status) {
      return 'submitted';
    }

    return String(status).trim().toLowerCase();
  }

  private sortClaimsByDate(claims: Claim[], direction: DateSortDirection): Claim[] {
    const multiplier = direction === 'desc' ? -1 : 1;

    return [...claims].sort((a, b) => {
      const dateDifference = this.getClaimTimestamp(a) - this.getClaimTimestamp(b);

      if (dateDifference !== 0) {
        return dateDifference * multiplier;
      }

      return Number(a.claimId || 0) > Number(b.claimId || 0) ? -1 : 1;
    });
  }

  private getClaimTimestamp(claim: Claim): number {
    const date = new Date(claim.claimDate || claim.ClaimDate || 0).getTime();
    return Number.isNaN(date) ? 0 : date;
  }

  private clampPageIndex(): void {
    this.pageIndex = Math.min(this.pageIndex, this.totalPages - 1);
  }

  goToClaimDetails(): void {
    this.router.navigate(['/claim-details']);
  }

  goToClaimStatus(): void {
    this.loadClaims();
    this.router.navigate(['/claim-status']);
  }

  logout(): void {
    this.claimsService.clearClaimStatus();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
