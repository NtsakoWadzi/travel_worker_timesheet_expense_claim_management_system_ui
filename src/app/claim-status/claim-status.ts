import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { Claim } from '../Model/claim.model';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

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
  hasLoadedClaims = false;
  userSubmissionCount = 0;
  private refreshIntervalId?: number;
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
    this.refreshIntervalId = window.setInterval(() => this.loadClaims(false), 2000);
    this.summarySubscription = this.claimsService.claimStatusSummary$.subscribe((summary) => {
      this.claims = summary.claims;
      this.userSubmissionCount = summary.submittedCount;
      this.hasLoadedClaims = summary.hasLoaded;
      this.isLoading = false;
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
    if (this.refreshIntervalId) {
      window.clearInterval(this.refreshIntervalId);
    }
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

    this.isLoading = showLoading;
    this.errorMessage = '';

    const userId = Number(user.userId);

    this.claimsService.refreshClaimStatus(userId).pipe(
      finalize(() => {
        this.isLoading = false;
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
    return [...this.approvedClaims, ...this.rejectedClaims][0];
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

  goToTimesheet(): void {
    this.router.navigate(['/timesheet']);
  }

  goToClaims(): void {
    this.router.navigate(['/claims']);
  }

  goToClaimStatus(): void {
    this.loadClaims();
    this.router.navigate(['/claim-status']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
