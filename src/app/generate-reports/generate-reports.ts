import { Component, OnInit } from '@angular/core';
import { AdminService, GeneratedReport, ReportType } from '../services/admin-service';

@Component({
  selector: 'app-generate-reports',
  standalone: false,
  templateUrl: './generate-reports.html',
  styleUrl: './generate-reports.css',
})
export class GenerateReportsComponent implements OnInit {
  reports: GeneratedReport[] = [];
  selectedReport: GeneratedReport | null = null;
  editableReport: GeneratedReport | null = null;
  isLoading = false;
  isSaving = false;
  activeReportType: ReportType | null = null;
  deletingReportId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.adminService.getReports().subscribe({
      next: (reports) => {
        this.reports = reports || [];
        this.selectedReport = this.getSelectedReportAfterReload() || this.reports[0] || null;
        if (this.editableReport) {
          this.editableReport = this.selectedReport ? { ...this.selectedReport } : null;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Reports could not be loaded.';
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  generateReport(reportType: ReportType): void {
    this.activeReportType = reportType;
    this.errorMessage = '';
    this.successMessage = '';
    this.adminService.generateReport(reportType).subscribe({
      next: (report) => {
        this.selectedReport = report;
        this.editableReport = null;
        this.reports = [report, ...this.reports.filter((item) => item.reportId !== report.reportId)];
        this.activeReportType = null;
        this.successMessage = `${this.getReportLabel(report.reportType)} report generated successfully.`;
      },
      error: (error) => {
        this.errorMessage = `${this.getReportLabel(reportType)} report could not be generated.`;
        this.activeReportType = null;
        console.error(error);
      },
    });
  }

  selectReport(report: GeneratedReport): void {
    this.selectedReport = report;
    this.editableReport = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  editReport(report: GeneratedReport): void {
    this.selectedReport = report;
    this.editableReport = { ...report };
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveReport(): void {
    if (!this.editableReport?.reportId) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.adminService.updateReport(this.editableReport.reportId, this.editableReport).subscribe({
      next: (report) => {
        this.reports = this.replaceReport(report);
        this.selectedReport = report;
        this.editableReport = null;
        this.isSaving = false;
        this.successMessage = 'Report saved successfully.';
      },
      error: (error) => {
        this.errorMessage = 'Report could not be saved.';
        this.isSaving = false;
        console.error(error);
      },
    });
  }

  cancelEdit(): void {
    this.editableReport = null;
  }

  deleteReport(report: GeneratedReport): void {
    if (!report.reportId || !window.confirm(`Delete report ${report.fileName}?`)) return;

    this.deletingReportId = report.reportId;
    this.errorMessage = '';
    this.successMessage = '';
    this.adminService.deleteReport(report.reportId).subscribe({
      next: () => {
        this.reports = this.reports.filter((item) => item.reportId !== report.reportId);
        if (this.selectedReport?.reportId === report.reportId) {
          this.selectedReport = this.reports[0] || null;
        }
        if (this.editableReport?.reportId === report.reportId) {
          this.editableReport = null;
        }
        this.deletingReportId = null;
        this.successMessage = 'Report deleted successfully.';
      },
      error: (error) => {
        this.errorMessage = 'Report could not be deleted.';
        this.deletingReportId = null;
        console.error(error);
      },
    });
  }

  downloadReport(report: GeneratedReport): void {
    const link = document.createElement('a');
    link.href = `data:${report.contentType};base64,${report.fileContentBase64}`;
    link.download = report.fileName;
    link.click();
  }

  getReportLabel(reportType: ReportType | string): string {
    return reportType === 'timesheets' || reportType === 'TIMESHEETS' ? 'Timesheets' : 'Claims';
  }

  private getSelectedReportAfterReload(): GeneratedReport | null {
    if (!this.selectedReport) return null;
    return this.reports.find((report) => report.reportId === this.selectedReport?.reportId) || null;
  }

  private replaceReport(report: GeneratedReport): GeneratedReport[] {
    return this.reports
      .map((item) => item.reportId === report.reportId ? report : item)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }
}
