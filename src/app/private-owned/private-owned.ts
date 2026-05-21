import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

@Component({
  selector: 'app-private-owned',
  standalone: false,
  templateUrl: './private-owned.html',
  styleUrl: './private-owned.css',
})
export class PrivateOwnedComponent {
  employeeName = 'Employee';
  claimedBy = '';
  departmentOf = '';
  rank = '';
  address = '';
  month = '';
  headquarters = '';
  accountClaimNo = '';
  makeAndModel = '';
  category = '';
  yearOfManufacture = '';
  vehicleType = '';
  registrationNumber = '';
  engineSweptVolumeGroup = '';

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

  goToClaimDetails(): void {
    this.router.navigate(['/claim-details']);
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
