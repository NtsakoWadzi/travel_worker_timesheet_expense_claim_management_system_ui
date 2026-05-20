import { Component, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

type ClaimDetailsStep = 'timesheet' | 'claims' | 'bank-details' | 'status';

@Component({
  selector: 'app-claim-details',
  standalone: false,
  templateUrl: './claim-details.html',
  styleUrl: './claim-details.css',
})
export class ClaimDetailsComponent {
  @ViewChild('claimStepper') claimStepper?: MatStepper;

  employeeName = 'Employee';

  constructor(
    private router: Router,
    private authService: AuthService,
    private claimsService: ClaimsService
  ) {
    const user = this.authService.getUser();
    this.employeeName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Employee';
  }

  selectStep(step: ClaimDetailsStep): void {
    if (step === 'status') {
      this.router.navigate(['/claim-status']);
      return;
    }

    const stepIndex: Record<Exclude<ClaimDetailsStep, 'status'>, number> = {
      timesheet: 0,
      claims: 1,
      'bank-details': 2,
    };

    if (this.claimStepper) {
      this.claimStepper.selectedIndex = stepIndex[step];
    }
  }

  goToClaimStatus(): void {
    this.router.navigate(['/claim-status']);
  }

  logout(): void {
    this.claimsService.clearClaimDraft();
    this.claimsService.clearTimesheetDraft();
    this.claimsService.clearClaimStatus();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
