import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

interface JourneyRow {
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

@Component({
  selector: 'app-details-of-journey',
  standalone: false,
  templateUrl: './details-of-journey.html',
  styleUrl: './details-of-journey.css',
})
export class DetailsOfJourneyComponent {
  employeeName = 'Employee';
  journeyRows: JourneyRow[] = [this.createJourneyRow()];

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

  addJourneyRow(): void {
    this.journeyRows = [...this.journeyRows, this.createJourneyRow()];
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

  private createJourneyRow(): JourneyRow {
    return {
      date: '',
      reason: '',
      departureFrom: '',
      departureTime: '',
      arrivalAt: '',
      arrivalTime: '',
    };
  }
}
