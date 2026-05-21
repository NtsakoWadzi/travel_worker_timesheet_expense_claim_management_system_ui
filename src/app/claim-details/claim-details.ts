import { Component, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';
import { Claim } from '../Model/claim.model';
import { Timesheet } from '../timesheet/timesheet';

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

@Component({
  selector: 'app-claim-details',
  standalone: false,
  templateUrl: './claim-details.html',
  styleUrl: './claim-details.css',
})
export class ClaimDetailsComponent {
  @ViewChild('claimStepper') claimStepper?: MatStepper;
  @ViewChild('timesheetForm') timesheetForm?: Timesheet;

  employeeName = 'Employee';
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
    if (!this.timesheetForm?.validatePersonalParticulars()) {
      return;
    }

    this.selectStep('claims');
  }

  continueToAllocationStep(): void {
    if (!this.validateClaimStep()) {
      return;
    }

    this.selectStep('bank-details');
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

  validateClaimStep(): boolean {
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

    const claimNumber = this.generateClaimNumber();
    this.claimsService.saveSubsistenceTravelClaimFormDraft({
      claimNumber,
      capturedBy: this.getCapturedByName(),
      dateCaptured: this.getDateInputValue(new Date()),
      advanceTaken: this.formatMoney(this.lessAdvanceST || 0),
      amount: this.formatMoney(this.getAllocationTotal()),
    });
    this.claimsService.saveLocalSubmittedClaim(this.createSubmittedClaim(claimNumber));
    this.allocationSuccessMessage = 'Claim information submitted successfully.';
  }

  goToPrivateOwned(): void {
    this.router.navigate(['/private-owned']);
  }

  saveClaimDraft(): void {
    const existingDraft = this.claimsService.getClaimDraft();
    this.claimsService.saveClaimDraft({
      ...existingDraft,
      ...this.claimDraft,
      ClaimDate: existingDraft?.ClaimDate || this.claimDraft.ClaimDate || new Date(),
      categories: existingDraft?.categories || this.claimDraft.categories || [],
      claimImages: existingDraft?.claimImages || this.claimDraft.claimImages || [],
      claimDetails: existingDraft?.claimDetails || this.claimDraft.claimDetails || [],
    });
  }

  logout(): void {
    this.claimsService.clearClaimDraft();
    this.claimsService.clearTimesheetDraft();
    this.claimsService.clearClaimStatus();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private createAllocationRow(): AllocationRow {
    const option = this.allocationOptions[0];
    return {
      selected: false,
      persalCode: option.persalCode,
      description: option.description,
      sarsCode: option.sarsCode,
    };
  }

  private hasPositiveNumber(value: number | undefined): boolean {
    return Number(value) > 0;
  }

  private hasNonNegativeNumber(value: number | undefined): boolean {
    return value !== undefined && Number(value) >= 0;
  }

  private createSubmittedClaim(claimNumber: string): Claim {
    const user = this.authService.getUser();
    const submittedAt = new Date();
    const selectedAllocations = this.allocationRows
      .filter((row) => row.selected)
      .map((row) => row.description);

    return {
      ...this.claimDraft,
      claimId: submittedAt.getTime(),
      claimReference: claimNumber,
      ClaimDate: submittedAt,
      claimDate: submittedAt.toISOString(),
      userId: user?.userId,
      userName: user?.userName || this.getCapturedByName(),
      categories: selectedAllocations.length ? selectedAllocations : ['Subsistence and Travel'],
      status: 'Submitted',
      total_amount: this.getAllocationTotal(),
      claimImages: [],
      claimDetails: this.allocationRows
        .filter((row) => row.selected)
        .map((row) => ({
          category: row.description,
          detailType: row.persalCode,
          description: `SARS Code: ${row.sarsCode}`,
          amount: Number(row.amount || 0),
        })),
      timesheetDetails: this.claimsService.getTimesheetDraft(),
      localSubmitted: true,
    };
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

  private padDatePart(value: number): string {
    return String(value).padStart(2, '0');
  }
}
