import { Component, OnInit } from '@angular/core';

export interface TimesheetRow {
  date: string;
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

  ngOnInit(): void {
    //this.timesheetReferenceNumber = this.generateReferenceNumber(); this will be used in the claims component

  }

  timesheetReferenceNumber: string = '';
  employeeName: string = 'Bob Smith';


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


  
}