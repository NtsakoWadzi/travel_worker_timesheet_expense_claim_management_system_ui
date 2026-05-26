import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { ClaimsService, PrivateMotorJourneyDraft } from '../services/claims-service';
import { Claim, ClaimDetail } from '../Model/claim.model';

interface JourneyRow extends PrivateMotorJourneyDraft {
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

interface JourneyDocument {
  type: 'Google Maps proof' | 'Vehicle ownership' | 'License';
  file: File;
  fileName: string;
  url: string;
  isImage: boolean;
}

@Component({
  selector: 'app-details-of-journey',
  standalone: false,
  templateUrl: './details-of-journey.html',
  styleUrl: './details-of-journey.css',
})
export class DetailsOfJourneyComponent {
  @ViewChild('journeyStepper') journeyStepper?: MatStepper;
  employeeName = 'Employee';
  journeyRows: JourneyRow[] = [this.createJourneyRow()];
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  journeyDocuments: JourneyDocument[] = [];
  requiredDocumentTypes: JourneyDocument['type'][] = ['Google Maps proof', 'Vehicle ownership', 'License'];

  constructor(
    private router: Router,
    private authService: AuthService,
    private claimsService: ClaimsService
  ) {
    const user = this.authService.getUser();
    this.employeeName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Employee';

    const draftRows = this.claimsService.getPrivateMotorJourneyDraft();
    if (draftRows.length) {
      this.journeyRows = draftRows;
    }
  }

  addJourneyRow(): void {
    this.saveJourneyDraft();
    this.journeyRows = [...this.journeyRows, this.createJourneyRow()];
    if (this.journeyStepper) {
      this.journeyStepper.selectedIndex = 0;
    }
  }

  submitPrivateMotorClaim(): void {
    this.saveJourneyDraft();
    this.errorMessage = '';
    this.successMessage = '';

    const privateMotorDraft = this.claimsService.getPrivateMotorDraft();
    if (!privateMotorDraft) {
      this.errorMessage = 'Please complete the private owned vehicle form before submitting.';
      return;
    }

    const validRows = this.journeyRows.filter((row) => row.date || row.reason || row.claimableKm || row.totalTraveled);
    if (!validRows.length) {
      this.errorMessage = 'Please complete at least one journey row before submitting.';
      return;
    }

    const missingDocument = this.requiredDocumentTypes.find((type) => this.getJourneyDocuments(type).length === 0);
    if (missingDocument) {
      this.errorMessage = `Please upload ${missingDocument} before submitting.`;
      return;
    }

    const user = this.authService.getUser();
    const existingDraft = this.claimsService.getClaimDraft();
    const submittedAt = new Date();
    const claimReference = this.generateClaimNumber();
    const claim: Claim = {
      ...(existingDraft || {
        ClaimDate: submittedAt,
        categories: [],
        claimImages: [],
        claimDetails: [],
      }),
      claimReference,
      ClaimDate: submittedAt,
      claimDate: submittedAt.toISOString(),
      userId: user?.userId,
      userName: user?.userName || this.employeeName,
      categories: ['Private Motor', 'Distance Travelled'],
      status: 'Submitted',
      claimImages: [
        ...(existingDraft?.claimImages || []),
        ...this.journeyDocuments.map((document) => ({
          file: document.file,
          url: document.url as any,
        })),
      ],
      claimDetails: this.createPrivateMotorClaimDetails(privateMotorDraft, validRows),
    };

    this.isSubmitting = true;
    this.successMessage = 'Saving private motor claim to the database...';
    this.claimsService.submitClaim(claim).pipe(
      timeout(30000),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: (savedClaim) => {
        this.successMessage = `Private motor claim saved successfully and sent to the supervisor for authorization. Reference: ${savedClaim.claimReference || claimReference}`;
        this.resetPrivateMotorFlow();
      },
      error: (error) => {
        this.successMessage = '';
        this.errorMessage = 'Private motor claim could not be saved to the database. Please confirm the backend is running and try again.';
        console.error(error);
      },
    });
  }

  onJourneyDocumentSelected(type: JourneyDocument['type'], event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    Array.from(input.files).forEach((file) => this.addJourneyDocument(type, file));
    input.value = '';
  }

  getJourneyDocuments(type: JourneyDocument['type']): JourneyDocument[] {
    return this.journeyDocuments.filter((document) => document.type === type);
  }

  removeJourneyDocument(document: JourneyDocument): void {
    URL.revokeObjectURL(document.url);
    this.journeyDocuments = this.journeyDocuments.filter((item) => item !== document);
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

  saveJourneyDraft(): void {
    this.claimsService.savePrivateMotorJourneyDraft(this.journeyRows);
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

  private createPrivateMotorClaimDetails(privateMotorDraft: any, rows: JourneyRow[]): ClaimDetail[] {
    const vehicleDescription = [
      `Claimed by: ${privateMotorDraft.claimedBy || '-'}`,
      `Department: ${privateMotorDraft.departmentOf || '-'}`,
      `Rank: ${privateMotorDraft.rank || '-'}`,
      `Vehicle: ${privateMotorDraft.makeAndModel || '-'}`,
      `Registration: ${privateMotorDraft.registrationNumber || '-'}`,
      `Engine group: ${privateMotorDraft.engineSweptVolumeGroup || '-'}`,
    ].join(' | ');

    return rows.map((row, index) => ({
      category: 'Distance Travelled',
      detailType: 'Private Motor',
      description: [
        vehicleDescription,
        `Journey ${index + 1}: ${row.departureFrom || '-'} to ${row.arrivalAt || '-'}`,
        `Date: ${row.date || '-'}`,
        `Reason: ${row.reason || '-'}`,
        `Departure: ${row.departureTime || '-'}`,
        `Arrival: ${row.arrivalTime || '-'}`,
        `Home to destination km: ${row.homeToDestinationKm || 0}`,
        `Office to destination km: ${row.officeToDestinationKm || 0}`,
        `Speedometer: ${row.speedometerStart || 0} - ${row.speedometerEnd || 0}`,
      ].join(' | '),
      kilometers: Number(row.claimableKm || row.totalTraveled || 0),
      vehicleType: privateMotorDraft.category || privateMotorDraft.vehicleType || 'Private Motor',
      engineSizeCc: Number(String(privateMotorDraft.engineSweptVolumeGroup || '').replace(/\D/g, '')) || undefined,
      amount: 0,
    }));
  }

  private resetPrivateMotorFlow(): void {
    this.journeyDocuments.forEach((document) => URL.revokeObjectURL(document.url));
    this.claimsService.clearClaimDraft();
    this.claimsService.clearTimesheetDraft();
    this.claimsService.clearPrivateMotorDrafts();
    this.journeyRows = [this.createJourneyRow()];
    this.journeyDocuments = [];
  }

  private addJourneyDocument(type: JourneyDocument['type'], file: File): void {
    if (!this.isAllowedDocument(file)) {
      this.errorMessage = 'Only image and PDF documents are allowed.';
      return;
    }

    this.errorMessage = '';
    this.journeyDocuments = [
      ...this.journeyDocuments,
      {
        type,
        file,
        fileName: file.name,
        url: URL.createObjectURL(file),
        isImage: file.type.startsWith('image/'),
      },
    ];
  }

  private isAllowedDocument(file: File): boolean {
    return file.type.startsWith('image/') || file.type === 'application/pdf';
  }

  private generateClaimNumber(): string {
    const now = new Date();
    return [
      'PM',
      String(now.getFullYear()).slice(-2),
      this.padDatePart(now.getMonth() + 1),
      this.padDatePart(now.getDate()),
      this.padDatePart(now.getHours()),
      this.padDatePart(now.getMinutes()),
    ].join('');
  }

  private padDatePart(value: number): string {
    return String(value).padStart(2, '0');
  }
}
