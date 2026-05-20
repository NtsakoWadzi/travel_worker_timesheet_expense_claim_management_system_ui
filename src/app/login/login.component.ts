import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})

export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private claimsService: ClaimsService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loginForm = new FormGroup({
      userName: new FormControl('', Validators.required),
      userPassword: new FormControl('', Validators.required),
    });
  }

 onSubmit() {
  if (this.loginForm.invalid) return;
  this.isLoading = true;
  this.errorMessage = '';

  const { userName, userPassword } = this.loginForm.value;

  this.authService.login(userName, userPassword).subscribe({
    next: (response) => {
      console.log('Full response:', response); // Debug: see entire response
      console.log('User object:', response.user);
      console.log('Role array:', response.user.role);

      this.authService.saveToken(response.jwtToken);
      this.authService.saveUser(response.user);

      // Check isManager after saving
      console.log('Is manager?', this.authService.isManager());

      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin-dashboard']);
        this.isLoading = false;
      } else if (this.authService.isManager()) {
        console.log('Navigating to approve-claims');
        this.router.navigate(['/approve-claims']);
        this.isLoading = false;
      } else {
        console.log('Navigating to claim details');
        this.claimsService.startClaimStatusAutoRefresh(response.user.userId);
        this.claimsService.refreshClaimStatus(response.user.userId).subscribe({
          next: () => {
            this.router.navigate(['/claim-details']);
            this.isLoading = false;
          },
          error: () => {
            this.router.navigate(['/claim-details']);
            this.isLoading = false;
          },
        });
      }
    },
    error: (err) => {
      this.isLoading = false;
      this.errorMessage = 'Invalid username or password';
      console.error(err);
    },
  });
}
}
