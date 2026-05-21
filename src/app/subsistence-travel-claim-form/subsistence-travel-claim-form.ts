import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

@Component({
  selector: 'app-subsistence-travel-claim-form',
  standalone: false,
  templateUrl: './subsistence-travel-claim-form.html',
  styleUrl: './subsistence-travel-claim-form.css',
})
export class SubsistenceTravelClaimFormComponent {
  managerName = 'Manager';
  nationalDepartment = 'Public Works';
  claimNumber = '';
  capturedBy = '';
  dateCaptured = '';
  advanceTaken = '00.00';
  amount = '00.00';
  authorisedBy = '';
  dateAuthorised = '';

  constructor(
    private authService: AuthService,
    private claimsService: ClaimsService,
    private router: Router
  ) {
    const user = this.authService.getUser();
    this.managerName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Manager';

    const claimFormDraft = this.claimsService.getSubsistenceTravelClaimFormDraft();
    if (claimFormDraft) {
      this.claimNumber = claimFormDraft.claimNumber;
      this.capturedBy = claimFormDraft.capturedBy;
      this.dateCaptured = claimFormDraft.dateCaptured;
      this.advanceTaken = claimFormDraft.advanceTaken;
      this.amount = claimFormDraft.amount;
    }
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
