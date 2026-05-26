import { Component, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';
import { Claim } from '../Model/claim.model';

type ClaimDetailsStep = 'timesheet' | 'claims' | 'bank-details' | 'status';

interface AllocationRow {
  selected: boolean;
  persalCode: string;
  description: string;
  sarsCode: string;
  amount?: number;
}

interface AllocationOption {
  persalCode: string;
  description: string;
  sarsCode: string;
}

interface UploadedDocument {
  category: string;
  file: File;
  fileName: string;
  url: string;
  isImage: boolean;
}

@Component({
  selector: 'app-claim-details',
  standalone: false,
  templateUrl: './claim-details.html',
  styleUrl: './claim-details.css',
})
export class ClaimDetailsComponent {
  @ViewChild('claimStepper') claimStepper?: MatStepper;

  employeeName = 'Employee';
  personalParticulars = {
    persalNumber: '',
    initials: '',
    surname: '',
    department: '',
    directorate: '',
    region: '',
    supervisor: '',
    costCentre: '',
  };
  claimDraft: Claim = {
    ClaimDate: new Date(),
    categories: [],
    claimImages: [],
    claimDetails: [],
  };
  lessAdvanceST?: number;
  lessAdvanceSelected = false;
  persalTransaction = '';
  claimValidationMessage = '';
  allocationValidationMessage = '';
  allocationSuccessMessage = '';
  selectedAllocationDescriptionTitle = '';
  selectedAllocationDescriptionText = '';
  isAllocationDescriptionDialogOpen = false;
  selectedRank = '';
  receiptUploads: UploadedDocument[] = [];
  signatureFile?: UploadedDocument;
  signatureDateTime = '';
  isSubmittingClaim = false;
  submissionSuccessMessage = '';
  ranks = [
    'SMS (Senior Management Service) official',
    'Structured MMS official (Middle Management Service)',
    'Non-structured MMS official',
    'Other officials',
  ];
  allocationOptions: AllocationOption[] = [
    { persalCode: '0436', description: 'T&S Allowance Not Exceeding Amount Set By SARS', sarsCode: '3705' },
    { persalCode: '0717', description: 'T&S Allowance Exceeding Amount Set By SARS', sarsCode: '3704' },
    { persalCode: '0462', description: 'T&S Dom: Accommodation', sarsCode: 'N/A' },
    { persalCode: '0463', description: 'T&S Dom: Other Transport Provided (Gautrain)', sarsCode: 'N/A' },
    { persalCode: '0497', description: 'T&S Dom: Road Transport', sarsCode: 'N/A' },
    { persalCode: '0498', description: 'T&S Dom: Parking', sarsCode: 'N/A' },
    { persalCode: '0499', description: 'T&S Toll Fees', sarsCode: 'N/A' },
    { persalCode: '0469', description: 'T&S Dom: Km All Own Transport', sarsCode: '3702' },
    { persalCode: '0470', description: 'T&S Dom: Km All Own Transport', sarsCode: '3703' },
    { persalCode: '0515', description: 'T&S Dom: Fuel Expenditure', sarsCode: 'N/A' },
    { persalCode: '0494', description: 'T&S Dom: Actual Exp Accommodation & Meals', sarsCode: 'N/A' },
    { persalCode: '0588', description: 'T&S Dom: Food & Beverage', sarsCode: 'N/A' },
    { persalCode: '0674', description: 'T&S Dom: Air Travel', sarsCode: 'N/A' },
    { persalCode: '0514', description: 'T&S Travel Documents Visas & Passports', sarsCode: 'N/A' },
    { persalCode: '0476', description: 'T&S Foreign: Accommodation', sarsCode: 'N/A' },
    { persalCode: '0477', description: 'T&S Foreign: Road Transport', sarsCode: 'N/A' },
    { persalCode: '0473', description: 'T&S Overseas Not Exceeding Amount Set By SARS', sarsCode: '3716' },
    { persalCode: '0444', description: 'T&S Overseas Exceeding Amount Set By SARS', sarsCode: '3715' },
    { persalCode: '0500', description: 'T&S Airtime and Data Mobile', sarsCode: 'N/A' },
    { persalCode: '0501', description: 'T&S Foreign: Accommodation & Meals', sarsCode: 'N/A' },
    { persalCode: '0589', description: 'T&S Foreign: Food & Beverage', sarsCode: 'N/A' },
    { persalCode: '0464', description: 'T&S Foreign: Parking Expenditure', sarsCode: 'N/A' },
    { persalCode: '0465', description: 'T&S Foreign: Toll Fees', sarsCode: 'N/A' },
    { persalCode: '0504', description: 'T&S Foreign: Railway Transport', sarsCode: 'N/A' },
    { persalCode: '0650', description: 'T&S Foreign: Incidental Cost', sarsCode: 'N/A' },
  ];
  allocationRows: AllocationRow[] = [this.createAllocationRow()];

  constructor(
    private router: Router,
    private authService: AuthService,
    private claimsService: ClaimsService
  ) {
    const user = this.authService.getUser();
    this.employeeName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Employee';

    this.claimDraft = this.claimsService.getClaimDraft() || this.claimDraft;
    this.selectedRank = (this.claimDraft as any).rank || '';
  }

  selectStep(step: ClaimDetailsStep): void {
    if (step === 'status') {
      this.router.navigate(['/claim-status']);
      return;
    }

    const stepIndex: Record<Exclude<ClaimDetailsStep, 'status'>, number> = {
      timesheet: 0,
      claims: 1,
      'bank-details': 2,
    };

    if (this.claimStepper) {
      this.claimStepper.selectedIndex = stepIndex[step];
    }
  }

  goToClaimStatus(): void {
    this.router.navigate(['/claim-status']);
  }

  continueToClaimStep(): void {
    if (!this.validatePersonalParticulars()) {
      return;
    }

    this.selectStep('claims');
  }

  validatePersonalParticulars(): boolean {
    const missingFields: string[] = [];

    if (!this.selectedRank) missingFields.push('rank');
    if (!this.personalParticulars.persalNumber.trim()) missingFields.push('PERSAL number');
    if (!this.personalParticulars.initials.trim()) missingFields.push('initials');
    if (!this.personalParticulars.surname.trim()) missingFields.push('surname');
    if (!this.personalParticulars.department.trim()) missingFields.push('department');

    this.claimValidationMessage = missingFields.length
      ? `Please complete ${missingFields.join(', ')}.`
      : '';

    return missingFields.length === 0;
  }

  continueToAllocationStep(): void {
    if (!this.validateClaimStep()) {
      return;
    }

    this.selectStep('bank-details');
  }

  continueToReceiptsStep(): void {
    if (!this.validateAllocationStep()) {
      return;
    }

    if (this.claimStepper) {
      this.claimStepper.selectedIndex = 3;
    }
  }

  continueToSignatureStep(): void {
    if (this.claimStepper) {
      this.signatureDateTime = this.signatureDateTime || new Date().toLocaleString();
      this.claimStepper.selectedIndex = 4;
    }
  }

  getAllocationSubTotal(): number {
    return this.allocationRows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
  }

  getAllocationTotal(): number {
    return this.getAllocationSubTotal() - (Number(this.lessAdvanceST) || 0);
  }

  onAllocationCodeChanged(row: AllocationRow): void {
    const option = this.allocationOptions.find((item) => item.persalCode === row.persalCode);
    if (!option) {
      return;
    }

    row.description = option.description;
    row.sarsCode = option.sarsCode;
    this.openAllocationDescription(option);
  }

  addAllocationRow(): void {
    const currentRow = this.allocationRows[this.allocationRows.length - 1];
    if (
      !currentRow?.selected
      || !currentRow.persalCode
      || !currentRow.description
      || !currentRow.sarsCode
      || !this.hasPositiveNumber(currentRow.amount)
    ) {
      this.allocationValidationMessage = 'Please tick the current row, select a description, and enter an amount greater than 0 before adding another row.';
      return;
    }

    this.allocationValidationMessage = '';
    this.allocationRows = [...this.allocationRows, this.createAllocationRow()];
  }

  closeAllocationDescriptionDialog(): void {
    this.isAllocationDescriptionDialogOpen = false;
  }

  private openAllocationDescription(option: AllocationOption): void {
    this.selectedAllocationDescriptionTitle = option.description;
    this.selectedAllocationDescriptionText = this.getAllocationDescription(option);
    this.isAllocationDescriptionDialogOpen = true;
  }

  private getAllocationDescription(option: AllocationOption): string {
    const descriptions: Record<string, string> = {
      '0436': 'Use this when the travel and subsistence allowance is within the SARS-approved limit.',
      '0717': 'Use this when the travel and subsistence allowance is above the SARS-approved limit.',
      '0462': 'Use this when other transport, such as Gautrain, was used during local official travel.',
      '0463': 'Use this when other transport, such as Gautrain, was used during local official travel.',
      '0497': 'Use this for road transport costs during local official travel.',
      '0498': 'Use this for parking fees paid during local official travel.',
      '0499': 'Use this for toll gate fees paid during official travel.',
      '0469': 'Use this for claiming kilometers travelled using your own vehicle for local official travel.',
      '0470': 'Use this for additional own-vehicle kilometer allowance where applicable.',
      '0515': 'Use this for fuel costs related to local official travel.',
      '0494': 'Use this when claiming actual accommodation and meal expenses for local travel.',
      '0588': 'Use this for food and beverage expenses during local official travel.',
      '0674': 'Use this for local air travel costs.',
      '0514': 'Use this for travel document costs such as visas and passports.',
      '0476': 'Use this for accommodation costs during foreign official travel.',
      '0477': 'Use this for road transport costs during foreign official travel.',
      '0473': 'Use this when overseas travel allowance is within the SARS-approved limit.',
      '0444': 'Use this when overseas travel allowance is above the SARS-approved limit.',
      '0500': 'Use this for airtime or mobile data costs related to official travel.',
      '0501': 'Use this for foreign accommodation and meal expenses.',
      '0589': 'Use this for food and beverage expenses during foreign official travel.',
      '0464': 'Use this for parking expenses during foreign official travel.',
      '0465': 'Use this for toll fees during foreign official travel.',
      '0504': 'Use this for railway transport costs during foreign official travel.',
      '0650': 'Use this for small extra costs during foreign official travel.',
    };

    return descriptions[option.persalCode] || 'No description is available for this allocation.';
  }

  validateClaimStep(): boolean {
    this.updateNumberOfDays();
    this.updateNumberOfHours();

    const missingFields: string[] = [];

    if (!this.claimDraft.claimDescription?.trim()) {
      missingFields.push('claim description');
    }

    if (!this.claimDraft.departureDate) {
      missingFields.push('departure date');
    }

    if (!this.claimDraft.arrivalDateTime) {
      missingFields.push('arrival date');
    }

    if (!this.hasPositiveNumber(this.claimDraft.dateNumberOfDays)) {
      missingFields.push('number of days');
    }

    if (!this.claimDraft.departureTime) {
      missingFields.push('departure time');
    }

    if (!this.claimDraft.arrivalTime) {
      missingFields.push('arrival time');
    }

    if (!this.hasPositiveNumber(this.claimDraft.numberOfHours)) {
      missingFields.push('number of hours');
    }

    this.claimValidationMessage = missingFields.length
      ? `Please complete ${missingFields.join(', ')}.`
      : '';

    return missingFields.length === 0;
  }

  validateAllocationStep(): boolean {
    this.allocationSuccessMessage = '';
    const hasInvalidRow = this.allocationRows.some((row) => (
      !row.selected
      || !row.persalCode
      || !row.description
      || !row.sarsCode
      || !this.hasPositiveNumber(row.amount)
    ));

    const hasInvalidLessAdvance = this.lessAdvanceSelected && !this.hasNonNegativeNumber(this.lessAdvanceST);
    const hasMissingTransaction = !this.persalTransaction.trim();

    if (hasInvalidRow) {
      this.allocationValidationMessage = 'Please tick each allocation row, select a description, and enter an amount greater than 0.';
      return false;
    }

    if (hasInvalidLessAdvance) {
      this.allocationValidationMessage = 'Please enter a valid Less Advance S&T amount or untick the row.';
      return false;
    }

    if (hasMissingTransaction) {
      this.allocationValidationMessage = 'Please enter the PERSAL Transaction.';
      return false;
    }

    this.allocationValidationMessage = '';
    return true;
  }

  submitAllocation(): void {
    if (!this.validateAllocationStep()) {
      return;
    }

    if (!this.signatureFile) {
      this.allocationValidationMessage = 'Please upload the applicant signature before submitting.';
      return;
    }

    const claimNumber = this.generateClaimNumber();
    const capturedBy = this.getCapturedByName();
    const submittedAt = new Date();
    const advanceTaken = this.lessAdvanceSelected ? Number(this.lessAdvanceST || 0) : 0;
    const allocationTotal = this.getAllocationTotal();
    const claimForSubmission = this.createSubmittedClaim(claimNumber, capturedBy, submittedAt, advanceTaken, allocationTotal);
    this.isSubmittingClaim = true;
    this.allocationValidationMessage = '';
    this.allocationSuccessMessage = '';
    this.submissionSuccessMessage = '';

    this.claimsService.saveSubsistenceTravelClaimFormDraft({
      claimNumber,
      capturedBy,
      dateCaptured: this.getDateInputValue(submittedAt),
      advanceTaken: this.formatCurrency(advanceTaken),
      amount: this.formatCurrency(allocationTotal),
    });

    this.claimsService.submitClaim(claimForSubmission).subscribe({
      next: (savedClaim) => {
        this.isSubmittingClaim = false;
        this.submissionSuccessMessage = `Claim saved successfully and sent to the supervisor for authorization. Reference: ${savedClaim.claimReference || claimNumber}`;
        this.resetClaimFormAfterSubmission();
      },
      error: (error) => {
        this.isSubmittingClaim = false;
        this.allocationValidationMessage = 'Claim could not be saved to the database. Please confirm the backend is running and try again.';
        console.error(error);
      },
    });
  }

  goToPrivateOwned(): void {
    this.router.navigate(['/private-owned']);
  }

  onRankChanged(rank: string): void {
    this.selectedRank = rank;
    (this.claimDraft as any).rank = rank;
    this.saveClaimDraft();
  }

  isPrivateMotorEligible(): boolean {
    return [
      'SMS (Senior Management Service) official',
      'Structured MMS official (Middle Management Service)',
    ].includes(this.selectedRank);
  }

  get selectedReceiptCategories(): string[] {
    return Array.from(new Set(this.allocationRows
      .filter((row) => row.selected && row.description)
      .map((row) => row.description)));
  }

  getApplicantName(): string {
    return this.getCapturedByName();
  }

  getReceiptUploads(category: string): UploadedDocument[] {
    return this.receiptUploads.filter((receipt) => receipt.category === category);
  }

  onReceiptSelected(category: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    Array.from(input.files).forEach((file) => this.addReceiptFile(category, file));
    input.value = '';
  }

  removeReceipt(receipt: UploadedDocument): void {
    URL.revokeObjectURL(receipt.url);
    this.receiptUploads = this.receiptUploads.filter((item) => item !== receipt);
  }

  onSignatureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    this.setSignatureFile(input.files[0]);
    input.value = '';
  }

  onSignatureDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onSignatureDropped(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    this.setSignatureFile(file);
  }

  removeSignature(): void {
    if (this.signatureFile) {
      URL.revokeObjectURL(this.signatureFile.url);
    }
    this.signatureFile = undefined;
  }

  saveClaimDraft(): void {
    this.updateNumberOfDays();
    this.updateNumberOfHours();

    const existingDraft = this.claimsService.getClaimDraft();
    this.claimsService.saveClaimDraft({
      ...existingDraft,
      ...this.claimDraft,
      ClaimDate: existingDraft?.ClaimDate || this.claimDraft.ClaimDate || new Date(),
      categories: existingDraft?.categories || this.claimDraft.categories || [],
      claimImages: existingDraft?.claimImages || this.claimDraft.claimImages || [],
      claimDetails: existingDraft?.claimDetails || this.claimDraft.claimDetails || [],
      rank: this.selectedRank,
    });
  }

  logout(): void {
    this.claimsService.clearClaimDraft();
    this.claimsService.clearTimesheetDraft();
    this.claimsService.clearClaimStatus();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onClaimDateChanged(field: 'departureDate' | 'arrivalDateTime', value: string): void {
    this.claimDraft[field] = value;
    this.updateNumberOfDays();
    this.saveClaimDraft();
  }

  onClaimTimeChanged(field: 'departureTime' | 'arrivalTime', value: string): void {
    this.claimDraft[field] = this.getTimeInputValue(value);
    this.updateNumberOfHours();
    this.saveClaimDraft();
  }

  getTimeInputValue(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const timeMatch = String(value).match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
      return '';
    }

    const hours = Math.min(Number(timeMatch[1]), 23);
    const minutes = Math.min(Number(timeMatch[2]), 59);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private updateNumberOfDays(): void {
    const departureDate = this.getDateOnly(this.claimDraft.departureDate);
    const arrivalDate = this.getDateOnly(this.claimDraft.arrivalDateTime);

    if (!departureDate || !arrivalDate || arrivalDate < departureDate) {
      this.claimDraft.dateNumberOfDays = undefined;
      return;
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    this.claimDraft.dateNumberOfDays = Math.floor((arrivalDate.getTime() - departureDate.getTime()) / millisecondsPerDay) + 1;
  }

  private updateNumberOfHours(): void {
    const departureMinutes = this.getMinutesFromTime(this.claimDraft.departureTime);
    const arrivalMinutes = this.getMinutesFromTime(this.claimDraft.arrivalTime);

    if (departureMinutes === undefined || arrivalMinutes === undefined) {
      this.claimDraft.numberOfHours = undefined;
      return;
    }

    const adjustedArrivalMinutes = arrivalMinutes >= departureMinutes
      ? arrivalMinutes
      : arrivalMinutes + (24 * 60);
    this.claimDraft.numberOfHours = Number(((adjustedArrivalMinutes - departureMinutes) / 60).toFixed(2));
  }

  private getMinutesFromTime(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const normalizedTime = this.getTimeInputValue(value);
    const [hours, minutes] = normalizedTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return undefined;
    }

    return (hours * 60) + minutes;
  }

  private getDateOnly(value: string | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return undefined;
    }

    return new Date(year, month - 1, day);
  }

  private createAllocationRow(): AllocationRow {
    return {
      selected: false,
      persalCode: '',
      description: '',
      sarsCode: '',
    };
  }

  private hasPositiveNumber(value: number | undefined): boolean {
    return Number(value) > 0;
  }

  private hasNonNegativeNumber(value: number | undefined): boolean {
    return value !== undefined && Number(value) >= 0;
  }

  private createSubmittedClaim(
    claimNumber: string,
    capturedBy: string,
    submittedAt: Date,
    advanceTaken: number,
    allocationTotal: number
  ): Claim {
    const user = this.authService.getUser();
    const selectedAllocations = this.allocationRows
      .filter((row) => row.selected)
      .map((row) => row.description);

    return {
      ...this.claimDraft,
      claimReference: claimNumber,
      capturedBy,
      dateCaptured: submittedAt.toISOString(),
      advanceTaken,
      amount: allocationTotal,
      ClaimDate: submittedAt,
      claimDate: submittedAt.toISOString(),
      userId: user?.userId,
      userName: capturedBy || user?.userName,
      categories: selectedAllocations.length ? selectedAllocations : ['Subsistence and Travel'],
      status: 'Submitted',
      total_amount: allocationTotal,
      claimDetails: this.allocationRows
        .filter((row) => row.selected)
        .map((row) => ({
          category: row.description,
          detailType: row.persalCode,
          description: `SARS Code: ${row.sarsCode}`,
          amount: Number(row.amount || 0),
        })),
      claimImages: [
        ...this.receiptUploads.map((receipt) => ({
          file: receipt.file,
          url: receipt.url as any,
        })),
        ...(this.signatureFile ? [{
          file: this.signatureFile.file,
          url: this.signatureFile.url as any,
        }] : []),
      ],
    };
  }

  private resetClaimFormAfterSubmission(): void {
    this.receiptUploads.forEach((receipt) => URL.revokeObjectURL(receipt.url));
    if (this.signatureFile) {
      URL.revokeObjectURL(this.signatureFile.url);
    }

    this.claimsService.clearClaimDraft();
    this.claimsService.clearTimesheetDraft();
    this.claimDraft = {
      ClaimDate: new Date(),
      categories: [],
      claimImages: [],
      claimDetails: [],
    };
    this.lessAdvanceST = undefined;
    this.lessAdvanceSelected = false;
    this.persalTransaction = '';
    this.selectedRank = '';
    this.receiptUploads = [];
    this.signatureFile = undefined;
    this.signatureDateTime = '';
    this.allocationRows = [this.createAllocationRow()];
    this.claimValidationMessage = '';
    this.allocationValidationMessage = '';

    if (this.claimStepper) {
      this.claimStepper.selectedIndex = 0;
    }
  }

  private addReceiptFile(category: string, file: File): void {
    if (!this.isAllowedDocument(file)) {
      this.allocationValidationMessage = 'Only image and PDF receipts are allowed.';
      return;
    }

    this.allocationValidationMessage = '';
    this.receiptUploads = [
      ...this.receiptUploads,
      {
        category,
        file,
        fileName: file.name,
        url: URL.createObjectURL(file),
        isImage: file.type.startsWith('image/'),
      },
    ];
  }

  private setSignatureFile(file: File): void {
    if (!this.isAllowedDocument(file)) {
      this.allocationValidationMessage = 'Only image and PDF signature files are allowed.';
      return;
    }

    this.removeSignature();
    this.signatureDateTime = new Date().toLocaleString();
    this.signatureFile = {
      category: 'Applicant signature',
      file,
      fileName: file.name,
      url: URL.createObjectURL(file),
      isImage: file.type.startsWith('image/'),
    };
  }

  private isAllowedDocument(file: File): boolean {
    return file.type.startsWith('image/') || file.type === 'application/pdf';
  }

  private generateClaimNumber(): string {
    const now = new Date();
    return [
      String(now.getFullYear()).slice(-2),
      this.padDatePart(now.getMonth() + 1),
      this.padDatePart(now.getDate()),
      this.padDatePart(now.getHours()),
      this.padDatePart(now.getMinutes()),
    ].join('');
  }

  private getCapturedByName(): string {
    const user = this.authService.getUser();
    const firstName = String(user?.userFirstName || '').trim();
    const lastName = String(user?.userLastName || '').trim();

    if (firstName || lastName) {
      const initials = firstName
        .split(/\s+/)
        .filter(Boolean)
        .map((name) => name.charAt(0).toUpperCase())
        .join('');
      return [initials, lastName].filter(Boolean).join(' ');
    }

    return user?.userName || this.employeeName;
  }

  private getDateInputValue(date: Date): string {
    return [
      date.getFullYear(),
      this.padDatePart(date.getMonth() + 1),
      this.padDatePart(date.getDate()),
    ].join('-');
  }

  private formatMoney(value: number): string {
    return (Number(value) || 0).toFixed(2);
  }

  private formatCurrency(value: number): string {
    return `R ${this.formatMoney(value)}`;
  }

  private padDatePart(value: number): string {
    return String(value).padStart(2, '0');
  }
}
