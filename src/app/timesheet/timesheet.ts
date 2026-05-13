import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { TimesheetService } from '../services/timesheet-service';

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
  constructor(
    private router: Router,
    private authService: AuthService,
    private timesheetService: TimesheetService
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
  taskDescription = '';
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  displayedColumns: string[] = [
    'date','worklocation' ,'starttime', 'endtime', 'totalWorkHours'
  ];

  timesheetData: TimesheetRow[] = [
    { date: '7/9/2025', worklocation : '',starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/10/2025',worklocation:'', starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/10/2025',worklocation:'', starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/10/2025',worklocation:'', starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/11/2025',worklocation:'', starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/12/2025',worklocation:'',starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/13/2025',worklocation:'', starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/14/2025', worklocation :'',starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/15/2025', worklocation :'',starttime: null, endtime: null, totalWorkHours: '' },
    { date: '7/16/2025','worklocation':'' ,starttime: null, endtime: null, totalWorkHours: '' },
  ];

  calculateTotalHours(row: TimesheetRow): void {
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

  this.isSubmitting = true;

  this.timesheetService.saveTimesheet(completedRows, user?.userId, this.taskDescription).subscribe({
    next: () => {
      this.isSubmitting = false;
      this.successMessage = 'Timesheet submitted successfully.';
      this.router.navigate(['/claims']);
    },
    error: (error) => {
      this.isSubmitting = false;
      this.errorMessage = this.getSubmitErrorMessage(error);
      console.error(error);
    },
  });
}

private getSubmitErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    this.authService.logout();
    return 'Your login session has expired. Please log in again before submitting your timesheet.';
  }

  return 'Timesheet could not be submitted. Please try again.';
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
  this.authService.logout();
  this.router.navigate(['/']);
}

  
}
