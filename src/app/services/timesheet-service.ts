import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { TimesheetRow } from '../timesheet/timesheet';
import { API_BASE_URL } from './api-config';

export interface TimesheetPayload {
  userId?: number;
  workDate: string;
  startTime: string;
  endTime: string;
  total_hours: number;
  location: string;
  description: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TimesheetService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  saveTimesheet(rows: TimesheetRow[], userId: number | undefined, description: string): Observable<TimesheetPayload[]> {
    const payload = rows
      .filter((row) => row.date && row.starttime && row.endtime && row.worklocation)
      .map((row) => ({
        userId,
        workDate: this.toIsoString(row.date),
        startTime: this.toIsoString(row.starttime),
        endTime: this.toIsoString(row.endtime),
        total_hours: this.toHours(row.totalWorkHours),
        location: row.worklocation,
        description,
        status: true,
      }));

    return this.http.post<TimesheetPayload[]>(`${this.baseUrl}/timesheets/save`, payload, {
      headers: this.getAuthHeaders(),
    });
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

    const hours = Number(parts[1]);
    const minutes = Number(parts[2]);
    return hours + minutes / 60;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
