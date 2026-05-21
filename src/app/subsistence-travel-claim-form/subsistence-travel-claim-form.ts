import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-subsistence-travel-claim-form',
  standalone: false,
  templateUrl: './subsistence-travel-claim-form.html',
  styleUrl: './subsistence-travel-claim-form.css',
})
export class SubsistenceTravelClaimFormComponent {
  managerName = 'Manager';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getUser();
    this.managerName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Manager';
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
