import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth';

type WorkspaceSection = 'dashboard' | 'employees' | 'finance' | 'audit-logs';

interface MetricCard {
  label: string;
  value: string;
  tone: 'neutral' | 'warning' | 'success' | 'danger';
}

interface WorkspaceLink {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-snt-workspace',
  standalone: false,
  templateUrl: './snt-workspace.html',
  styleUrl: './snt-workspace.css',
})
export class SntWorkspaceComponent {
  section: WorkspaceSection = 'dashboard';
  userName = 'User';

  navigation: WorkspaceLink[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Employees', route: '/employees', icon: 'badge' },
    { label: 'Travel Authorisations', route: '/travel-authorisations', icon: 'flight_takeoff' },
    { label: 'Claims', route: '/claims', icon: 'receipt_long' },
    { label: 'Mileage', route: '/mileage', icon: 'directions_car' },
    { label: 'Approvals', route: '/approvals', icon: 'task_alt' },
    { label: 'Finance', route: '/finance', icon: 'payments' },
    { label: 'Reports', route: '/reports', icon: 'bar_chart' },
    { label: 'Admin', route: '/admin', icon: 'admin_panel_settings' },
    { label: 'Audit Logs', route: '/audit-logs', icon: 'history' },
  ];

  metrics: MetricCard[] = [
    { label: 'Total claims submitted', value: '128', tone: 'neutral' },
    { label: 'Pending approvals', value: '24', tone: 'warning' },
    { label: 'Approved claims', value: '76', tone: 'success' },
    { label: 'Rejected claims', value: '8', tone: 'danger' },
    { label: 'Paid claims', value: '63', tone: 'success' },
    { label: 'Awaiting logistics', value: '11', tone: 'warning' },
    { label: 'Awaiting finance', value: '17', tone: 'warning' },
    { label: 'Total claim value', value: 'R 486,920', tone: 'neutral' },
  ];

  employeeFields = [
    'Employee ID',
    'PERSAL number',
    'Initials',
    'Surname',
    'Cellphone',
    'Email',
    'Department',
    'Directorate',
    'Region',
    'Rank',
    'Supervisor',
    'Cost centre',
  ];

  financeQueue = [
    { reference: 'ST-2026-0041', employee: 'N. Mokoena', status: 'Finance Approved', amount: 'R 4,850.00' },
    { reference: 'ST-2026-0048', employee: 'P. Dlamini', status: 'Awaiting Finance', amount: 'R 1,920.00' },
    { reference: 'ST-2026-0050', employee: 'K. Naidoo', status: 'Logistics Verified', amount: 'R 7,315.50' },
  ];

  auditEvents = [
    { action: 'Submitted', subject: 'ST-2026-0050', actor: 'Employee', time: '2026-05-26 09:12' },
    { action: 'Logistics Verified', subject: 'ST-2026-0048', actor: 'Logistics', time: '2026-05-26 08:40' },
    { action: 'Document uploaded', subject: 'Google Maps proof', actor: 'Employee', time: '2026-05-25 16:22' },
    { action: 'Tariff updated', subject: 'Circular 292 rates', actor: 'Admin', time: '2026-05-25 14:08' },
  ];

  allocationCodes = [
    '0436',
    '0717',
    '0462',
    '0463',
    '0497',
    '0498',
    '0499',
    '0469',
    '0470',
    '0515',
    '0494',
    '0588',
    '0674',
    '0614',
    '0476',
    '0477',
    '0473',
    '0444',
    '0500',
    '0501',
    '0589',
    '0464',
    '0465',
    '0504',
    '0650',
    '0043',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    const user = this.authService.getUser();
    this.userName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'User';

    this.route.data.subscribe((data) => {
      this.section = (data['section'] || 'dashboard') as WorkspaceSection;
    });
  }

  get title(): string {
    if (this.section === 'employees') return 'Employee Management';
    if (this.section === 'finance') return 'Finance Processing';
    if (this.section === 'audit-logs') return 'Audit Trail';
    return 'S&T Dashboard';
  }

  get description(): string {
    if (this.section === 'employees') return 'Admin CRUD surface for PERSAL-linked employee records and reporting lines.';
    if (this.section === 'finance') return 'Finance queue for verified claims, payment readiness, and paid-claim closure.';
    if (this.section === 'audit-logs') return 'Immutable event timeline for submissions, approvals, document uploads, and configuration changes.';
    return 'Enterprise overview for travel authorisations, subsistence claims, mileage, logistics, finance, and compliance.';
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
