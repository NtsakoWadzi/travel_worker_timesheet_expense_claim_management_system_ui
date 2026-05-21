import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ClaimsService } from '../services/claims-service';

export interface TimesheetRow {
  date: Date | string;
  worklocation: string;
  starttime: Date | null;
  endtime: Date | null;
  totalWorkHours: string;
  description?: string;
}

@Component({
  selector: 'app-timesheet',
  standalone: false,
  templateUrl: './timesheet.html',
  styleUrl: './timesheet.css',
})
export class Timesheet implements OnInit {
  @Input() embedded = false;
  @Output() stepRequested = new EventEmitter<'timesheet' | 'claims' | 'bank-details' | 'status'>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private claimsService: ClaimsService
  ) {}

  ngOnInit(): void {
    //this.timesheetReferenceNumber = this.generateReferenceNumber(); this will be used in the claims component
    const user = this.authService.getUser();
    this.employeeName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'Employee';

  }

  timesheetReferenceNumber: string = '';
  employeeName: string = 'Employee';
  personalParticulars = {
    officeType: '',
    initials: '',
    surname: '',
    persalNumber: '',
    cellularPhoneNumber: '',
  };
  taskDescription = '';
  errorMessage = '';
  successMessage = '';
  personalParticularsErrorMessage = '';
  isSubmitting = false;
  activeRow: TimesheetRow | null = null;

  displayedColumns: string[] = [
    'date', 'worklocation', 'starttime', 'endtime', 'totalWorkHours', 'actions'
  ];

  timesheetData: TimesheetRow[] = [
    this.createBlankRow(),
  ];

  calculateTotalHours(row: TimesheetRow): void {
  this.setActiveRow(row);
  if (row.starttime && row.endtime) {
    const start = new Date(row.starttime);
    const end = new Date(row.endtime);

    if (end > start) {
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      row.totalWorkHours = `${diffHours}h ${diffMinutes}m`;
    } else {
      row.totalWorkHours = 'Invalid';
    }
  }
  this.calculateGrandTotal();
}

setActiveRow(row: TimesheetRow): void {
  if (!this.successMessage) {
    this.activeRow = row;
  }
}

onRowValueChanged(row: TimesheetRow): void {
  this.setActiveRow(row);
  this.calculateGrandTotal();
}

addTimesheetRow(afterIndex: number): void {
  const row = this.timesheetData[afterIndex];
  if (row && !this.hasRowStarted(row)) {
    this.setActiveRow(row);
    return;
  }

  const nextRow = this.createBlankRow();
  this.timesheetData = [
    ...this.timesheetData.slice(0, afterIndex + 1),
    nextRow,
    ...this.timesheetData.slice(afterIndex + 1),
  ];
  this.activeRow = nextRow;
}

isActiveRow(row: TimesheetRow): boolean {
  return this.activeRow === row && !this.successMessage;
}

hasActiveRow(): boolean {
  return !!this.activeRow && !this.successMessage;
}

hasRowStarted(row: TimesheetRow): boolean {
  return !!row.date || !!row.worklocation || !!row.starttime || !!row.endtime || !!row.totalWorkHours;
}

validatePersonalParticulars(): boolean {
  const missingFields: string[] = [];

  if (!this.personalParticulars.officeType) {
    missingFields.push('office type');
  }

  if (!this.personalParticulars.initials.trim()) {
    missingFields.push('initials');
  }

  if (!this.personalParticulars.surname.trim()) {
    missingFields.push('surname');
  }

  if (!this.personalParticulars.persalNumber.trim()) {
    missingFields.push('persal number');
  }

  if (!this.personalParticulars.cellularPhoneNumber.trim()) {
    missingFields.push('cellular phone number');
  }

  this.personalParticularsErrorMessage = missingFields.length
    ? `Please complete ${missingFields.join(', ')}.`
    : '';

  return missingFields.length === 0;
}

private createBlankRow(): TimesheetRow {
  return { date: '', worklocation: '', starttime: null, endtime: null, totalWorkHours: '' };
}

grandTotalHours: string = '0h 0m';

calculateGrandTotal(): void {
  let totalMinutes = 0;

  this.timesheetData.forEach(row => {
    if (row.totalWorkHours && row.totalWorkHours !== 'Invalid') {
      const parts = row.totalWorkHours.match(/(\d+)h\s(\d+)m/);
      if (parts) {
        totalMinutes += parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  this.grandTotalHours = `${hours}h ${minutes}m`;
}


// generateReferenceNumber(): string {  this will be used in the claims component
//   const min = 100000;
//   const max = 999999;
//   return Math.floor(Math.random() * (max - min + 1) + min).toString();
// }
onSubmitclick(){
  this.errorMessage = '';
  this.successMessage = '';

  if (!this.authService.isLoggedIn()) {
    this.errorMessage = 'Please log in before submitting a timesheet.';
    return;
  }

  const user = this.authService.getUser();
  const completedRows = this.timesheetData.filter((row) => row.date && row.starttime && row.endtime && row.worklocation);

  if (completedRows.length === 0) {
    this.errorMessage = 'Please complete at least one timesheet row before submitting.';
    return;
  }

  this.claimsService.saveTimesheetDraft(completedRows.map((row) => ({
    userId: user?.userId,
    workDate: this.toIsoString(row.date),
    startTime: this.toIsoString(row.starttime),
    endTime: this.toIsoString(row.endtime),
    total_hours: this.toHours(row.totalWorkHours),
    location: row.worklocation,
    description: this.taskDescription,
    status: true,
  })));
  this.activeRow = null;
  this.successMessage = 'Timesheet added to the claim submission.';
  this.goToClaims();
}

goToTimesheet(): void {
  if (this.embedded) {
    this.stepRequested.emit('timesheet');
    return;
  }
  this.router.navigate(['/timesheet']);
}

goToClaims(): void {
  if (this.embedded) {
    this.stepRequested.emit('claims');
    return;
  }
  this.router.navigate(['/claims']);
}

goToClaimStatus(): void {
  if (this.embedded) {
    this.stepRequested.emit('status');
    return;
  }
  this.router.navigate(['/claim-status']);
}

logout(): void {
  this.claimsService.clearTimesheetDraft();
  this.claimsService.clearClaimStatus();
  this.authService.logout();
  this.router.navigate(['/']);
}

private toIsoString(value: Date | string | null): string {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toISOString();
}

private toHours(totalWorkHours: string): number {
  const parts = totalWorkHours.match(/(\d+)h\s(\d+)m/);
  if (!parts) {
    return 0;
  }

  return Number(parts[1]) + Number(parts[2]) / 60;
}

  
}
