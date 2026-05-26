import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService, PrivateMotorDraft } from '../services/claims-service';

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

    const draft = this.claimsService.getPrivateMotorDraft();
    if (draft) {
      Object.assign(this, draft);
    } else {
      this.claimedBy = this.employeeName;
      this.rank = this.claimsService.getClaimDraft()?.rank || '';
    }
  }

  goToClaimDetails(): void {
    this.router.navigate(['/claim-details']);
  }

  goToClaimStatus(): void {
    this.router.navigate(['/claim-status']);
  }

  goToDetailsOfJourney(): void {
    this.savePrivateMotorDraft();
    this.router.navigate(['/details-of-journey']);
  }

  savePrivateMotorDraft(): void {
    this.claimsService.savePrivateMotorDraft(this.getPrivateMotorDraft());
  }

  logout(): void {
    this.claimsService.clearClaimDraft();
    this.claimsService.clearTimesheetDraft();
    this.claimsService.clearClaimStatus();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private getPrivateMotorDraft(): PrivateMotorDraft {
    return {
      claimedBy: this.claimedBy,
      departmentOf: this.departmentOf,
      rank: this.rank,
      address: this.address,
      month: this.month,
      headquarters: this.headquarters,
      accountClaimNo: this.accountClaimNo,
      makeAndModel: this.makeAndModel,
      category: this.category,
      yearOfManufacture: this.yearOfManufacture,
      vehicleType: this.vehicleType,
      registrationNumber: this.registrationNumber,
      engineSweptVolumeGroup: this.engineSweptVolumeGroup,
    };
  }
}
