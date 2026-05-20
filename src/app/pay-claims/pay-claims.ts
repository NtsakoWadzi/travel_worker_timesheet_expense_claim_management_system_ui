import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ClaimCalculationResponse, ClaimDetail } from '../Model/claim.model';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

@Component({
  selector: 'app-pay-claims',
  standalone: false,
  templateUrl: './pay-claims.html',
  styleUrl: './pay-claims.css',
})
export class PayClaimsComponent implements OnInit {
  calculation?: ClaimCalculationResponse;
  calculationDetails: ClaimDetail[] = [];
  errorMessage = '';
  paymentMessage = '';
  isLoading = false;
  isPaying = false;
  managerName = 'Manager';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private claimsService: ClaimsService
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

    const claimId = Number(this.route.snapshot.paramMap.get('claimId'));
    if (!claimId) {
      this.errorMessage = 'No claim was selected for payment.';
      return;
    }

    this.loadClaimCalculation(claimId);
  }

  loadClaimCalculation(claimId: number): void {
    const pendingPayment = this.claimsService.getPendingClaimPayment(claimId);
    if (pendingPayment?.calculation) {
      const fallbackClaim = pendingPayment.claim;
      this.calculationDetails = pendingPayment.calculation.details || fallbackClaim?.claimDetails || [];
      this.calculation = {
        ...pendingPayment.calculation,
        claimReference: pendingPayment.calculation.claimReference || fallbackClaim?.claimReference,
        claimDate: pendingPayment.calculation.claimDate || fallbackClaim?.claimDate || fallbackClaim?.ClaimDate,
        bankDetails: pendingPayment.calculation.bankDetails || fallbackClaim?.bankDetails,
        details: this.calculationDetails,
        totalAmount: this.getCalculationTotal(this.calculationDetails) || pendingPayment.calculation.totalAmount,
      };
    }

    this.isLoading = !this.calculation;
    this.errorMessage = '';

    this.claimsService.calculateClaimTotal(claimId).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (calculation) => {
        this.calculationDetails = calculation.details?.length ? calculation.details : this.calculationDetails;
        this.calculation = {
          ...this.calculation,
          ...calculation,
          claimReference: calculation.claimReference || this.calculation?.claimReference,
          claimDate: calculation.claimDate || this.calculation?.claimDate,
          bankDetails: calculation.bankDetails || this.calculation?.bankDetails,
          details: this.calculationDetails,
          totalAmount: this.getCalculationTotal(this.calculationDetails) || calculation.totalAmount || this.calculation?.totalAmount || 0,
        };
      },
      error: (error) => {
        if (!this.calculation) {
          this.errorMessage = 'Claim payment details could not be loaded.';
        }
        console.error(error);
      },
    });
  }

  payClaim(): void {
    if (!this.calculation?.claimId) {
      return;
    }

    this.isPaying = true;
    this.paymentMessage = '';
    this.claimsService.payClaim(this.calculation.claimId, this.managerName).pipe(
      finalize(() => {
        this.isPaying = false;
      })
    ).subscribe({
      next: (payment) => {
        this.paymentMessage = `Payment processed. Reference: ${payment.reference || '-'}`;
      },
      error: (error) => {
        this.paymentMessage = 'Payment could not be processed.';
        console.error(error);
      },
    });
  }

  getCalculationTotal(details: ClaimDetail[] = this.calculationDetails): number {
    return details.reduce((total, detail) => total + this.getDetailIncludedAmount(detail), 0);
  }

  getDetailIncludedAmount(detail: ClaimDetail): number {
    if (detail.category === 'Distance Travelled') {
      const kilometers = Number(detail.kilometers || 0);
      const rate = this.getDistanceRatePerKm(detail);
      return kilometers > 0 && rate > 0 ? kilometers * rate : 0;
    }

    return Number(detail.amount || detail.reimbursableAmount || 0);
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

  formatCurrency(value: number | undefined): string {
    return `R ${(value || 0).toFixed(2)}`;
  }

  formatDate(value: Date | string | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  goToApprovals(): void {
    this.router.navigate(['/approve-claims']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
