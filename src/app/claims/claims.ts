import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FileHandle } from '../Model/file-handle.model';
import { Claim } from '../Model/claim.model';
import { ClaimsService } from '../services/claims-service';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-claims',
  standalone: false,
  templateUrl: './claims.html',
  styleUrl: './claims.css',
})

export class Claims {
  typesOfClaims: string[] = ['Meals', 'Toll Fees', 'Other', 'Distance Travelled'];
  employeeName = 'Employee';
  errorMessage = '';
  isSubmitting = false;
  successMessage = '';
  isConfirmationDialogOpen = false;
  submittedClaimReference = '';
  activeDetailCategory = '';
  isDetailDialogOpen = false;
  isAnalyzingReceipt = false;
  receiptAnalysisMessage = '';
  mealTypeErrorMessage = '';
  mealTypes: string[] = ['Breakfast', 'Lunch', 'Supper'];
  detailForm = {
    receiptTime: '',
    amount: undefined as number | undefined,
    kilometers: undefined as number | undefined,
    description: '',
    receiptFileName: '',
    detailType: '',
  };
  singleclaim: Claim = {
    ClaimDate: new Date(),
    userId: undefined,
    categories: [],
    claimImages: [],
    claimDetails: [],
  };

  constructor(
    private sanitizer: DomSanitizer,
    private claimsService: ClaimsService,
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getUser();
    this.employeeName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Employee';
  }
  fileDropped(fileHandle: FileHandle): void {
    this.singleclaim.claimImages.push(fileHandle);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const fileHandle: FileHandle = {
      file, url: this.sanitizer.bypassSecurityTrustUrl(
        window.URL.createObjectURL(file)
      ),
    };
    this.singleclaim.claimImages.push(fileHandle);
    input.value = '';
  }

  removeImages(i: number): void {
    this.singleclaim.claimImages.splice(i, 1);
  }

  submitClaim(selectedCategories: string[]): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (selectedCategories.length === 0) {
      this.errorMessage = 'Please select at least one claim category.';
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Please log in before submitting a claim.';
      return;
    }

    const missingCategory = selectedCategories.find((category) => !this.hasClaimDetail(category));
    if (missingCategory) {
      this.openDetailDialog(missingCategory);
      return;
    }

    const user = this.authService.getUser();
    this.singleclaim.userId = user?.userId;
    this.singleclaim.categories = selectedCategories;
    this.isSubmitting = true;

    this.claimsService.submitClaim(this.singleclaim).subscribe({
      next: (claim) => {
        this.isSubmitting = false;
        const claimReference = claim.claimReference || 'Unavailable';
        this.submittedClaimReference = claimReference;
        this.successMessage = `Claim submitted successfully. Reference: ${claimReference}`;
        this.isConfirmationDialogOpen = true;
        this.singleclaim = {
          ClaimDate: new Date(),
          userId: user?.userId,
          categories: [],
          claimImages: [],
          claimDetails: [],
        };
        if (user?.userId) {
          this.claimsService.refreshClaimStatus(user.userId).subscribe();
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Claim could not be submitted. Please try again.';
        console.error(error);
      },
    });
  }

  closeConfirmationDialog(): void {
    this.isConfirmationDialogOpen = false;
  }

  openDetailDialog(category: string): void {
    this.activeDetailCategory = category;
    const existingDetail = this.singleclaim.claimDetails?.find((detail) => detail.category === category);
    this.detailForm = {
      receiptTime: existingDetail?.receiptTime || '',
      amount: existingDetail?.amount,
      kilometers: existingDetail?.kilometers,
      description: existingDetail?.description || '',
      receiptFileName: existingDetail?.receiptFileName || '',
      detailType: existingDetail?.detailType || '',
    };
    this.receiptAnalysisMessage = '';
    this.mealTypeErrorMessage = '';
    this.isAnalyzingReceipt = false;
    this.isDetailDialogOpen = true;
    this.validateMealTypeAgainstTime();
  }

  closeDetailDialog(): void {
    this.isDetailDialogOpen = false;
  }

  saveClaimDetail(): void {
    if (this.activeDetailCategory === 'Meals' && !this.validateMealTypeAgainstTime()) {
      return;
    }

    if (!this.singleclaim.claimDetails) {
      this.singleclaim.claimDetails = [];
    }

    const detail = {
      category: this.activeDetailCategory,
      receiptTime: this.detailForm.receiptTime || undefined,
      amount: this.detailForm.amount,
      kilometers: this.detailForm.kilometers,
      description: this.detailForm.description,
      receiptFileName: this.detailForm.receiptFileName,
      detailType: this.detailForm.detailType,
    };

    this.singleclaim.claimDetails = [
      ...this.singleclaim.claimDetails.filter((item) => item.category !== this.activeDetailCategory),
      detail,
    ];
    this.isDetailDialogOpen = false;
  }

  onDetailReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const fileHandle: FileHandle = {
      file,
      url: this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(file)),
    };
    this.singleclaim.claimImages.push(fileHandle);
    this.detailForm.receiptFileName = file.name;
    input.value = '';
    this.analyzeReceipt(file);
  }

  hasClaimDetail(category: string): boolean {
    const detail = this.singleclaim.claimDetails?.find((item) => item.category === category);
    if (!detail) {
      return false;
    }

    if (category === 'Distance Travelled') {
      return !!detail.kilometers && detail.kilometers > 0;
    }

    if (category === 'Other') {
      return !!detail.description && !!detail.amount && detail.amount > 0;
    }

    if (category === 'Meals') {
      return !!detail.amount
        && detail.amount > 0
        && !!detail.receiptTime
        && !!detail.detailType
        && this.getMealTypeFromTime(detail.receiptTime).toLowerCase() === detail.detailType.toLowerCase();
    }

    return !!detail.amount && detail.amount > 0;
  }

  private analyzeReceipt(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.receiptAnalysisMessage = 'AI Vision can read image receipts only. You can still enter the details manually.';
      return;
    }

    this.isAnalyzingReceipt = true;
    this.receiptAnalysisMessage = 'Reading receipt with AI Vision...';

    this.claimsService.analyzeReceipt(file, this.activeDetailCategory).subscribe({
      next: (analysis) => {
        this.isAnalyzingReceipt = false;

        if (analysis.amount !== undefined && analysis.amount !== null) {
          this.detailForm.amount = analysis.amount;
        }

        if (this.activeDetailCategory === 'Meals' && analysis.receiptTime) {
          this.detailForm.receiptTime = analysis.receiptTime;
        }

        const mealType = analysis.mealType ? ` ${analysis.mealType} detected.` : '';
        this.receiptAnalysisMessage = `${analysis.message || 'Receipt details were extracted.'}${mealType}`;
        this.validateMealTypeAgainstTime();
      },
      error: (error) => {
        this.isAnalyzingReceipt = false;
        this.receiptAnalysisMessage = 'AI Vision could not read this receipt. Please enter the details manually.';
        console.error(error);
      },
    });
  }

  onMealTypeChanged(): void {
    this.validateMealTypeAgainstTime();
  }

  onReceiptTimeChanged(): void {
    this.validateMealTypeAgainstTime();
  }

  isMealTypeInvalid(): boolean {
    return this.activeDetailCategory === 'Meals' && !!this.mealTypeErrorMessage;
  }

  private validateMealTypeAgainstTime(): boolean {
    if (this.activeDetailCategory !== 'Meals') {
      this.mealTypeErrorMessage = '';
      return true;
    }

    if (!this.detailForm.detailType || !this.detailForm.receiptTime) {
      this.mealTypeErrorMessage = '';
      return true;
    }

    const mealTypeFromSlip = this.getMealTypeFromTime(this.detailForm.receiptTime);
    if (!mealTypeFromSlip) {
      this.mealTypeErrorMessage = '';
      return true;
    }

    if (mealTypeFromSlip.toLowerCase() !== this.detailForm.detailType.toLowerCase()) {
      this.mealTypeErrorMessage = `The time on the slip is invalid for ${this.detailForm.detailType}. A slip at ${this.detailForm.receiptTime} is treated as ${mealTypeFromSlip}.`;
      return false;
    }

    this.mealTypeErrorMessage = '';
    return true;
  }

  private getMealTypeFromTime(receiptTime: string): string {
    const [hourText] = receiptTime.split(':');
    const hour = Number(hourText);
    if (Number.isNaN(hour)) {
      return '';
    }

    if (hour < 12) {
      return 'Breakfast';
    }

    if (hour < 16) {
      return 'Lunch';
    }

    return 'Supper';
  }

  goToTimesheet(): void {
    this.router.navigate(['/timesheet']);
  }

  goToClaims(): void {
    this.router.navigate(['/claims']);
  }

  goToClaimStatus(): void {
    this.router.navigate(['/claim-status']);
  }

  logout(): void {
    this.claimsService.clearClaimStatus();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
