import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Claim, ClaimCalculationResponse } from '../Model/claim.model';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

interface ClaimImagePreview {
  fileName: string;
  contentType?: string;
  url: string;
  isImage: boolean;
}

@Component({
  selector: 'app-approve-claims',
  standalone: false,
  templateUrl: './approve-claims.html',
  styleUrl: './approve-claims.css',
})
export class ApproveClaims implements OnInit {
  claims: Claim[] = [];
  errorMessage = '';
  isLoading = false;
  managerName = 'Manager';
  imageDialogTitle = '';
  imageDialogMessage = '';
  imagePreviews: ClaimImagePreview[] = [];
  isImageDialogOpen = false;
  isLoadingImages = false;
  isCalculationDialogOpen = false;
  isCalculating = false;
  calculation?: ClaimCalculationResponse;

  constructor(
    private claimsService: ClaimsService,
    private authService: AuthService,
    private router: Router
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

    this.loadClaims();
  }

  loadClaims(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.claimsService.getClaims().pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (claims) => {
        this.claims = claims || [];
      },
      error: (error) => {
        this.errorMessage = 'Claims could not be loaded. Please check that the manager is logged in and the backend claims endpoint is available.';
        console.error(error);
      },
    });
  }

  updateStatus(claim: Claim, status: string): void {
    if (!claim.claimId) {
      this.errorMessage = 'This claim does not have a claim id.';
      return;
    }

    const previousStatus = claim.status;
    claim.status = status;
    this.errorMessage = '';

    this.claimsService.updateClaimStatus(claim.claimId, status).subscribe({
      next: (updatedClaim) => {
        claim.status = updatedClaim.status || status;
      },
      error: (error) => {
        claim.status = previousStatus;
        this.errorMessage = 'Claim status could not be updated.';
        console.error(error);
      },
    });
  }

  viewImages(claim: Claim): void {
    if (!claim.claimId) {
      window.alert('No claim id is available for this claim.');
      return;
    }

    this.closeImageDialog();
    this.isLoadingImages = true;
    this.imageDialogTitle = `Claim ${claim.claimReference || claim.claimId} documents`;
    this.imageDialogMessage = '';
    this.isImageDialogOpen = true;

    this.claimsService.getClaimImages(claim.claimId).subscribe({
      next: (images) => {
        if (!images.length) {
          this.isLoadingImages = false;
          this.imageDialogMessage = 'No supporting images are attached to this claim.';
          return;
        }

        forkJoin(
          images.map((image) => this.claimsService.getClaimImageBlob(image.imageUrl))
        ).subscribe({
          next: (blobs) => {
            this.imagePreviews = images.map((image, index) => ({
              fileName: image.fileName,
              contentType: image.contentType,
              url: URL.createObjectURL(blobs[index]),
              isImage: !!image.contentType?.startsWith('image/'),
            }));
            this.isLoadingImages = false;
          },
          error: (error) => {
            this.isLoadingImages = false;
            this.imageDialogMessage = 'Claim images could not be loaded.';
            console.error(error);
          },
        });
      },
      error: (error) => {
        this.isLoadingImages = false;
        this.isImageDialogOpen = false;
        this.errorMessage = 'Claim images could not be loaded.';
        console.error(error);
      },
    });
  }

  formatDate(value: Date | string | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  closeImageDialog(): void {
    this.imagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    this.imagePreviews = [];
    this.imageDialogMessage = '';
    this.isImageDialogOpen = false;
    this.isLoadingImages = false;
  }

  calculateClaim(claim: Claim): void {
    if (!claim.claimId) {
      this.errorMessage = 'This claim does not have a claim id.';
      return;
    }

    this.isCalculating = true;
    this.isCalculationDialogOpen = true;
    this.calculation = undefined;
    this.claimsService.calculateClaimTotal(claim.claimId).pipe(
      finalize(() => {
        this.isCalculating = false;
      })
    ).subscribe({
      next: (calculation) => {
        this.calculation = calculation;
        claim.total_amount = calculation.totalAmount;
      },
      error: (error) => {
        this.isCalculationDialogOpen = false;
        this.errorMessage = 'Claim details could not be calculated.';
        console.error(error);
      },
    });
  }

  closeCalculationDialog(): void {
    this.isCalculationDialogOpen = false;
    this.calculation = undefined;
  }

  formatCurrency(value: number | undefined): string {
    return `R ${(value || 0).toFixed(2)}`;
  }

  goToApprovals(): void {
    this.router.navigate(['/approve-claims']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
