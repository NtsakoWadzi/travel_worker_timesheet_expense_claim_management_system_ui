import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BankDetails, Claim } from '../Model/claim.model';
import { AdminService, AdminTimesheet, AdminUser } from '../services/admin-service';
import { AuthService } from '../services/auth';

type AdminResource = 'claims' | 'timesheets' | 'bankDetails' | 'reports';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  activeResource: AdminResource = 'claims';
  searchTerm = '';
  claims: Claim[] = [];
  timesheets: AdminTimesheet[] = [];
  bankDetails: BankDetails[] = [];
  users: AdminUser[] = [];
  selectedClaim: Claim | null = null;
  selectedTimesheet: AdminTimesheet | null = null;
  selectedBankDetails: BankDetails | null = null;
  isCreating = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  adminName = 'Admin';
  private isLoadingDashboard = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getUser();
    this.adminName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Admin';
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadDashboard();
  }

  get filteredClaims(): Claim[] {
    return this.filterRecords(this.claims);
  }

  get filteredTimesheets(): AdminTimesheet[] {
    return this.filterRecords(this.timesheets);
  }

  get filteredBankDetails(): BankDetails[] {
    return this.filterRecords(this.bankDetails);
  }

  get currentTitle(): string {
    if (this.activeResource === 'timesheets') return 'Timesheets';
    if (this.activeResource === 'bankDetails') return 'Bank Details';
    if (this.activeResource === 'reports') return 'Generate Reports';
    return 'Claims';
  }

  get currentCount(): number {
    if (this.activeResource === 'timesheets') return this.filteredTimesheets.length;
    if (this.activeResource === 'bankDetails') return this.filteredBankDetails.length;
    if (this.activeResource === 'reports') return 0;
    return this.filteredClaims.length;
  }

  loadDashboard(showLoading = true): void {
    if (this.isSaving || this.isLoadingDashboard) {
      return;
    }

    this.isLoadingDashboard = true;
    this.isLoading = showLoading;
    this.errorMessage = '';
    forkJoin({
      claims: this.adminService.getClaims(),
      timesheets: this.adminService.getTimesheets(),
      bankDetails: this.adminService.getBankDetails(),
      users: this.adminService.getUsers(),
    }).subscribe({
      next: ({ claims, timesheets, bankDetails, users }) => {
        this.claims = this.dedupeRecords(claims || [], (claim) => this.getClaimKey(claim));
        this.timesheets = this.dedupeRecords(timesheets || [], (timesheet) => this.getTimesheetKey(timesheet));
        this.bankDetails = this.dedupeRecords(bankDetails || [], (bankDetail) => this.getBankDetailsKey(bankDetail));
        this.users = this.dedupeRecords(users || [], (user) => String(user.userId));
        this.isLoadingDashboard = false;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Admin records could not be loaded. Please confirm the backend is running and the admin user is logged in.';
        this.isLoadingDashboard = false;
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  selectResource(resource: AdminResource): void {
    this.activeResource = resource;
    this.searchTerm = '';
    this.clearSelection();
  }

  startCreate(): void {
    if (this.activeResource === 'reports') {
      return;
    }

    this.isCreating = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.activeResource === 'claims') {
      this.selectedClaim = {
        ClaimDate: new Date(),
        claimDate: new Date().toISOString(),
        userId: undefined,
        categories: '',
        claimImages: [],
        status: 'Submitted',
        total_amount: 0,
      };
      this.selectedTimesheet = null;
      this.selectedBankDetails = null;
      return;
    }

    if (this.activeResource === 'timesheets') {
      this.selectedTimesheet = {
        userId: undefined,
        workDate: '',
        startTime: '',
        endTime: '',
        total_hours: 0,
        location: '',
        description: '',
        status: true,
      };
      this.selectedClaim = null;
      this.selectedBankDetails = null;
      return;
    }

    this.selectedBankDetails = {
      userId: undefined,
      claimId: undefined,
      bankName: '',
      accountNumber: '',
      accountType: '',
    };
    this.selectedClaim = null;
    this.selectedTimesheet = null;
  }

  editClaim(claim: Claim): void {
    this.isCreating = false;
    this.selectedClaim = { ...claim, claimImages: claim.claimImages || [] };
    this.selectedTimesheet = null;
    this.selectedBankDetails = null;
  }

  editTimesheet(timesheet: AdminTimesheet): void {
    this.isCreating = false;
    this.selectedTimesheet = { ...timesheet };
    this.selectedClaim = null;
    this.selectedBankDetails = null;
  }

  editBankDetails(bankDetails: BankDetails): void {
    this.isCreating = false;
    this.selectedBankDetails = { ...bankDetails };
    this.selectedClaim = null;
    this.selectedTimesheet = null;
  }

  saveClaim(): void {
    if (!this.selectedClaim) return;
    this.isSaving = true;
    this.selectedClaim.claimDate = this.toBackendDate(this.selectedClaim.claimDate || this.selectedClaim.ClaimDate);
    const request = this.isCreating
      ? this.adminService.createClaim(this.selectedClaim)
      : this.adminService.updateClaim(this.selectedClaim.claimId as number, this.selectedClaim);

    request.subscribe({
      next: () => this.handleSaved('Claim saved successfully.'),
      error: (error) => this.handleSaveError(error, 'Claim could not be saved.'),
    });
  }

  saveTimesheet(): void {
    if (!this.selectedTimesheet) return;
    this.isSaving = true;
    const request = this.isCreating
      ? this.adminService.createTimesheet(this.selectedTimesheet)
      : this.adminService.updateTimesheet(this.selectedTimesheet.timesheetId as number, this.selectedTimesheet);

    request.subscribe({
      next: () => this.handleSaved('Timesheet saved successfully.'),
      error: (error) => this.handleSaveError(error, 'Timesheet could not be saved.'),
    });
  }

  saveBankDetails(): void {
    if (!this.selectedBankDetails) return;
    this.isSaving = true;
    const request = this.isCreating
      ? this.adminService.createBankDetails(this.selectedBankDetails)
      : this.adminService.updateBankDetails(this.selectedBankDetails.bankDetailsId as number, this.selectedBankDetails);

    request.subscribe({
      next: () => this.handleSaved('Bank details saved successfully.'),
      error: (error) => this.handleSaveError(error, 'Bank details could not be saved.'),
    });
  }

  deleteClaim(claim: Claim): void {
    if (!claim.claimId || !window.confirm(`Delete claim ${claim.claimReference || claim.claimId}?`)) return;
    this.adminService.deleteClaim(claim.claimId).subscribe({
      next: () => this.handleSaved('Claim deleted successfully.'),
      error: (error) => this.handleSaveError(error, 'Claim could not be deleted.'),
    });
  }

  deleteTimesheet(timesheet: AdminTimesheet): void {
    if (!timesheet.timesheetId || !window.confirm(`Delete timesheet ${timesheet.timesheetId}?`)) return;
    this.adminService.deleteTimesheet(timesheet.timesheetId).subscribe({
      next: () => this.handleSaved('Timesheet deleted successfully.'),
      error: (error) => this.handleSaveError(error, 'Timesheet could not be deleted.'),
    });
  }

  deleteBankDetails(bankDetails: BankDetails): void {
    if (!bankDetails.bankDetailsId || !window.confirm(`Delete bank details ${bankDetails.bankDetailsId}?`)) return;
    this.adminService.deleteBankDetails(bankDetails.bankDetailsId).subscribe({
      next: () => this.handleSaved('Bank details deleted successfully.'),
      error: (error) => this.handleSaveError(error, 'Bank details could not be deleted.'),
    });
  }

  clearSelection(): void {
    this.isCreating = false;
    this.selectedClaim = null;
    this.selectedTimesheet = null;
    this.selectedBankDetails = null;
    this.errorMessage = '';
  }

  getUserName(userId: number | undefined): string {
    const user = this.users.find((item) => Number(item.userId) === Number(userId));
    if (!user) return userId ? `User ${userId}` : '-';
    if (user.userFirstName && user.userLastName) return `${user.userFirstName} ${user.userLastName}`;
    return user.userName || `User ${userId}`;
  }

  formatDate(value: Date | string | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private filterRecords<T>(records: T[]): T[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(term));
  }

  private toBackendDate(value: Date | string | undefined): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }

  private dedupeRecords<T>(records: T[], getKey: (record: T) => string): T[] {
    const recordsByKey = new Map<string, T>();

    records.forEach((record) => {
      const key = getKey(record);
      if (!recordsByKey.has(key)) {
        recordsByKey.set(key, record);
      }
    });

    return Array.from(recordsByKey.values());
  }

  private getClaimKey(claim: Claim): string {
    if (claim.claimReference) return `reference:${claim.claimReference}`;
    if (claim.claimId) return `id:${claim.claimId}`;

    return [
      'claim',
      claim.userId ?? '',
      this.normalizeDateKey(claim.claimDate || claim.ClaimDate),
      this.normalizeValueKey(claim.categories),
      claim.total_amount ?? '',
    ].join('|');
  }

  private getTimesheetKey(timesheet: AdminTimesheet): string {
    return [
      'timesheet',
      timesheet.userId ?? '',
      this.normalizeDateKey(timesheet.workDate),
      timesheet.startTime || '',
      timesheet.endTime || '',
      timesheet.location || '',
      timesheet.description || '',
    ].join('|');
  }

  private getBankDetailsKey(bankDetails: BankDetails): string {
    return [
      'bank',
      bankDetails.userId ?? '',
      bankDetails.claimId ?? '',
      bankDetails.bankName || '',
      bankDetails.accountNumber || '',
      bankDetails.accountType || '',
    ].join('|');
  }

  private normalizeDateKey(value: Date | string | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
  }

  private normalizeValueKey(value: unknown): string {
    return Array.isArray(value) ? value.join(',') : String(value ?? '');
  }

  private handleSaved(message: string): void {
    this.isSaving = false;
    this.clearSelection();
    this.successMessage = message;
    this.loadDashboard();
  }

  private handleSaveError(error: unknown, message: string): void {
    this.isSaving = false;
    this.errorMessage = message;
    console.error(error);
  }
}
