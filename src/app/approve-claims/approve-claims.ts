import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { BankDetails, Claim, ClaimCalculationResponse, ClaimDetail, ClaimTimesheet } from '../Model/claim.model';
import { AdminService } from '../services/admin-service';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

interface ClaimImagePreview {
  fileName: string;
  contentType?: string;
  url: string;
  isImage: boolean;
}

@Component({
  selector: 'app-approve-claims',
  standalone: false,
  templateUrl: './approve-claims.html',
  styleUrl: './approve-claims.css',
})
export class ApproveClaims implements OnInit {
  claims: Claim[] = [];
  errorMessage = '';
  isLoading = false;
  managerName = 'Manager';
  imageDialogTitle = '';
  imageDialogMessage = '';
  imagePreviews: ClaimImagePreview[] = [];
  isReviewDialogOpen = false;
  isLoadingImages = false;
  isLoadingReview = false;
  isCalculationDialogOpen = false;
  isCalculating = false;
  isPaying = false;
  paymentMessage = '';
  calculation?: ClaimCalculationResponse;
  calculationDetails: ClaimDetail[] = [];
  calculationClaim?: Claim;
  selectedClaim?: Claim;
  reviewTimesheets: ClaimTimesheet[] = [];
  reviewBankDetails?: BankDetails;
  managerDecisionMessage = '';
  isUpdatingStatus = false;

  constructor(
    private claimsService: ClaimsService,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getUser();
    this.managerName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Manager';
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadClaims();
  }

  loadClaims(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.claimsService.getManagerClaims().pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (claims) => {
        this.claims = this.sortClaimsBySubmittedDate(claims || []);
        if (this.claims.length === 0) {
          this.errorMessage = '';
        }
      },
      error: (error) => {
        this.errorMessage = 'Claims could not be loaded. Please check that the manager is logged in and the backend claims endpoint is available.';
        console.error(error);
      },
    });
  }

  updateStatus(claim: Claim, status: string, managerMessage = ''): void {
    if (claim.localSubmitted) {
      const updatedClaim = this.claimsService.updateLocalSubmittedClaimStatus(
        claim,
        status,
        managerMessage || this.getDefaultDecisionMessage(status)
      );
      Object.assign(claim, updatedClaim);
      return;
    }

    if (!claim.claimId) {
      this.errorMessage = 'This claim does not have a claim id.';
      return;
    }

    const previousStatus = claim.status;
    claim.status = status;
    claim.managerMessage = managerMessage || this.getDefaultDecisionMessage(status);
    this.errorMessage = '';

    this.claimsService.updateClaimStatus(claim.claimId, status, claim.managerMessage).subscribe({
      next: (updatedClaim) => {
        claim.status = updatedClaim.status || status;
        claim.managerMessage = updatedClaim.managerMessage || claim.managerMessage;
      },
      error: (error) => {
        claim.status = previousStatus;
        this.errorMessage = 'Claim status could not be updated.';
        console.error(error);
      },
    });
  }

  viewClaim(claim: Claim): void {
    if (claim.localSubmitted) {
      this.closeReviewDialog();
      this.selectedClaim = claim;
      this.reviewTimesheets = claim.timesheetDetails || [];
      this.reviewBankDetails = claim.bankDetails;
      this.imagePreviews = [];
      this.imageDialogTitle = `Claim ${claim.claimReference || claim.claimId} review`;
      this.imageDialogMessage = 'No supporting images are attached to this claim.';
      this.managerDecisionMessage = '';
      this.isLoadingImages = false;
      this.isLoadingReview = false;
      this.isReviewDialogOpen = true;
      return;
    }

    if (!claim.claimId) {
      window.alert('No claim id is available for this claim.');
      return;
    }

    this.closeReviewDialog();
    this.selectedClaim = claim;
    this.isLoadingImages = true;
    this.isLoadingReview = true;
    this.imageDialogTitle = `Claim ${claim.claimReference || claim.claimId} review`;
    this.imageDialogMessage = '';
    this.managerDecisionMessage = '';
    this.isReviewDialogOpen = true;
    const pendingReview = this.claimsService.getPendingClaimReview(claim);
    const reviewClaim = {
      ...claim,
      claimDetails: claim.claimDetails?.length ? claim.claimDetails : pendingReview?.claimDetails,
      timesheetDetails: claim.timesheetDetails?.length ? claim.timesheetDetails : pendingReview?.timesheetDetails,
      bankDetails: claim.bankDetails || pendingReview?.bankDetails,
    };
    this.selectedClaim = reviewClaim;

    forkJoin({
      images: this.claimsService.getClaimImages(claim.claimId).pipe(catchError(() => of([]))),
      timesheets: this.adminService.getTimesheets().pipe(catchError(() => of([]))),
      bankDetails: this.adminService.getBankDetails().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ images, timesheets, bankDetails }) => {
        this.reviewTimesheets = (reviewClaim.timesheetDetails?.length ? reviewClaim.timesheetDetails : timesheets || [])
          .filter((timesheet) => Number(timesheet.userId) === Number(claim.userId));
        this.reviewBankDetails = reviewClaim.bankDetails || (bankDetails || []).find((bank) => {
          if (bank.claimId && claim.claimId) {
            return Number(bank.claimId) === Number(claim.claimId);
          }

          return Number(bank.userId) === Number(claim.userId);
        });

        if (!images.length) {
          this.isLoadingImages = false;
          this.isLoadingReview = false;
          this.imageDialogMessage = 'No supporting images are attached to this claim.';
          return;
        }

        forkJoin(
          images.map((image) => this.claimsService.getClaimImageBlob(image.imageUrl))
        ).subscribe({
          next: (blobs) => {
            this.imagePreviews = images.map((image, index) => ({
              fileName: image.fileName,
              contentType: image.contentType,
              url: URL.createObjectURL(blobs[index]),
              isImage: !!image.contentType?.startsWith('image/'),
            }));
            this.isLoadingImages = false;
            this.isLoadingReview = false;
          },
          error: (error) => {
            this.isLoadingImages = false;
            this.isLoadingReview = false;
            this.imageDialogMessage = 'Claim images could not be loaded.';
            console.error(error);
          },
        });
      },
      error: (error) => {
        this.isLoadingImages = false;
        this.isLoadingReview = false;
        this.isReviewDialogOpen = false;
        this.errorMessage = 'Claim review details could not be loaded.';
        console.error(error);
      },
    });
  }

  formatDate(value: Date | string | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  closeReviewDialog(): void {
    this.imagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    this.imagePreviews = [];
    this.imageDialogMessage = '';
    this.isReviewDialogOpen = false;
    this.isLoadingImages = false;
    this.isLoadingReview = false;
    this.isUpdatingStatus = false;
    this.selectedClaim = undefined;
    this.reviewTimesheets = [];
    this.reviewBankDetails = undefined;
    this.managerDecisionMessage = '';
  }

  calculateClaim(claim: Claim): void {
    if (claim.localSubmitted) {
      this.isCalculationDialogOpen = true;
      this.isCalculating = false;
      this.calculationClaim = claim;
      this.calculationDetails = claim.claimDetails || [];
      this.calculation = {
        claimId: Number(claim.claimId || 0),
        claimReference: claim.claimReference,
        claimDate: claim.claimDate || claim.ClaimDate,
        totalAmount: this.getCalculationTotal(this.calculationDetails),
        details: this.calculationDetails,
        bankDetails: claim.bankDetails,
      };
      this.paymentMessage = '';
      claim.total_amount = this.calculation.totalAmount;
      return;
    }

    if (!claim.claimId) {
      this.errorMessage = 'This claim does not have a claim id.';
      return;
    }

    this.isCalculating = true;
    this.isCalculationDialogOpen = true;
    this.calculation = undefined;
    this.calculationClaim = claim;
    this.managerDecisionMessage = '';
    this.claimsService.calculateClaimTotal(claim.claimId).pipe(
      finalize(() => {
        this.isCalculating = false;
      })
    ).subscribe({
      next: (calculation) => {
        this.calculationDetails = this.mergeCalculationDetails(calculation.details || [], claim.claimDetails || []);
        this.calculation = {
          ...calculation,
          details: this.calculationDetails,
          totalAmount: this.getCalculationTotal(this.calculationDetails),
        };
        this.paymentMessage = '';
        claim.total_amount = this.calculation.totalAmount;
      },
      error: (error) => {
        this.isCalculationDialogOpen = false;
        this.errorMessage = 'Claim details could not be calculated.';
        console.error(error);
      },
    });
  }

  closeCalculationDialog(): void {
    this.isCalculationDialogOpen = false;
    this.calculation = undefined;
    this.calculationClaim = undefined;
    this.calculationDetails = [];
    this.paymentMessage = '';
    this.isPaying = false;
  }

  approveCalculatedClaim(): void {
    if (!this.calculationClaim) {
      return;
    }

    if (this.calculation) {
      this.claimsService.savePendingClaimPayment(this.calculation, this.calculationClaim);
    }
    this.selectedClaim = this.calculationClaim;
    this.approveSelectedClaim();
  }

  rejectCalculatedClaim(): void {
    if (!this.calculationClaim) {
      return;
    }

    this.selectedClaim = this.calculationClaim;
    this.rejectSelectedClaim();
    this.closeCalculationDialog();
  }

  approveSelectedClaim(): void {
    if (!this.selectedClaim?.claimId) {
      return;
    }

    const claim = this.selectedClaim;
    const claimId = Number(claim.claimId);
    const message = this.managerDecisionMessage.trim() || this.getDefaultDecisionMessage('Approved');

    if (claim.localSubmitted) {
      const updatedClaim = this.claimsService.updateLocalSubmittedClaimStatus(claim, 'Approved', message);
      Object.assign(claim, updatedClaim);
      this.closeReviewDialog();
      return;
    }

    this.isUpdatingStatus = true;
    this.claimsService.updateClaimStatus(claimId, 'Approved', message).pipe(
      finalize(() => {
        this.isUpdatingStatus = false;
      })
    ).subscribe({
      next: (updatedClaim) => {
        claim.status = updatedClaim.status || 'Approved';
        claim.managerMessage = updatedClaim.managerMessage || message;
        this.claimsService.clearPendingClaimReview(claim);
        this.closeReviewDialog();
        this.router.navigate(['/pay-claims', claimId]);
      },
      error: (error) => {
        this.errorMessage = 'Claim could not be approved.';
        console.error(error);
      },
    });
  }

  rejectSelectedClaim(): void {
    if (!this.selectedClaim?.claimId) {
      return;
    }

    const claim = this.selectedClaim;
    const claimId = Number(claim.claimId);
    const message = this.managerDecisionMessage.trim() || this.getDefaultDecisionMessage('Rejected');

    if (claim.localSubmitted) {
      const updatedClaim = this.claimsService.updateLocalSubmittedClaimStatus(claim, 'Rejected', message);
      Object.assign(claim, updatedClaim);
      this.closeReviewDialog();
      return;
    }

    this.isUpdatingStatus = true;

    this.claimsService.updateClaimStatus(claimId, 'Rejected', message).pipe(
      finalize(() => {
        this.isUpdatingStatus = false;
      })
    ).subscribe({
      next: (updatedClaim) => {
        claim.status = updatedClaim.status || 'Rejected';
        claim.managerMessage = updatedClaim.managerMessage || message;
        this.claimsService.clearPendingClaimReview(claim);
        this.closeReviewDialog();
      },
      error: (error) => {
        this.errorMessage = 'Claim could not be rejected.';
        console.error(error);
      },
    });
  }

  getCategoryLabel(categories: Claim['categories']): string {
    return Array.isArray(categories) ? categories.join(', ') : categories || '-';
  }

  getTimesheetTotalHours(timesheet: ClaimTimesheet): string {
    return `${Number(timesheet.total_hours || 0).toFixed(2)} h`;
  }

  getTimesheetTrackKey(timesheet: ClaimTimesheet): string {
    return String(timesheet.timesheetId || `${timesheet.workDate}-${timesheet.startTime}-${timesheet.location}`);
  }

  formatCurrency(value: number | undefined): string {
    return `R ${(value || 0).toFixed(2)}`;
  }

  getClaimTrackKey(claim: Claim): string {
    return String(claim.claimId || claim.claimReference || claim.claimDate || claim.ClaimDate);
  }

  getCalculationTotal(details: ClaimDetail[] = this.calculationDetails): number {
    return details.reduce((total, detail) => total + this.getDetailIncludedAmount(detail), 0);
  }

  getDetailIncludedAmount(detail: ClaimDetail): number {
    if (detail.category === 'Distance Travelled') {
      return this.getDistanceAmount(detail);
    }

    if (this.isAmountCategory(detail.category)) {
      return Number(detail.amount || detail.reimbursableAmount || 0);
    }

    return Number(detail.reimbursableAmount || detail.amount || 0);
  }

  getDistanceAmount(detail: ClaimDetail): number {
    const kilometers = Number(detail.kilometers || 0);
    const rate = this.getDistanceRatePerKm(detail);
    return kilometers > 0 && rate > 0 ? kilometers * rate : 0;
  }

  getDistanceRatePerKm(detail: ClaimDetail): number {
    const engineSize = Number(detail.engineSizeCc || 0);
    const vehicleType = String(detail.vehicleType || '').toLowerCase();

    if (!engineSize || !vehicleType) {
      return 0;
    }

    const petrolRates = [
      { max: 1250, rate: 3.172 },
      { max: 1550, rate: 3.992 },
      { max: 1750, rate: 4.337 },
      { max: 1950, rate: 4.999 },
      { max: 2150, rate: 5.359 },
      { max: 2500, rate: 6.068 },
      { max: 3500, rate: 7.576 },
      { max: Infinity, rate: 8.952 },
    ];

    const dieselRates = [
      { max: 1250, rate: 3.197 },
      { max: 1550, rate: 3.828 },
      { max: 1750, rate: 4.248 },
      { max: 1950, rate: 4.448 },
      { max: 2150, rate: 5.196 },
      { max: 2500, rate: 5.942 },
      { max: Infinity, rate: 7.375 },
    ];

    const rates = vehicleType === 'diesel' ? dieselRates : petrolRates;
    return rates.find((item) => engineSize <= item.max)?.rate || 0;
  }

  formatRate(detail: ClaimDetail): string {
    const rate = this.getDistanceRatePerKm(detail);
    return rate ? `R ${rate.toFixed(2)}/km` : '-';
  }

  private isAmountCategory(category: string): boolean {
    return ['Meals', 'Toll Fees', 'Other'].includes(category);
  }

  private getDefaultDecisionMessage(status: string): string {
    return status.toLowerCase() === 'approved'
      ? 'Accepted by the manager because the claim passed review and the supporting details were accepted.'
      : 'Rejected by the manager because the claim requires correction or the supporting details were not accepted.';
  }

  private mergeCalculationDetails(primary: ClaimDetail[], fallback: ClaimDetail[]): ClaimDetail[] {
    if (!fallback.length) {
      return primary;
    }

    const merged = [...primary];
    fallback.forEach((detail) => {
      const hasDetail = merged.some((item) => {
        if (detail.claimDetailId && item.claimDetailId) {
          return detail.claimDetailId === item.claimDetailId;
        }

        return item.category === detail.category && item.detailType === detail.detailType;
      });

      if (!hasDetail) {
        merged.push(detail);
      }
    });

    return merged;
  }

  private sortClaimsBySubmittedDate(claims: Claim[]): Claim[] {
    return [...claims].sort((first, second) => {
      const firstDate = new Date(first.claimDate || first.ClaimDate || 0).getTime();
      const secondDate = new Date(second.claimDate || second.ClaimDate || 0).getTime();
      return secondDate - firstDate;
    });
  }

  goToApprovals(): void {
    this.router.navigate(['/approve-claims']);
  }

  goToSubsistenceTravelForm(): void {
    this.router.navigate(['/subsistence-travel-claim-form']);
  }

  goToAuthorisation(): void {
    this.router.navigate(['/authorisation']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
