import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FileHandle } from '../Model/file-handle.model';
import { Claim } from '../Model/claim.model';
import { ClaimsService } from '../services/claims-service';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { BankDetailsService } from '../services/bank-details-service';

@Component({
  selector: 'app-claims',
  standalone: false,
  templateUrl: './claims.html',
  styleUrl: './claims.css',
})

export class Claims implements OnDestroy {
  @Input() embedded = false;
  @Output() stepRequested = new EventEmitter<'timesheet' | 'claims' | 'bank-details' | 'status'>();

  typesOfClaims: string[] = ['Meals', 'Toll Fees', 'Other', 'Distance Travelled'];
  employeeName = 'Employee';
  errorMessage = '';
  isSubmitting = false;
  successMessage = '';
  isConfirmationDialogOpen = false;
  submittedClaimReference = '';
  activeDetailCategory = '';
  isDetailDialogOpen = false;
  mealTypeErrorMessage = '';
  hasShownEngineSizeHint = false;
  mealTypes: string[] = ['Breakfast', 'Lunch', 'Supper'];
  selectedCategories: string[] = [];
  detailForm = {
    receiptTime: '',
    amount: undefined as number | undefined,
    kilometers: undefined as number | undefined,
    vehicleType: '',
    engineSizeCc: undefined as number | undefined,
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
    private bankDetailsService: BankDetailsService,
    private router: Router
  ) {
    const user = this.authService.getUser();
    this.employeeName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Employee';

    const draft = this.claimsService.getClaimDraft();
    if (draft) {
      this.singleclaim = draft;
      this.selectedCategories = Array.isArray(draft.categories) ? [...draft.categories] : this.toCategoryArray(draft.categories);
    }
  }

  ngOnDestroy(): void {
    this.saveDraft();
  }

  fileDropped(fileHandle: FileHandle): void {
    this.singleclaim.claimImages.push(fileHandle);
    this.saveDraft();
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
    this.saveDraft();
  }

  removeImages(i: number): void {
    this.singleclaim.claimImages.splice(i, 1);
    this.saveDraft();
  }

  onCategoriesChanged(): void {
    this.singleclaim.categories = [...this.selectedCategories];
    this.saveDraft();
  }

  submitClaim(selectedCategories: string[]): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateClaimBeforeSubmit(selectedCategories, true)) {
      return;
    }

    const bankDetails = this.bankDetailsService.getBankDetails();
    const user = this.authService.getUser();
    this.singleclaim.userId = user?.userId;
    this.singleclaim.categories = selectedCategories;
    this.singleclaim.bankDetails = bankDetails;
    this.isSubmitting = true;

    this.claimsService.submitClaim(this.singleclaim).subscribe({
      next: (claim) => {
        this.isSubmitting = false;
        this.claimsService.clearClaimDraft();
        this.claimsService.clearTimesheetDraft();
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
        this.selectedCategories = [];
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

  continueToBankDetails(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateClaimBeforeSubmit(this.selectedCategories, false)) {
      return;
    }

    const user = this.authService.getUser();
    this.singleclaim.userId = user?.userId;
    this.singleclaim.categories = [...this.selectedCategories];
    this.saveDraft();
    this.goToBankDetails();
  }

  private validateClaimBeforeSubmit(selectedCategories: string[], requireBankDetails: boolean): boolean {
    if (selectedCategories.length === 0) {
      this.errorMessage = 'Please select at least one claim category.';
      return false;
    }

    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Please log in before submitting a claim.';
      return false;
    }

    const missingCategory = selectedCategories.find((category) => !this.hasClaimDetail(category));
    if (missingCategory) {
      this.openDetailDialog(missingCategory);
      return false;
    }

    if (requireBankDetails) {
      const bankDetails = this.bankDetailsService.getBankDetails();
      if (!bankDetails?.bankName || !bankDetails.accountNumber || !bankDetails.accountType) {
        this.errorMessage = 'Please capture bank details before submitting a claim.';
        return false;
      }
    }

    return true;
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
      vehicleType: existingDetail?.vehicleType || '',
      engineSizeCc: existingDetail?.engineSizeCc,
      description: existingDetail?.description || '',
      receiptFileName: existingDetail?.receiptFileName || '',
      detailType: existingDetail?.detailType || '',
    };
    this.mealTypeErrorMessage = '';
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
      vehicleType: this.detailForm.vehicleType,
      engineSizeCc: this.detailForm.engineSizeCc,
      description: this.detailForm.description,
      receiptFileName: this.detailForm.receiptFileName,
      detailType: this.detailForm.detailType,
    };

    this.singleclaim.claimDetails = [
      ...this.singleclaim.claimDetails.filter((item) => item.category !== this.activeDetailCategory),
      detail,
    ];
    this.isDetailDialogOpen = false;
    this.saveDraft();
  }

  onDetailReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    input.value = '';
    this.attachReceipt(file);
  }

  hasClaimDetail(category: string): boolean {
    const detail = this.singleclaim.claimDetails?.find((item) => item.category === category);
    if (!detail) {
      return false;
    }

    if (category === 'Distance Travelled') {
      return !!detail.kilometers
        && detail.kilometers > 0
        && !!detail.vehicleType
        && !!detail.engineSizeCc
        && detail.engineSizeCc > 0;
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

  private attachReceipt(file: File): void {
    const fileHandle: FileHandle = {
      file,
      url: this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(file)),
    };
    this.singleclaim.claimImages.push(fileHandle);
    this.detailForm.receiptFileName = file.name;
    this.saveDraft();
  }

  onMealTypeChanged(): void {
    this.validateMealTypeAgainstTime();
  }

  onReceiptTimeChanged(): void {
    this.validateMealTypeAgainstTime();
  }

  showEngineSizeHint(): void {
    if (this.hasShownEngineSizeHint) {
      return;
    }

    this.hasShownEngineSizeHint = true;
    window.alert([
      'Engine size guide:',
      '1000cc = 1.0 litre',
      '1400cc = 1.4 litre',
      '1600cc = 1.6 litre',
      '2000cc = 2.0 litre',
      '2500cc = 2.5 litre',
      '3000cc = 3.0 litre',
    ].join('\n'));
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
    this.saveDraft();
    if (this.embedded) {
      this.stepRequested.emit('timesheet');
      return;
    }
    this.router.navigate(['/timesheet']);
  }

  goToClaims(): void {
    this.saveDraft();
    if (this.embedded) {
      this.stepRequested.emit('claims');
      return;
    }
    this.router.navigate(['/claims']);
  }

  goToBankDetails(): void {
    this.saveDraft();
    if (this.embedded) {
      this.stepRequested.emit('bank-details');
      return;
    }
    this.router.navigate(['/bank-details']);
  }

  goToClaimStatus(): void {
    this.saveDraft();
    if (this.embedded) {
      this.stepRequested.emit('status');
      return;
    }
    this.router.navigate(['/claim-status']);
  }

  logout(): void {
    this.claimsService.clearClaimDraft();
    this.claimsService.clearTimesheetDraft();
    this.claimsService.clearClaimStatus();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private saveDraft(): void {
    this.singleclaim.categories = [...this.selectedCategories];
    this.claimsService.saveClaimDraft(this.singleclaim);
  }

  private toCategoryArray(categories: string[] | string | undefined): string[] {
    if (!categories) {
      return [];
    }

    if (Array.isArray(categories)) {
      return categories;
    }

    return categories.split(',').map((category) => category.trim()).filter(Boolean);
  }
}
