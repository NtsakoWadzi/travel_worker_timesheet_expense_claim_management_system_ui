import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BankDetails } from '../Model/claim.model';
import { AuthService } from '../services/auth';
import { BankDetailsService } from '../services/bank-details-service';
import { ClaimsService } from '../services/claims-service';

@Component({
  selector: 'app-bank-details',
  standalone: false,
  templateUrl: './bank-details.html',
  styleUrl: './bank-details.css',
})
export class BankDetailsComponent {
  @Input() embedded = false;
  @Output() stepRequested = new EventEmitter<'timesheet' | 'claims' | 'bank-details' | 'status'>();

  employeeName = 'Employee';
  successMessage = '';
  errorMessage = '';
  isSubmittingClaim = false;
  submittedClaimReference = '';
  accountTypes = ['Cheque', 'Savings', 'Transmission'];
  bankDetails: BankDetails = {
    bankName: '',
    accountNumber: '',
    accountType: '',
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private claimsService: ClaimsService,
    private bankDetailsService: BankDetailsService
  ) {
    const user = this.authService.getUser();
    this.employeeName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Employee';
    this.bankDetails = {
      ...this.bankDetails,
      ...(this.bankDetailsService.getBankDetails() || {}),
    };
  }

  saveBankDetails(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.bankDetails.bankName || !this.bankDetails.accountNumber || !this.bankDetails.accountType) {
      this.errorMessage = 'Please complete all bank details before saving.';
      return;
    }

    this.bankDetailsService.saveBankDetails(this.bankDetails);
    this.successMessage = 'Bank details saved for your next claim submission.';
  }

  submitEverythingForApproval(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.submittedClaimReference = '';

    if (!this.bankDetails.bankName || !this.bankDetails.accountNumber || !this.bankDetails.accountType) {
      this.errorMessage = 'Please complete all bank details before submitting.';
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Please log in before submitting your claim.';
      return;
    }

    const claimDraft = this.claimsService.getClaimDraft();
    if (!claimDraft || !claimDraft.categories || this.toCategoryArray(claimDraft.categories).length === 0) {
      this.errorMessage = 'Please complete the claims step before submitting to the manager.';
      return;
    }

    const timesheetDraft = this.claimsService.getTimesheetDraft();
    if (timesheetDraft.length === 0) {
      this.errorMessage = 'Please complete the timesheet step before submitting to the manager.';
      return;
    }

    this.bankDetailsService.saveBankDetails(this.bankDetails);
    const user = this.authService.getUser();
    const claimToSubmit = {
      ...claimDraft,
      userId: user?.userId,
      categories: this.toCategoryArray(claimDraft.categories),
      bankDetails: this.bankDetails,
      timesheetDetails: timesheetDraft,
    };

    this.isSubmittingClaim = true;
    this.claimsService.submitClaim(claimToSubmit).subscribe({
      next: (claim) => {
        this.isSubmittingClaim = false;
        this.claimsService.clearClaimDraft();
        this.claimsService.clearTimesheetDraft();
        this.submittedClaimReference = claim.claimReference || 'Unavailable';
        this.successMessage = `Claim submitted to manager for approval. Reference: ${this.submittedClaimReference}`;
        if (user?.userId) {
          this.claimsService.refreshClaimStatus(user.userId).subscribe();
        }
      },
      error: (error) => {
        this.isSubmittingClaim = false;
        this.errorMessage = 'Claim could not be submitted to the manager. Please try again.';
        console.error(error);
      },
    });
  }

  goToTimesheet(): void {
    if (this.embedded) {
      this.stepRequested.emit('timesheet');
      return;
    }
    this.router.navigate(['/timesheet']);
  }

  goToClaims(): void {
    if (this.embedded) {
      this.stepRequested.emit('claims');
      return;
    }
    this.router.navigate(['/claims']);
  }

  goToBankDetails(): void {
    if (this.embedded) {
      this.stepRequested.emit('bank-details');
      return;
    }
    this.router.navigate(['/bank-details']);
  }

  goToClaimStatus(): void {
    if (this.embedded) {
      this.stepRequested.emit('status');
      return;
    }
    this.router.navigate(['/claim-status']);
  }

  logout(): void {
    this.claimsService.clearClaimDraft();
    this.claimsService.clearTimesheetDraft();
    this.claimsService.clearClaimStatus();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private toCategoryArray(categories: string[] | string | undefined): string[] {
    if (!categories) {
      return [];
    }

    if (Array.isArray(categories)) {
      return categories;
    }

    return categories.split(',').map((category) => category.trim()).filter(Boolean);
  }
}
