import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-authorisation',
  standalone: false,
  templateUrl: './authorisation.html',
  styleUrl: './authorisation.css',
})
export class AuthorisationComponent {
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
